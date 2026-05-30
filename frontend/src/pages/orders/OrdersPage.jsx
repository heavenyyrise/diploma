import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { orders as ordersApi, clients as clientsApi, services as servicesApi } from '../../api'
import { Card, PageHeader, Badge, Button, Modal, Field, inputStyle, Table, EmptyState, Pagination, PAGE_SIZE, formatMoney, formatDate } from '../../components/ui'
import ClientSelect from '../../components/ui/ClientSelect'
import { applyServiceToggle, calcServicesPrice, PriceAutoHint } from '../../utils/orderPrice'
import { getStatusDeadlineError } from '../../utils/orderStatus'
import { CreateClientModal } from '../clients/ClientsPage'

const STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершён' },
  { value: 'frozen', label: 'Заморожен' },
  { value: 'cancelled', label: 'Отменён' },
]

export default function OrdersPage() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '', lead_source: '', deadline_from: '', deadline_to: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [servicesList, setServicesList] = useState([])
  const [leadSources, setLeadSources] = useState([])
  const navigate = useNavigate()

  useEffect(() => { setPage(1) }, [filters])

  const load = useCallback(() => {
    const p = { page }
    if (filters.status) p.status = filters.status
    if (filters.search) p.search = filters.search
    if (filters.lead_source) p.lead_source = filters.lead_source
    if (filters.deadline_from) p.deadline_from = filters.deadline_from
    if (filters.deadline_to) p.deadline_to = filters.deadline_to
    setLoading(true)
    ordersApi.list(p).then(r => {
      const payload = r.data
      setData(payload.results || payload)
      setTotal(payload.count ?? (payload.results || payload).length)
    }).finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    servicesApi.list().then(r => setServicesList(r.data.results || r.data))
    clientsApi.leadSources().then(r => setLeadSources(r.data.results || r.data))
  }, [])

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }))

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

      <Card style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="filter-bar">
          {[
            { label: 'Поиск', grow: true, el: <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Название, клиент..." style={inputStyle} /> },
            { label: 'Статус', el: <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select> },
            { label: 'Источник клиента', el: (
              <select value={filters.lead_source} onChange={e => setFilter('lead_source', e.target.value)} style={inputStyle}>
                <option value="">Все источники</option>
                {leadSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )},
            { label: 'Дедлайн от', el: <input type="date" value={filters.deadline_from} onChange={e => setFilter('deadline_from', e.target.value)} style={inputStyle} /> },
            { label: 'Дедлайн до', el: <input type="date" value={filters.deadline_to} onChange={e => setFilter('deadline_to', e.target.value)} style={inputStyle} /> },
          ].map(({ label, el, grow }) => (
            <div key={label} className={`filter-field${grow ? ' filter-field-grow' : ''}`}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
              {el}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        {loading
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
          : <>
            <Table columns={columns} data={data} onRowClick={r => navigate(`/orders/${r.id}`)}
              emptyState={<EmptyState icon="📋" title="Заказов нет" subtitle="Создайте первый заказ" action={<Button onClick={() => setShowCreate(true)}>+ Новый заказ</Button>} />} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        }
      </Card>

      <CreateOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); load() }}
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
            <input style={inputStyle} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
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