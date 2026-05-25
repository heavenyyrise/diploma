import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { services as servicesApi } from '../../api'
import { Card, PageHeader, Button, Modal, Field, inputStyle, Badge, formatMoney, formatDate, EmptyState } from '../../components/ui'
import { sanitizeClientName, getClientNameError } from '../../utils/clientName'

export default function ServicesPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [expandedOrders, setExpandedOrders] = useState({})
  const navigate = useNavigate()

  const load = () => { setLoading(true); servicesApi.list().then(r => setData(r.data.results || r.data)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const toggleExpand = async id => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!expandedOrders[id]) {
      const r = await servicesApi.orders(id)
      setExpandedOrders(p => ({ ...p, [id]: r.data }))
    }
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      <PageHeader title="Услуги" subtitle="Ваши предложения" action={<Button onClick={() => setShowCreate(true)}>+ Новая услуга</Button>} />
      {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>}
      {!loading && data.length === 0 && <EmptyState icon="⭐" title="Услуг нет" subtitle="Добавьте ваши услуги" action={<Button onClick={() => setShowCreate(true)}>+ Новая услуга</Button>} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(service => (
          <Card key={service.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', cursor: 'pointer' }} onClick={() => toggleExpand(service.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{service.name}</span>
                  {!service.is_active && <span style={{ fontSize: '0.7rem', background: '#f4f4f5', color: '#71717a', padding: '2px 8px', borderRadius: 20 }}>Неактивна</span>}
                </div>
                {service.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>{service.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                {service.price && <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Базовая цена</div><div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.95rem' }}>{formatMoney(service.price)}</div></div>}
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>В работе</div><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: service.active_orders_count > 0 ? 'var(--info)' : 'var(--text-muted)' }}>{service.active_orders_count}</div></div>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Всего</div><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{service.total_orders_count}</div></div>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', display: 'inline-block', transform: expanded === service.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </div>
            </div>
            {expanded === service.id && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <div style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Активные заказы</div>
                {(expandedOrders[service.id] || []).length === 0
                  ? <div style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет активных заказов</div>
                  : (expandedOrders[service.id] || []).map(o => (
                      <div key={o.id} onClick={() => navigate(`/orders/${o.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderTop: '1px solid var(--border)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{o.title}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{o.client?.name || 'Без клиента'}</div></div>
                        <Badge status={o.status} label={o.status_display} />
                        <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--accent)' }}>{formatMoney(o.price)}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.deadline)}</span>
                      </div>
                    ))
                }
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <ServiceEditInline service={service} onUpdated={load} />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      <CreateServiceModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />
    </div>
  )
}

function ServiceEditInline({ service, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(service)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const del = async () => { if (!confirm('Удалить услугу?')) return; await servicesApi.delete(service.id); onUpdated() }
  const nameError = getClientNameError(form.name, 'Название')
  const save = async () => {
    if (nameError || !form.name?.trim()) return
    setSaving(true)
    try { await servicesApi.update(service.id, form); onUpdated(); setEditing(false) } finally { setSaving(false) }
  }
  if (!editing) return <><Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Редактировать</Button><Button size="sm" variant="danger" onClick={del}>Удалить</Button></>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
        <Field label="Название">
          <input style={inputStyle} value={form.name} onChange={e => set('name', sanitizeClientName(e.target.value))} />
          {nameError && <div style={{ fontSize: '0.82rem', color: 'var(--danger, #dc2626)', marginTop: 6 }}>{nameError}</div>}
        </Field>
        <Field label="Базовая цена"><input style={inputStyle} type="number" value={form.price||''} onChange={e => set('price', e.target.value)} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', marginBottom: 2 }}><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />Активна</label>
      </div>
      <Field label="Описание"><textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
      <div style={{ display: 'flex', gap: 8 }}><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Отмена</Button><Button size="sm" onClick={save} disabled={saving || !!nameError || !form.name?.trim()}>{saving ? '...' : 'Сохранить'}</Button></div>
    </div>
  )
}

function CreateServiceModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', is_active: true })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const nameError = getClientNameError(form.name, 'Название')
  const handle = async () => {
    if (!form.name.trim() || nameError) return
    setLoading(true)
    try { const payload = { ...form }; if (!payload.price) delete payload.price; await servicesApi.create(payload); onCreated(); setForm({ name: '', description: '', price: '', is_active: true }) }
    finally { setLoading(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Новая услуга">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Название" required>
          <input style={inputStyle} value={form.name} onChange={e => set('name', sanitizeClientName(e.target.value))} placeholder="Например: Дизайн логотипа" />
          {nameError && <div style={{ fontSize: '0.82rem', color: 'var(--danger, #dc2626)', marginTop: 6 }}>{nameError}</div>}
        </Field>
        <Field label="Базовая цена (BYN)"><input style={inputStyle} type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" /></Field>
        <Field label="Описание"><textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Что входит в услугу..." /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />Услуга активна</label>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><Button variant="ghost" onClick={onClose}>Отмена</Button><Button onClick={handle} disabled={loading || !form.name.trim() || !!nameError}>{loading ? '...' : 'Создать'}</Button></div>
      </div>
    </Modal>
  )
}
