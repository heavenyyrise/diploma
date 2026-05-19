import { useState, useEffect, useCallback } from 'react'
import { leads as leadsApi, clients as clientsApi, services as servicesApi, orders as ordersApi } from '../../api'
import { Card, PageHeader, Badge, Button, Modal, inputStyle, formatDate, EmptyState } from '../../components/ui'

const STATUS_COLORS = {
  new: 'var(--warning)',
  in_discussion: 'var(--info)',
  accepted: 'var(--success)',
  rejected: 'var(--danger)',
}
const STATUS_LABELS = {
  new: 'Новая',
  in_discussion: 'В обсуждении',
  accepted: 'Принята',
  rejected: 'Отклонена',
}

export default function LeadsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const [clientsList, setClientsList] = useState([])
  const [servicesList, setServicesList] = useState([])

  const load = useCallback(() => {
    setLoading(true)
    leadsApi.list(filter ? { status: filter } : {}).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    clientsApi.list().then(r => setClientsList(r.data.results || r.data))
    servicesApi.list().then(r => setServicesList(r.data.results || r.data))
  }, [])

  const accept = async lead => {
    const r = await leadsApi.accept(lead.id)
    load()
    setSelected(null)
    const serviceIds = lead.services_detail?.map(s => s.id) || []
    setOrderData({
      orderId: r.data.order_id,
      clientId: r.data.client_id,
      title: lead.description?.slice(0, 100) || `Заказ от ${lead.name}`,
      description: lead.description || '',
      price: lead.budget || '',
      deadline: lead.deadline || '',
      services: serviceIds,
    })
    setShowOrderModal(true)
  }

  const reject = async id => { await leadsApi.reject(id); load(); setSelected(null) }

  const discuss = async lead => {
    await leadsApi.update(lead.id, { status: 'in_discussion' })
    load()
    setSelected(null)
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      <PageHeader
        title="Заявки"
        subtitle="Входящие заявки с формы"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ссылка:</span>
            <code onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/form`)}
              style={{ fontSize: '0.8rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'monospace' }}
              title="Скопировать">
              {window.location.origin}/form
            </code>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          ['', 'Все'],
          ['new', 'Новые'],
          ['in_discussion', 'В обсуждении'],
          ['accepted', 'Принятые'],
          ['rejected', 'Отклонённые'],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: '6px 16px', borderRadius: 20, fontSize: '0.82rem', cursor: 'pointer', background: filter === v ? 'var(--accent)' : 'var(--bg-card)', color: filter === v ? '#fff' : 'var(--text-secondary)', border: filter === v ? 'none' : '1px solid var(--border)', fontWeight: filter === v ? 500 : 400 }}>
            {l}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>}
      {!loading && data.length === 0 && <EmptyState icon="📬" title="Заявок нет" subtitle="Заявки появятся когда кто-то заполнит форму" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(lead => (
          <Card key={lead.id} onClick={() => setSelected(lead)}
            style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[lead.status], flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 3 }}>{lead.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.contact_display}
                {lead.lead_source_detail && <> · <span style={{ color: 'var(--accent-dark)' }}>{lead.lead_source_detail.name}</span></>}
                {lead.services_detail?.length > 0 && <> · {lead.services_detail.map(s => s.name).join(', ')}</>}
                {lead.budget && <> · {Number(lead.budget).toLocaleString('ru-RU')} ₽</>}
              </div>
            </div>
            {lead.description && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.description}
              </div>
            )}
            <Badge status={lead.status} label={STATUS_LABELS[lead.status]} />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(lead.created_at)}</div>
          </Card>
        ))}
      </div>

      {selected && (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          onAccept={() => accept(selected)}
          onReject={() => reject(selected.id)}
          onDiscuss={() => discuss(selected)}
          onUpdated={() => { load(); setSelected(null) }}
        />
      )}

      {showOrderModal && orderData && (
        <EditOrderModal
          orderId={orderData.orderId}
          clientId={orderData.clientId}
          initial={orderData}
          clients={clientsList}
          services={servicesList}
          onClose={() => { setShowOrderModal(false); setOrderData(null) }}
        />
      )}
    </div>
  )
}

function EditOrderModal({ orderId, clientId, initial, clients, services, onClose }) {
  const [form, setForm] = useState({
    title: initial.title,
    description: initial.description,
    status: 'in_progress',
    price: initial.price || '',
    deadline: initial.deadline || '',
    client: clientId || '',
    services: initial.services || [],
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleService = id => setForm(p => ({ ...p, services: p.services.includes(id) ? p.services.filter(s => s !== id) : [...p.services, id] }))

  const save = async () => {
    setSaving(true)
    try {
      await ordersApi.update(orderId, {
        title: form.title,
        description: form.description,
        status: form.status,
        price: form.price || 0,
        deadline: form.deadline || null,
        client: form.client || null,
        services: form.services,
      })
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title="Заявка принята — проверьте заказ" width={580}>
      <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--success)' }}>
        ✓ Клиент и заказ созданы. Проверьте и дополните детали.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Название</label>
          <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Клиент</label>
            <select style={inputStyle} value={form.client} onChange={e => set('client', e.target.value)}>
              <option value="">Без клиента</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Статус</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="in_progress">В работе</option>
              <option value="frozen">Заморожен</option>
              <option value="cancelled">Отменён</option>
              <option value="completed">Завершён</option>
            </select>
          </div>
        </div>

        {services.length > 0 && (
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Услуги</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Сумма (₽)</label>
            <input type="number" style={inputStyle} value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Дедлайн</label>
            <input type="date" style={inputStyle} value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Описание / ТЗ</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Закрыть без сохранения</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить заказ'}</Button>
        </div>
      </div>
    </Modal>
  )
}

function LeadDetailModal({ lead, onClose, onAccept, onReject, onDiscuss, onUpdated }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [saving, setSaving] = useState(false)
  const saveNotes = async () => {
    setSaving(true)
    try { await leadsApi.update(lead.id, { notes }); onUpdated() }
    finally { setSaving(false) }
  }

  const isActive = lead.status === 'new' || lead.status === 'in_discussion'

  return (
    <Modal open onClose={onClose} title={`Заявка от ${lead.name}`} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16 }}>
          {[
            ['Имя', lead.name],
            lead.contact_type_detail && ['Контакт', `${lead.contact_type_detail.name}: ${lead.contact_value}`],
            lead.email && ['Email', lead.email],
            lead.lead_source_detail && ['Источник', lead.lead_source_detail.name],
            lead.budget && ['Бюджет', `${Number(lead.budget).toLocaleString('ru-RU')} ₽`],
            lead.deadline && ['Дедлайн', formatDate(lead.deadline)],
            ['Дата заявки', formatDate(lead.created_at)],
            ['Статус', STATUS_LABELS[lead.status]],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>

        {lead.services_detail?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Услуги</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lead.services_detail.map(s => (
                <span key={s.id} style={{ fontSize: '0.82rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '3px 12px', borderRadius: 20, fontWeight: 500 }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {lead.description && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Описание задачи</div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', background: 'var(--bg)', padding: 14, borderRadius: 'var(--radius-sm)' }}>{lead.description}</p>
          </div>
        )}

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Мои заметки</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Заметки по заявке..."
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          <button onClick={saveNotes} disabled={saving}
            style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 500 }}>
            {saving ? 'Сохраняем...' : 'Сохранить заметку'}
          </button>
        </div>

        {isActive && (
          <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <Button variant="danger" onClick={onReject} style={{ flex: 1, justifyContent: 'center' }}>
              Отклонить
            </Button>
            {lead.status === 'new' && (
              <Button variant="ghost" onClick={onDiscuss} style={{ flex: 1, justifyContent: 'center' }}>
                ✦ В обсуждении
              </Button>
            )}
            <Button onClick={onAccept} style={{ flex: 2, justifyContent: 'center' }}>
              ✓ Принять — создать клиента и заказ
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
