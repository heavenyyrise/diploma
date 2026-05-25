import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orders as ordersApi, clients as clientsApi, services as servicesApi } from '../../api'
import { Card, Badge, Button, inputStyle, formatMoney, formatDate } from '../../components/ui'
import { applyServiceToggle, PriceAutoHint } from '../../utils/orderPrice'
import { getStatusDeadlineError } from '../../utils/orderStatus'
import { findClientEmail } from '../../components/messaging/utils'
import EmailHistoryBlock from '../../components/messaging/EmailHistoryBlock'

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

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const loadChangelog = () => {
    ordersApi.changelog(id).then(r => setChangelog(r.data)).catch(() => setChangelog([]))
  }

  const loadAttachments = () => {
    ordersApi.attachments(id).then(r => setAttachments(r.data)).catch(() => setAttachments([]))
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
    loadAttachments()
  }, [id])

  useEffect(() => {
    if (editing) setSaveError(null)
  }, [form.status, form.deadline, editing])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleService = sid => setForm(p => applyServiceToggle(p, sid, servicesList, priceManuallyEdited))

  const startEditing = () => {
    setPriceManuallyEdited(false)
    setSaveError(null)
    setEditing(true)
  }

  const statusError = editing ? getStatusDeadlineError(form.status, form.deadline, order?.created_at) : null

  const save = async () => {
    if (statusError) return
    setSaving(true)
    setSaveError(null)
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
    } catch (err) {
      const msg = err.response?.data?.status?.[0]
        || err.response?.data?.detail
        || 'Не удалось сохранить заказ'
      setSaveError(msg)
    } finally { setSaving(false) }
  }

  const deleteOrder = async () => {
    if (!confirm('Удалить заказ?')) return
    await ordersApi.delete(id)
    navigate('/orders')
  }

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      await ordersApi.uploadAttachment(id, file)
      loadAttachments()
    } catch (err) {
      const msg = err.response?.data?.file?.[0]
        || err.response?.data?.detail
        || 'Не удалось загрузить файл'
      setUploadError(typeof msg === 'string' ? msg : 'Не удалось загрузить файл')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = e => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  const handleDrop = e => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const deleteAttachment = async (attachmentId) => {
    if (!confirm('Удалить вложение?')) return
    await ordersApi.deleteAttachment(id, attachmentId)
    loadAttachments()
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

  const writeToClient = () => {
    if (!client) return
    navigate('/email', {
      state: {
        compose: true,
        clientId: client.id,
        clientName: client.name,
        orderId: Number(id),
        email: findClientEmail(clientDetail?.contacts),
      },
    })
  }

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
          {!editing && client && (
            <Button variant="secondary" onClick={writeToClient}>Написать клиенту</Button>
          )}
          {editing
            ? <><Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button><Button onClick={save} disabled={saving || !!statusError}>{saving ? 'Сохранение...' : 'Сохранить'}</Button></>
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

          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Вложения</h3>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '20px 16px',
                textAlign: 'center',
                background: dragOver ? 'var(--accent-light)' : 'var(--bg)',
                marginBottom: 16,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <input
                type="file"
                id="order-attachment-input"
                accept=".jpg,.jpeg,.png,.pdf,.docx,.zip"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              <label htmlFor="order-attachment-input" style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {uploading ? 'Загрузка...' : 'Перетащите файл сюда или нажмите для выбора'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>JPG, PNG, PDF, DOCX, ZIP · до 10 МБ</div>
              </label>
            </div>
            {uploadError && (
              <div style={{ fontSize: '0.82rem', color: 'var(--danger, #dc2626)', marginBottom: 12 }}>{uploadError}</div>
            )}
            {attachments.length === 0
              ? <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Вложений пока нет</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {attachments.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                      {a.is_image
                        ? (
                          <a href={a.file_url} target="_blank" rel="noopener noreferrer">
                            <img src={a.file_url} alt={a.original_name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                          </a>
                        )
                        : (
                          <div style={{ width: 56, height: 56, borderRadius: 6, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.4rem' }}>📄</div>
                        )
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={a.file_url} download={a.original_name} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none', wordBreak: 'break-word', display: 'block' }}>
                          {a.original_name}
                        </a>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatFileSize(a.file_size)} · {formatDateTime(a.uploaded_at)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteAttachment(a.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px 8px', flexShrink: 0 }}
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )
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
                  ? (
                    <div>
                      <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                      {(statusError || saveError) && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--danger, #dc2626)', marginTop: 6 }}>{statusError || saveError}</div>
                      )}
                    </div>
                  )
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, width: '100%' }}>
                    {order.services_detail.map(s => (
                      <span
                        key={s.id}
                        style={{
                          display: 'inline-block',
                          maxWidth: '100%',
                          fontSize: '0.78rem',
                          lineHeight: 1.4,
                          background: 'var(--accent-light)',
                          color: 'var(--accent-dark)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {s.name}
                      </span>
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

          {!editing && (
            <EmailHistoryBlock orderId={Number(id)} />
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
