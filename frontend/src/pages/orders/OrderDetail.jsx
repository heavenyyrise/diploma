import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orders as ordersApi, clients as clientsApi, services as servicesApi } from '../../api'
import { Card, Badge, Button, inputStyle, formatMoney, formatDate } from '../../components/ui'
import { applyServiceToggle, PriceAutoHint } from '../../utils/orderPrice'

const STATUSES = [
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершён' },
  { value: 'frozen', label: 'Заморожен' },
  { value: 'cancelled', label: 'Отменён' },
]

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [clientDetail, setClientDetail] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [clients, setClients] = useState([])
  const [servicesList, setServicesList] = useState([])
  const [saving, setSaving] = useState(false)
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false)
  const [changelog, setChangelog] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const loadChangelog = () => {
    ordersApi.changelog(id).then(r => setChangelog(r.data)).catch(() => setChangelog([]))
  }

  const loadOrder = () => {
    setLoading(true)
    setLoadError(null)
    ordersApi.get(id)
      .then(r => {
        setOrder(r.data)
        setForm({
          ...r.data,
          client: r.data.client_detail?.id || '',
          services: r.data.services_detail?.map(s => s.id) || [],
        })
        if (r.data.client_detail?.id) {
          clientsApi.get(r.data.client_detail.id).then(cr => setClientDetail(cr.data)).catch(() => setClientDetail(null))
        } else {
          setClientDetail(null)
        }
      })
      .catch(err => {
        setOrder(null)
        setLoadError(err.response?.status === 404
          ? 'Заказ не найден'
          : 'Не удалось загрузить заказ. Убедитесь, что backend запущен (python manage.py runserver).')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrder()
    clientsApi.list().then(r => setClients(r.data.results || r.data)).catch(() => setClients([]))
    servicesApi.list().then(r => setServicesList(r.data.results || r.data)).catch(() => setServicesList([]))
    loadChangelog()
  }, [id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleService = sid => setForm(p => applyServiceToggle(p, sid, servicesList, priceManuallyEdited))

  const startEditing = () => {
    setPriceManuallyEdited(false)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const r = await ordersApi.update(id, {
        title: form.title,
        description: form.description,
        status: form.status,
        price: form.price || 0,
        deadline: form.deadline || null,
        client: form.client || null,
        services: form.services || [],
      })
      setOrder(r.data)
      setEditing(false)
      if (r.data.client_detail?.id) {
        clientsApi.get(r.data.client_detail.id).then(cr => setClientDetail(cr.data))
      } else {
        setClientDetail(null)
      }
      loadChangelog()
    } finally { setSaving(false) }
  }

  const deleteOrder = async () => {
    if (!confirm('Удалить заказ?')) return
    await ordersApi.delete(id)
    navigate('/orders')
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Загрузка...</div>
  if (loadError) return (
    <div style={{ padding: '36px 40px', maxWidth: 1200 }}>
      <button onClick={() => navigate('/orders')} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20, cursor: 'pointer', background: 'none', border: 'none' }}>← Назад к заказам</button>
      <Card style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{loadError}</p>
        <Button onClick={loadOrder}>Повторить</Button>
      </Card>
    </div>
  )
  if (!order) return null

  const client = clientDetail || order.client_detail

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1400 }}>
      <button onClick={() => navigate('/orders')} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20, cursor: 'pointer', background: 'none', border: 'none' }}>← Назад к заказам</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          {editing
            ? <input value={form.title} onChange={e => set('title', e.target.value)} style={{ ...inputStyle, fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 500, width: 420 }} />
            : <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500 }}>{order.title}</h1>
          }
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Badge status={order.status} label={order.status_display} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(order.created_at)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing
            ? <><Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button><Button onClick={save} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button></>
            : <><Button variant="ghost" onClick={startEditing}>Редактировать</Button><Button variant="danger" onClick={deleteOrder}>Удалить</Button></>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px 270px', gap: 20, alignItems: 'start' }}>
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
                  return (
                    <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                      style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: sel ? 500 : 400, background: sel ? 'var(--accent)' : 'var(--bg)', color: sel ? '#fff' : 'var(--text-secondary)', border: sel ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        <Card style={{ padding: 20, alignSelf: 'start' }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>История изменений</h3>
          {changelog.length === 0
            ? <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Изменений пока нет</div>
            : (
              <div>
                {changelog.map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', gap: 10, position: 'relative', paddingBottom: i < changelog.length - 1 ? 16 : 0 }}>
                    {i < changelog.length - 1 && (
                      <div style={{ position: 'absolute', left: 4, top: 12, bottom: 0, width: 2, background: 'var(--border)' }} />
                    )}
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                      background: entry.field === 'created' ? 'var(--accent)' : 'var(--border)',
                      border: entry.field === 'created' ? 'none' : '2px solid var(--accent)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3, lineHeight: 1.4 }}>
                        {formatDateTime(entry.changed_at)}
                        {entry.changed_by_name && entry.changed_by_name !== '—' && (
                          <span> · {entry.changed_by_name}</span>
                        )}
                      </div>
                      {entry.field === 'created' || entry.field === 'description'
                        ? <div style={{ fontSize: '0.82rem', lineHeight: 1.45 }}>{entry.new_value}</div>
                        : (
                          <div style={{ fontSize: '0.82rem', lineHeight: 1.45 }}>
                            <span style={{ fontWeight: 500 }}>{entry.field_label}</span>
                            {': '}
                            <span style={{ color: 'var(--text-muted)' }}>{entry.old_value || '—'}</span>
                            {' → '}
                            <span>{entry.new_value || '—'}</span>
                          </div>
                        )
                      }
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Детали</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Row label="Статус">
                {editing
                  ? <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                  : <Badge status={order.status} label={order.status_display} />
                }
              </Row>

              <Row label="Клиент">
                {editing
                  ? <select value={form.client || ''} onChange={e => set('client', e.target.value || null)} style={inputStyle}>
                      <option value="">Без клиента</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  : order.client_detail
                    ? (
                      <div>
                        <button onClick={() => navigate(`/clients/${order.client_detail.id}`)} style={{ color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.875rem', padding: 0, display: 'block' }}>
                          {order.client_detail.name}
                        </button>
                        {order.client_detail.lead_source_name && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.client_detail.lead_source_name}</span>
                        )}
                      </div>
                    )
                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>—</span>
                }
              </Row>

              {!editing && order.services_detail?.length > 0 && (
                <Row label="Услуги">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {order.services_detail.map(s => (
                      <span key={s.id} style={{ fontSize: '0.78rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '2px 8px', borderRadius: 20 }}>{s.name}</span>
                    ))}
                  </div>
                </Row>
              )}

              <Row label="Сумма">
                {editing
                  ? (
                    <div>
                      <input type="number" value={form.price} onChange={e => { setPriceManuallyEdited(true); set('price', e.target.value) }} style={inputStyle} />
                      <PriceAutoHint selectedIds={form.services} servicesList={servicesList} manual={priceManuallyEdited} />
                    </div>
                  )
                  : <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent)' }}>{formatMoney(order.price)}</span>
                }
              </Row>

              <Row label="Дедлайн">
                {editing
                  ? <input type="date" value={form.deadline || ''} onChange={e => set('deadline', e.target.value)} style={inputStyle} />
                  : <span style={{ fontSize: '0.875rem' }}>{formatDate(order.deadline)}</span>
                }
              </Row>

              {order.completed_at && (
                <Row label="Завершён"><span style={{ fontSize: '0.875rem' }}>{formatDate(order.completed_at)}</span></Row>
              )}
            </div>
          </Card>

          {client && !editing && (
            <Card style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Контакты клиента</h3>
                <button onClick={() => navigate(`/clients/${client.id}`)} style={{ fontSize: '0.78rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Открыть →
                </button>
              </div>
              {clientDetail?.contacts?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {clientDetail.contacts.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', background: 'var(--bg)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 12, flexShrink: 0, border: '1px solid var(--border)' }}>
                        {c.contact_type_name}
                      </span>
                      <span style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>{c.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>У клиента нет контактов</div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}
