import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { clients as clientsApi } from '../../api'
import { Card, Badge, Button, inputStyle, formatMoney, formatDate } from '../../components/ui'
import ContactsEditor from '../../components/ui/ContactsEditor'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [orders, setOrders] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [contacts, setContacts] = useState([])
  const [saving, setSaving] = useState(false)
  const [leadSources, setLeadSources] = useState([])
  const [contactTypes, setContactTypes] = useState([])

  useEffect(() => {
    clientsApi.leadSources().then(r => setLeadSources(r.data.results || r.data))
    clientsApi.contactTypes().then(r => setContactTypes(r.data.results || r.data))
  }, [])

  useEffect(() => {
    clientsApi.get(id).then(r => {
      setClient(r.data)
      setForm(r.data)
      setContacts((r.data.contacts || []).map(c => ({
        id: c.id,
        contact_type: c.contact_type,
        value: c.value,
      })))
    })
    clientsApi.orders(id).then(r => setOrders(r.data))
  }, [id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        lead_source: form.lead_source || null,
        notes: form.notes,
        is_regular: form.is_regular,
        contacts: contacts.filter(c => c.value),
      }
      const r = await clientsApi.update(id, payload)
      setClient(r.data)
      setContacts((r.data.contacts || []).map(c => ({
        id: c.id,
        contact_type: c.contact_type,
        value: c.value,
      })))
      setEditing(false)
    } finally { setSaving(false) }
  }

  const del = async () => {
    if (!confirm('Удалить клиента?')) return
    await clientsApi.delete(id)
    navigate('/clients')
  }

  if (!client) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Загрузка...</div>

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1400 }}>
      <button onClick={() => navigate('/clients')} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20, cursor: 'pointer', background: 'none', border: 'none' }}>← Назад к клиентам</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 600, color: '#fff' }}>
            {client.name[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 500 }}>{client.name}</h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              {client.lead_source_name && (
                <span style={{ fontSize: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '2px 8px', borderRadius: 20 }}>
                  {client.lead_source_name}
                </span>
              )}
              {client.is_regular && (
                <span style={{ fontSize: '0.72rem', background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Постоянный</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing
            ? <><Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button><Button onClick={save} disabled={saving}>{saving ? '...' : 'Сохранить'}</Button></>
            : <><Button variant="ghost" onClick={() => setEditing(true)}>Редактировать</Button><Button variant="danger" onClick={del}>Удалить</Button></>
          }
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[['Всего заказов', client.total_orders], ['Активных', client.active_orders], ['Принёс дохода', formatMoney(client.total_income)]].map(([label, value]) => (
          <Card key={label} style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>{value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Заказы */}
        <Card>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500 }}>История заказов</h3>
          </div>
          {orders.length === 0
            ? <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Заказов нет</div>
            : orders.map((o, i) => (
                <div key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{o.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(o.created_at)}</div>
                  </div>
                  <Badge status={o.status} label={o.status_display} />
                  <span style={{ fontWeight: 500, color: 'var(--accent)', fontSize: '0.875rem' }}>{formatMoney(o.price)}</span>
                </div>
              ))
          }
        </Card>

        {/* Контакты и инфо */}
        <Card style={{ padding: 20, alignSelf: 'start' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            Информация
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {editing ? (
              <>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Имя</div>
                  <input value={form.name || ''} onChange={e => set('name', e.target.value)} style={inputStyle} />
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Источник клиента</div>
                  <select value={form.lead_source || ''} onChange={e => set('lead_source', e.target.value || null)} style={inputStyle}>
                    <option value="">Не указан</option>
                    {leadSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>Контакты для связи</div>
                  <ContactsEditor contacts={contacts} contactTypes={contactTypes} onChange={setContacts} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.is_regular} onChange={e => set('is_regular', e.target.checked)} />
                  Постоянный клиент
                </label>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Заметки</div>
                  <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
                </div>
              </>
            ) : (
              <>
                {/* Контакты */}
                {client.contacts && client.contacts.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>Контакты</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {client.contacts.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', background: 'var(--bg)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 12, flexShrink: 0, border: '1px solid var(--border)' }}>
                            {c.contact_type_name}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Контакты не указаны</div>
                )}

                <InfoRow label="Добавлен" value={formatDate(client.created_at)} />
                {client.notes && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Заметки</div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{client.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.875rem' }}>{value}</div>
    </div>
  )
}
