import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { orders as ordersApi, clients as clientsApi, services as servicesApi } from '../../api'
import { Card, PageHeader, Badge, Button, Modal, Field, DateInput, inputStyle, Table, EmptyState, Pagination, PAGE_SIZE, formatMoney, formatDate, PageLoadPlaceholder } from '../../components/ui'
import ClientSelect from '../../components/ui/ClientSelect'
import { applyServiceToggle, calcServicesPrice, PriceAutoHint } from '../../utils/orderPrice'
import { getStatusDeadlineError } from '../../utils/orderStatus'
import { CreateClientModal } from '../clients/ClientsPage'
import { getTodayIso } from '../../utils/dateInput'
import { usePageCache, readPageCache, writePageCache } from '../../hooks/usePageCache'

const STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершён' },
  { value: 'frozen', label: 'Заморожен' },
  { value: 'cancelled', label: 'Отменён' },
]

const DEFAULT_FILTERS = { status: '', search: '', lead_source: '', deadline_from: '', deadline_to: '', ordering: '-deadline' }

const SORT_OPTIONS = [
  { value: '-deadline', label: 'Сначала новые' },
  { value: 'deadline', label: 'Сначала старые' },
]

const OrdersFilterBar = memo(function OrdersFilterBar({
  filters,
  leadSources,
  deadlineFilterError,
  onFilterChange,
  onDeadlineFilter,
}) {
  return (
    <Card style={{ padding: '16px 20px', marginBottom: 20 }}>
      <div className="filter-bar">
        {[
          { label: 'Поиск', grow: true, el: <input value={filters.search} onChange={e => onFilterChange('search', e.target.value)} placeholder="Название, клиент..." style={inputStyle} /> },
          { label: 'Статус', el: <select value={filters.status} onChange={e => onFilterChange('status', e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select> },
          { label: 'Сортировка', el: (
            <select value={filters.ordering ?? '-deadline'} onChange={e => onFilterChange('ordering', e.target.value)} style={inputStyle}>
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          )},
          { label: 'Источник клиента', el: (
            <select value={filters.lead_source} onChange={e => onFilterChange('lead_source', e.target.value)} style={inputStyle}>
              <option value="">Все источники</option>
              {leadSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )},
        ].map(({ label, el, grow }) => (
          <div key={label} className={`filter-field${grow ? ' filter-field-grow' : ''}`}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
            {el}
          </div>
        ))}
        <div className="filter-deadline-group">
          <div className="filter-deadline-row">
            {[
              { label: 'Дедлайн от', el: <DateInput value={filters.deadline_from} onChange={v => onDeadlineFilter('deadline_from', v)} style={inputStyle} /> },
              { label: 'Дедлайн до', el: <DateInput value={filters.deadline_to} onChange={v => onDeadlineFilter('deadline_to', v)} style={inputStyle} /> },
            ].map(({ label, el }) => (
              <div key={label} className="filter-field">
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
                {el}
              </div>
            ))}
          </div>
          {deadlineFilterError && (
            <div className="filter-deadline-error">{deadlineFilterError}</div>
          )}
        </div>
      </div>
    </Card>
  )
})

const SORT_VALUES = new Set(SORT_OPTIONS.map(s => s.value))

export default function OrdersPage() {
  const [page, setPage] = useState(() => readPageCache('orders:page') ?? 1)
  const [filters, setFilters] = useState(() => {
    const cached = { ...DEFAULT_FILTERS, ...(readPageCache('orders:filters') ?? {}) }
    if (!SORT_VALUES.has(cached.ordering)) cached.ordering = DEFAULT_FILTERS.ordering
    return cached
  })
  const [deadlineFilterError, setDeadlineFilterError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { writePageCache('orders:page', page) }, [page])
  useEffect(() => { writePageCache('orders:filters', filters) }, [filters])

  const skipPageReset = useRef(true)
  useEffect(() => {
    if (skipPageReset.current) {
      skipPageReset.current = false
      return
    }
    setPage(1)
  }, [filters])

  const metaLoader = useCallback(async () => {
    const [servicesRes, sourcesRes] = await Promise.all([
      servicesApi.list(),
      clientsApi.leadSources(),
    ])
    return {
      services: servicesRes.data.results || servicesRes.data,
      leadSources: sourcesRes.data.results || sourcesRes.data,
    }
  }, [])

  const { data: meta } = usePageCache('orders:meta', metaLoader)
  const servicesList = meta?.services ?? []
  const leadSources = meta?.leadSources ?? []

  const cacheKey = useMemo(
    () => `orders:${page}:${filters.status}:${filters.search}:${filters.lead_source}:${filters.deadline_from}:${filters.deadline_to}:${filters.ordering ?? '-deadline'}`,
    [page, filters],
  )

  const loader = useCallback(async () => {
    const p = { page }
    if (filters.status) p.status = filters.status
    if (filters.search) p.search = filters.search
    if (filters.lead_source) p.lead_source = filters.lead_source
    if (filters.deadline_from) p.deadline_from = filters.deadline_from
    if (filters.deadline_to) p.deadline_to = filters.deadline_to
    if (filters.ordering) p.ordering = filters.ordering
    const r = await ordersApi.list(p)
    const payload = r.data
    return {
      items: payload.results || payload,
      total: payload.count ?? (payload.results || payload).length,
    }
  }, [filters, page])

  const { data, loading, refresh } = usePageCache(cacheKey, loader)
  const list = data?.items ?? []
  const total = data?.total ?? 0

  const setFilter = useCallback((k, v) => setFilters(p => ({ ...p, [k]: v })), [])

  const setDeadlineFilter = useCallback((field, value) => {
    if (!value) {
      setDeadlineFilterError(null)
      setFilters(p => ({ ...p, [field]: '' }))
      return
    }

    const today = getTodayIso()

    if (field === 'deadline_from') {
      if (value > today) {
        setDeadlineFilterError('Дата «от» не может быть в будущем')
        setFilters(p => ({ ...p, deadline_from: '' }))
        return
      }
      setFilters(p => {
        if (p.deadline_to && value > p.deadline_to) {
          setDeadlineFilterError('Дата «до» не может быть раньше даты «от»')
          return { ...p, deadline_from: '', deadline_to: '' }
        }
        setDeadlineFilterError(null)
        return { ...p, deadline_from: value }
      })
      return
    }

    setFilters(p => {
      if (p.deadline_from && value < p.deadline_from) {
        setDeadlineFilterError('Дата «до» не может быть раньше даты «от»')
        return { ...p, deadline_from: '', deadline_to: '' }
      }
      setDeadlineFilterError(null)
      return { ...p, deadline_to: value }
    })
  }, [])

  const columns = [
    { key: 'title', label: 'Название', render: r => <span style={{ fontWeight: 500 }}>{r.title}</span> },
    { key: 'client', label: 'Клиент', render: r => r.client ? (
      <div>
        <div>{r.client.name}</div>
        {r.client.lead_source_name && (
          <span style={{ fontSize: '0.7rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '1px 6px', borderRadius: 10 }}>
            {r.client.lead_source_name}
          </span>
        )}
      </div>
    ) : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'services', label: 'Услуги', render: r => r.services?.length ? <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{r.services.map(s => s.name).join(', ')}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'status', label: 'Статус', render: r => <Badge status={r.status} label={r.status_display} />, nowrap: true },
    { key: 'price', label: 'Сумма', render: r => <span style={{ fontWeight: 500, color: 'var(--accent)' }}>{formatMoney(r.price)}</span>, nowrap: true },
    { key: 'deadline', label: 'Дедлайн', render: r => formatDate(r.deadline), muted: true, nowrap: true },
  ]

  return (
    <div className="page">
      <PageHeader title="Заказы" subtitle="Все ваши проекты" action={<Button onClick={() => setShowCreate(true)}>+ Новый заказ</Button>} />

      <OrdersFilterBar
        filters={filters}
        leadSources={leadSources}
        deadlineFilterError={deadlineFilterError}
        onFilterChange={setFilter}
        onDeadlineFilter={setDeadlineFilter}
      />

      <Card>
        {loading && !list.length
          ? <PageLoadPlaceholder rows={4} />
          : <>
            <Table columns={columns} data={list} onRowClick={r => navigate(`/orders/${r.id}`)}
              emptyState={<EmptyState icon="📋" title="Заказов нет" subtitle="Создайте первый заказ" action={<Button onClick={() => setShowCreate(true)}>+ Новый заказ</Button>} />} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        }
      </Card>

      <CreateOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); refresh({ silent: true }) }}
        services={servicesList}
      />
    </div>
  )
}

export function CreateOrderModal({ open, onClose, onCreated, services, initialData }) {
  const [form, setForm] = useState({ title: '', client: '', services: [], description: '', status: 'in_progress', price: '', deadline: '' })
  const [loading, setLoading] = useState(false)
  const [showCreateClient, setShowCreateClient] = useState(false)
  const [leadSources, setLeadSources] = useState([])
  const [contactTypes, setContactTypes] = useState([])
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false)
  const [createdClient, setCreatedClient] = useState(null)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (open) {
      setPriceManuallyEdited(false)
      setCreatedClient(null)
      setForm({ title: '', client: '', services: [], description: '', status: 'in_progress', price: '', deadline: '', ...initialData })
      clientsApi.leadSources().then(r => setLeadSources(r.data.results || r.data))
      clientsApi.contactTypes().then(r => setContactTypes(r.data.results || r.data))
    }
  }, [open])

  useEffect(() => {
    if (open && form.services?.length && services.length && !priceManuallyEdited) {
      setForm(p => ({ ...p, price: calcServicesPrice(p.services, services) }))
    }
  }, [open, services])

  const toggleService = id => setForm(p => applyServiceToggle(p, id, services, priceManuallyEdited))
  const statusError = getStatusDeadlineError(form.status, form.deadline, null)

  const handle = async () => {
    if (!form.title) return
    setLoading(true)
    try {
      const payload = { title: form.title, description: form.description, status: form.status, price: form.price || 0, services: form.services }
      if (form.client) payload.client = form.client
      if (form.deadline) payload.deadline = form.deadline
      const r = await ordersApi.create(payload)
      onCreated(r.data)
      setForm({ title: '', client: '', services: [], description: '', status: 'in_progress', price: '', deadline: '' })
    } finally { setLoading(false) }
  }

  const handleClientCreated = async () => {
    const r = await clientsApi.list()
    const updated = r.data.results || r.data
    if (updated.length > 0) {
      const newest = updated[0]
      setCreatedClient({ value: String(newest.id), label: newest.lead_source_name ? `${newest.name} (${newest.lead_source_name})` : newest.name })
      set('client', String(newest.id))
    }
    setShowCreateClient(false)
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Новый заказ" width={580}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Название" required>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Название проекта" />
          </Field>

          <ClientSelect
            value={form.client}
            onChange={v => set('client', v)}
            extraOptions={createdClient ? [createdClient] : []}
          />
          <button type="button" onClick={() => setShowCreateClient(true)}
            style={{ alignSelf: 'flex-start', marginTop: -8, fontSize: '0.8rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
            + Создать нового клиента
          </button>

          {services.length > 0 && (
            <Field label="Услуги">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', minHeight: 42 }}>
                {services.map(s => {
                  const sel = form.services.includes(s.id)
                  return (
                    <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                      style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: sel ? 500 : 400, background: sel ? 'var(--accent)' : 'var(--bg)', color: sel ? '#fff' : 'var(--text-secondary)', border: sel ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </Field>
          )}

          <div className="grid-form-2">
            <Field label="Статус">
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="in_progress">В работе</option>
                <option value="frozen">Заморожен</option>
                <option value="cancelled">Отменён</option>
                <option value="completed">Завершён</option>
              </select>
              {statusError && (
                <div style={{ fontSize: '0.82rem', color: 'var(--danger, #dc2626)', marginTop: 6 }}>{statusError}</div>
              )}
            </Field>
            <Field label="Сумма (BYN)">
              <input style={inputStyle} type="number" value={form.price} onChange={e => { setPriceManuallyEdited(true); set('price', e.target.value) }} placeholder="0" />
              <PriceAutoHint selectedIds={form.services} servicesList={services} manual={priceManuallyEdited} />
            </Field>
          </div>

          <Field label="Дедлайн">
            <DateInput style={inputStyle} value={form.deadline} onChange={v => set('deadline', v)} />
          </Field>

          <Field label="Описание / ТЗ">
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Техническое задание..." />
          </Field>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
            <Button onClick={handle} disabled={loading || !form.title || !!statusError}>{loading ? 'Сохраняем...' : 'Создать заказ'}</Button>
          </div>
        </div>
      </Modal>

      <CreateClientModal
        open={showCreateClient}
        onClose={() => setShowCreateClient(false)}
        onCreated={handleClientCreated}
        leadSources={leadSources}
        contactTypes={contactTypes}
      />
    </>
  )
}