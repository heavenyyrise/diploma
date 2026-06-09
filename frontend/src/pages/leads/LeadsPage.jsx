import { useState, useEffect, useCallback, useMemo } from 'react'
import { leads as leadsApi, services as servicesApi, orders as ordersApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../context/ConfirmContext'
import { publicFormUrl } from '../../utils/publicFormUrl'
import { Card, PageHeader, Badge, Button, Modal, DateInput, inputStyle, formatDate, formatMoney, EmptyState, Pagination, PAGE_SIZE, PageLoadPlaceholder } from '../../components/ui'
import ClientSelect from '../../components/ui/ClientSelect'
import { applyServiceToggle, calcServicesPrice, PriceAutoHint } from '../../utils/orderPrice'
import { usePageCache } from '../../hooks/usePageCache'

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
  const { user } = useAuth()
  const confirm = useConfirm()
  const formLink = publicFormUrl(user?.id)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const [servicesList, setServicesList] = useState([])
  const [clearingRejected, setClearingRejected] = useState(false)

  useEffect(() => { setPage(1) }, [filter])

  const cacheKey = useMemo(() => `leads:${page}:${filter}`, [page, filter])

  const loader = useCallback(async () => {
    const params = { page }
    if (filter) params.status = filter
    const r = await leadsApi.list(params)
    const payload = r.data
    return {
      items: payload.results || payload,
      total: payload.count ?? (payload.results || payload).length,
    }
  }, [filter, page])

  const { data, loading, refresh } = usePageCache(cacheKey, loader)
  const list = data?.items ?? []
  const total = data?.total ?? 0
  useEffect(() => {
    servicesApi.list().then(r => setServicesList(r.data.results || r.data))
  }, [])

  const accept = async lead => {
    const r = await leadsApi.accept(lead.id)
    await refresh({ silent: true })
    setSelected(null)
    const firstService = lead.services_detail?.[0]
    setOrderData({
      orderId: r.data.order_id,
      clientId: r.data.client_id,
      fromLead: true,
      title: firstService?.name || `Заказ от ${lead.name}`,
      description: lead.description || '',
      price: lead.budget || '',
      deadline: lead.deadline || '',
      services: lead.services_detail?.map(s => s.id) || [],
    })
    setShowOrderModal(true)
  }

  const reject = async id => {
    await leadsApi.reject(id)
    await refresh({ silent: true })
    setSelected(null)
  }

  const setDiscuss = async (lead, inDiscussion) => {
    await leadsApi.update(lead.id, { status: inDiscussion ? 'in_discussion' : 'new' })
    await refresh({ silent: true })
    const r = await leadsApi.get(lead.id)
    setSelected(r.data)
  }

  const deleteLead = async lead => {
    if (!await confirm(`Удалить заявку от ${lead.name}?`)) return
    await leadsApi.delete(lead.id)
    await refresh({ silent: true })
    setSelected(null)
  }

  const clearAllRejected = async () => {
    if (!total) return
    if (!await confirm(`Удалить все ${total} отклонённых заявок? Это действие необратимо.`)) return
    setClearingRejected(true)
    try {
      await leadsApi.clearRejected()
      setSelected(null)
      await refresh({ silent: true })
    } finally {
      setClearingRejected(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Заявки"
        subtitle="Входящие заявки с формы"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="hide-mobile" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ссылка:</span>
            <code onClick={() => navigator.clipboard?.writeText(formLink)}
              style={{ fontSize: '0.8rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'monospace', wordBreak: 'break-all' }}
              title="Скопировать">
              {formLink}
            </code>
          </div>
        }
      />

      <div className="leads-filter-wrap">
        <div className="filter-tabs">
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
        {filter === 'rejected' && total > 0 && (
          <Button
            type="button"
            className="leads-clear-rejected-btn"
            variant="danger"
            size="sm"
            onClick={clearAllRejected}
            disabled={clearingRejected}
            style={{ flexShrink: 0 }}
          >
            {clearingRejected ? 'Удаляем...' : 'Удалить все отклонённые'}
          </Button>
        )}
      </div>

      {loading && !list.length && <PageLoadPlaceholder rows={3} />}
      {!loading && list.length === 0 && <EmptyState icon="📬" title="Заявок нет" subtitle="Заявки появятся когда кто-то заполнит форму" />}

      <div className="page-stack">
        {list.map(lead => (
          <Card key={lead.id} onClick={() => setSelected(lead)} className="lead-card">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[lead.status], flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: 3 }}>{lead.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.contact_display}
                {lead.lead_source_detail && <> · <span style={{ color: 'var(--accent-dark)' }}>{lead.lead_source_detail.name}</span></>}
                {lead.services_detail?.length > 0 && <> · {lead.services_detail.map(s => s.name).join(', ')}</>}
                {lead.budget && <> · {formatMoney(lead.budget)}</>}
              </div>
            </div>
            {lead.description && (
              <div className="lead-card-desc" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.description}
              </div>
            )}
            <Badge status={lead.status} label={STATUS_LABELS[lead.status]} />
            <div className="list-row-meta hide-sm">{formatDate(lead.created_at)}</div>
          </Card>
        ))}
      </div>

      {list.length > 0 && (
        <Card style={{ marginTop: 10, padding: 0 }}>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </Card>
      )}

      {selected && (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          onAccept={() => accept(selected)}
          onReject={() => reject(selected.id)}
          onDiscuss={inDiscussion => setDiscuss(selected, inDiscussion)}
          onUpdated={async () => { await refresh({ silent: true }); setSelected(null) }}
          onDelete={() => deleteLead(selected)}
        />
      )}

      {showOrderModal && orderData && (
        <EditOrderModal
          orderId={orderData.orderId}
          clientId={orderData.clientId}
          initial={orderData}
          services={servicesList}
          onClose={() => { setShowOrderModal(false); setOrderData(null) }}
        />
      )}
    </div>
  )
}

