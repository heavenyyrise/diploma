import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { orders as ordersApi, clients as clientsApi, services as servicesApi } from '../../api'
import { Card, PageHeader, Badge, Button, Modal, Field, inputStyle, Table, EmptyState, formatMoney, formatDate } from '../../components/ui'

const STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершён' },
  { value: 'frozen', label: 'Заморожен' },
  { value: 'cancelled', label: 'Отменён' },
]

export default function OrdersPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', search: '', lead_source: '', deadline_from: '', deadline_to: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [clientsList, setClientsList] = useState([])
  const [servicesList, setServicesList] = useState([])
  const [leadSources, setLeadSources] = useState([])
  const navigate = useNavigate()

  const load = useCallback(() => {
    const p = {}
    if (filters.status) p.status = filters.status
    if (filters.search) p.search = filters.search
    if (filters.lead_source) p.lead_source = filters.lead_source
    if (filters.deadline_from) p.deadline_from = filters.deadline_from
    if (filters.deadline_to) p.deadline_to = filters.deadline_to
    setLoading(true)
    ordersApi.list(p).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    clientsApi.list().then(r => setClientsList(r.data.results || r.data))
    servicesApi.list().then(r => setServicesList(r.data.results || r.data))
    clientsApi.leadSources().then(r => setLeadSources(r.data.results || r.data))
  }, [])

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }))
  const hasFilters = filters.status || filters.search || filters.lead_source || filters.deadline_from || filters.deadline_to

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
    <div style={{ padding: '36px 40px' }}>
      <PageHeader title="Заказы" subtitle="Все ваши проекты" action={<Button onClick={() => setShowCreate(true)}>+ Новый заказ</Button>} />

      <Card style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'Поиск', el: <input value={filters.search} onChange={e => setFilter('search', e.target.value)} placeholder="Название, клиент..." style={{ ...inputStyle, width: 200 }} /> },
            { label: 'Статус', el: <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ ...inputStyle, width: 150 }}>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select> },
            { label: 'Источник клиента', el: (
              <select value={filters.lead_source} onChange={e => setFilter('lead_source', e.target.value)} style={{ ...inputStyle, width: 160 }}>
                <option value="">Все источники</option>
                {leadSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )},
            { label: 'Дедлайн от', el: <input type="date" value={filters.deadline_from} onChange={e => setFilter('deadline_from', e.target.value)} style={{ ...inputStyle, width: 150 }} /> },
            { label: 'Дедлайн до', el: <input type="date" value={filters.deadline_to} onChange={e => setFilter('deadline_to', e.target.value)} style={{ ...inputStyle, width: 150 }} /> },
          ].map(({ label, el }) => (
            <div key={label}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
              {el}
            </div>
          ))}
          {hasFilters && (
            <button onClick={() => setFilters({ status: '', search: '', lead_source: '', deadline_from: '', deadline_to: '' })}
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', alignSelf: 'flex-end', paddingBottom: 2 }}>
              Сбросить
            </button>
          )}
        </div>
      </Card>

      <Card>
        {loading
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
          : <Table columns={columns} data={data} onRowClick={r => navigate(`/orders/${r.id}`)}
              emptyState={<EmptyState icon="📋" title="Заказов нет" subtitle="Создайте первый заказ" action={<Button onClick={() => setShowCreate(true)}>+ Новый заказ</Button>} />} />
        }
      </Card>

      <CreateOrderModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} clients={clientsList} services={servicesList} />
    </div>
  )
}

export function CreateOrderModal({ open, onClose, onCreated, clients, services, initialData }) {
  const [form, setForm] = useState({ title: '', client: '', services: [], description: '', status: 'in_progress', price: '', deadline: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (open) setForm({ title: '', client: '', services: [], description: '', status: 'in_progress', price: '', deadline: '', ...initialData })
  }, [open])

  const toggleService = id => setForm(p => ({ ...p, services: p.services.includes(id) ? p.services.filter(s => s !== id) : [...p.services, id] }))

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

  return (
    <Modal open={open} onClose={onClose} title="Новый заказ" width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Название" required>
          <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Название проекта" />
        </Field>

        <Field label="Клиент">
          <select style={inputStyle} value={form.client} onChange={e => set('client', e.target.value)}>
            <option value="">Без клиента</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.lead_source_name ? ` (${c.lead_source_name})` : ''}</option>)}
          </select>
        </Field>

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Статус">
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="in_progress">В работе</option>
              <option value="frozen">Заморожен</option>
              <option value="cancelled">Отменён</option>
              <option value="completed">Завершён</option>
            </select>
          </Field>
          <Field label="Сумма (₽)">
            <input style={inputStyle} type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" />
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
          <Button onClick={handle} disabled={loading || !form.title}>{loading ? 'Сохраняем...' : 'Создать заказ'}</Button>
        </div>
      </div>
    </Modal>
  )
}
