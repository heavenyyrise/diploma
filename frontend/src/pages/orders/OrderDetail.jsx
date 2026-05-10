import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orders as ordersApi, clients as clientsApi, services as servicesApi } from '../../api'
import { Card, Badge, Button, inputStyle, formatMoney, formatDate } from '../../components/ui'

const STATUSES = [{ value: 'in_progress', label: 'В работе' }, { value: 'completed', label: 'Завершён' }, { value: 'frozen', label: 'Заморожен' }, { value: 'cancelled', label: 'Отменён' }]

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [clients, setClients] = useState([])
  const [servicesList, setServicesList] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ordersApi.get(id).then(r => {
      setOrder(r.data)
      setForm({ ...r.data, client: r.data.client_detail?.id || '', services: r.data.services_detail?.map(s => s.id) || [] })
    })
    clientsApi.list().then(r => setClients(r.data.results || r.data))
    servicesApi.list().then(r => setServicesList(r.data.results || r.data))
  }, [id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleService = sid => setForm(p => ({ ...p, services: p.services.includes(sid) ? p.services.filter(s => s !== sid) : [...p.services, sid] }))

  const save = async () => {
    setSaving(true)
    try {
      const r = await ordersApi.update(id, { title: form.title, description: form.description, platform: form.platform, status: form.status, price: form.price || 0, deadline: form.deadline || null, client: form.client || null, services: form.services || [] })
      setOrder(r.data)
      setEditing(false)
    } finally { setSaving(false) }
  }

  const deleteOrder = async () => {
    if (!confirm('Удалить заказ?')) return
    await ordersApi.delete(id)
    navigate('/orders')
  }

  if (!order) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Загрузка...</div>

  return (
    <div style={{ padding: '36px 40px', maxWidth: 900 }}>
      <button onClick={() => navigate('/orders')} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20, cursor: 'pointer', background: 'none', border: 'none' }}>← Назад к заказам</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          {editing
            ? <input value={form.title} onChange={e => set('title', e.target.value)} style={{ ...inputStyle, fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 500, width: 420 }} />
            : <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500 }}>{order.title}</h1>
          }
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Badge status={order.status} label={order.status_display} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{order.platform_display} · {formatDate(order.created_at)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing
            ? <><Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button><Button onClick={save} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button></>
            : <><Button variant="ghost" onClick={() => setEditing(true)}>Редактировать</Button><Button variant="danger" onClick={deleteOrder}>Удалить</Button></>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Описание / ТЗ</h3>
            {editing
              ? <textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inputStyle, minHeight: 180, resize: 'vertical' }} placeholder="Техническое задание..." />
              : <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: order.description ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{order.description || 'Описание не указано'}</p>
            }
          </Card>

          {editing && servicesList.length > 0 && (
            <Card style={{ padding: 24 }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Услуги</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {servicesList.map(s => {
                  const sel = (form.services || []).includes(s.id)
                  return <button key={s.id} type="button" onClick={() => toggleService(s.id)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: sel ? 500 : 400, background: sel ? 'var(--accent)' : 'var(--bg)', color: sel ? '#fff' : 'var(--text-secondary)', border: sel ? '1px solid var(--accent)' : '1px solid var(--border)' }}>{s.name}</button>
                })}
              </div>
            </Card>
          )}
        </div>

        <Card style={{ padding: 20, alignSelf: 'start' }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Детали</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Row label="Статус">{editing ? <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select> : <Badge status={order.status} label={order.status_display} />}</Row>
            <Row label="Площадка">{editing ? <select value={form.platform} onChange={e => set('platform', e.target.value)} style={inputStyle}><option value="instagram">Instagram</option><option value="telegram">Telegram</option><option value="kwork">Kwork</option><option value="other">Другое</option></select> : <span style={{ fontSize: '0.875rem' }}>{order.platform_display}</span>}</Row>
            <Row label="Клиент">{editing ? <select value={form.client || ''} onChange={e => set('client', e.target.value || null)} style={inputStyle}><option value="">Без клиента</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select> : order.client_detail ? <button onClick={() => navigate(`/clients/${order.client_detail.id}`)} style={{ color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.875rem', padding: 0 }}>{order.client_detail.name}</button> : <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>—</span>}</Row>
            {!editing && <Row label="Услуги">{order.services_detail?.length > 0 ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{order.services_detail.map(s => <span key={s.id} style={{ fontSize: '0.78rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '2px 8px', borderRadius: 20 }}>{s.name}</span>)}</div> : <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>—</span>}</Row>}
            <Row label="Сумма">{editing ? <input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle} /> : <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent)' }}>{formatMoney(order.price)}</span>}</Row>
            <Row label="Дедлайн">{editing ? <input type="date" value={form.deadline || ''} onChange={e => set('deadline', e.target.value)} style={inputStyle} /> : <span style={{ fontSize: '0.875rem' }}>{formatDate(order.deadline)}</span>}</Row>
            {order.completed_at && <Row label="Завершён"><span style={{ fontSize: '0.875rem' }}>{formatDate(order.completed_at)}</span></Row>}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>{children}</div>
}