function EditOrderModal({ orderId, clientId, initial, services, onClose }) {
  const fromLead = initial.fromLead
  const [form, setForm] = useState({
    title: initial.title,
    description: initial.description,
    status: 'in_progress',
    price: initial.price || '',
    deadline: initial.deadline || '',
    client: clientId ? String(clientId) : '',
    services: initial.services || [],
  })
  const [saving, setSaving] = useState(false)
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleService = id => setForm(p => applyServiceToggle(p, id, services, priceManuallyEdited))
  const leadClientOption = fromLead && clientId
    ? [{ value: String(clientId), label: 'Из заявки' }]
    : []

  useEffect(() => {
    if (initial.services?.length && services.length) {
      setForm(p => ({ ...p, price: calcServicesPrice(initial.services, services) }))
    }
  }, [services])

  const save = async () => {
    setSaving(true)
    try {
      await ordersApi.update(orderId, {
        title: form.title,
        description: form.description,
        status: form.status,
        price: form.price || 0,
        deadline: form.deadline || null,
        client: form.client ? Number(form.client) : null,
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
        <div className="grid-form-2">
          <ClientSelect value={form.client} onChange={v => set('client', v)} extraOptions={leadClientOption} />
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

        <div className="grid-form-2">
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Сумма (BYN)</label>
            <input type="number" style={inputStyle} value={form.price} onChange={e => { setPriceManuallyEdited(true); set('price', e.target.value) }} placeholder="0" />
            <PriceAutoHint selectedIds={form.services} servicesList={services} manual={priceManuallyEdited} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Дедлайн</label>
            <DateInput style={inputStyle} value={form.deadline} onChange={v => set('deadline', v)} />
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

function LeadDetailModal({ lead, onClose, onAccept, onReject, onDiscuss, onUpdated, onDelete }) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [saving, setSaving] = useState(false)
  const [togglingDiscuss, setTogglingDiscuss] = useState(false)
  const saveNotes = async () => {
    setSaving(true)
    try { await leadsApi.update(lead.id, { notes }); onUpdated() }
    finally { setSaving(false) }
  }

  const isActive = lead.status === 'new' || lead.status === 'in_discussion'

  return (
    <Modal open onClose={onClose} title={`Заявка от ${lead.name}`} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="grid-form-2" style={{ gap: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16 }}>
          {[
            ['Имя', lead.name],
            lead.contact_type_detail && ['Контакт', `${lead.contact_type_detail.name}: ${lead.contact_value}`],
            lead.email && ['Email', lead.email],
            lead.lead_source_detail && ['Источник', lead.lead_source_detail.name],
            lead.budget && ['Бюджет', formatMoney(lead.budget)],
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
          {isActive && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: togglingDiscuss ? 'wait' : 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={lead.status === 'in_discussion'}
                disabled={togglingDiscuss}
                onChange={async e => {
                  setTogglingDiscuss(true)
                  try { await onDiscuss(e.target.checked) }
                  finally { setTogglingDiscuss(false) }
                }}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: togglingDiscuss ? 'wait' : 'pointer' }}
              />
              В обсуждении
            </label>
          )}
        </div>

        {isActive && (
          <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <Button variant="danger" onClick={onReject} style={{ flex: 1, justifyContent: 'center' }}>
              Отклонить
            </Button>
            <Button onClick={onAccept} style={{ flex: 2, justifyContent: 'center' }}>
              Принять — создать клиента и заказ
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <Button variant="danger" onClick={onDelete}>Удалить</Button>
        </div>
      </div>
    </Modal>
  )
}
