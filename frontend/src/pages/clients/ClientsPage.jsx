import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clients as clientsApi } from '../../api'
import { Card, PageHeader, Button, Modal, Field, inputStyle, Table, EmptyState, Pagination, PAGE_SIZE, formatDate, formatMoney } from '../../components/ui'
import ContactsEditor from '../../components/ui/ContactsEditor'
import { sanitizeClientName, getClientNameError } from '../../utils/clientName'
import { hasContactErrors, normalizeContacts } from '../../utils/contactValue'

export default function ClientsPage() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [incomeSort, setIncomeSort] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [leadSources, setLeadSources] = useState([])
  const [contactTypes, setContactTypes] = useState([])
  const navigate = useNavigate()

  useEffect(() => { setPage(1) }, [search, incomeSort])

  const load = useCallback(() => {
    setLoading(true)
    const params = { ordering: incomeSort || '-created_at', page }
    if (search) params.search = search
    clientsApi.list(params).then(r => {
      const payload = r.data
      setData(payload.results || payload)
      setTotal(payload.count ?? (payload.results || payload).length)
    }).finally(() => setLoading(false))
  }, [search, incomeSort, page])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    clientsApi.leadSources().then(r => setLeadSources(r.data.results || r.data))
    clientsApi.contactTypes().then(r => setContactTypes(r.data.results || r.data))
  }, [])

  const columns = [
    { key: 'name', label: 'Имя', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'primary_contact', label: 'Контакт', render: r => r.primary_contact || <span style={{ color: 'var(--text-muted)' }}>—</span>, muted: true },
    { key: 'lead_source_name', label: 'Источник', render: r => r.lead_source_name ? <span style={{ fontSize: '0.78rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '2px 8px', borderRadius: 20 }}>{r.lead_source_name}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'is_regular', label: 'Тип', render: r => r.is_regular ? <span style={{ fontSize: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Постоянный</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Разовый</span> },
    { key: 'total_orders', label: 'Заказов', muted: true },
    { key: 'total_income', label: 'Доход', render: r => <span style={{ fontWeight: 500, color: r.total_income > 0 ? 'var(--accent)' : undefined }}>{r.total_income > 0 ? formatMoney(r.total_income) : '—'}</span> },
    { key: 'created_at', label: 'Добавлен', render: r => formatDate(r.created_at), muted: true, nowrap: true },
  ]

  return (
    <div className="page">
      <PageHeader title="Клиенты" subtitle="Ваши заказчики" action={<Button onClick={() => setShowCreate(true)}>+ Новый клиент</Button>} />
      <Card style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="filter-bar">
          {[
            {
              label: 'Поиск',
              grow: true,
              el: <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Имя, контакт..." style={inputStyle} />,
            },
            {
              label: 'Доход от клиента',
              el: (
                <select
                  value={incomeSort}
                  onChange={e => setIncomeSort(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Все</option>
                  <option value="-income_total">По убыванию</option>
                  <option value="income_total">По возрастанию</option>
                </select>
              ),
            },
          ].map(({ label, el, grow }) => (
            <div key={label} className={`filter-field${grow ? ' filter-field-grow' : ''}`}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
              {el}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
          : <>
            <Table columns={columns} data={data} onRowClick={r => navigate(`/clients/${r.id}`)} emptyState={<EmptyState icon="👥" title="Клиентов нет" subtitle="Добавьте первого клиента" action={<Button onClick={() => setShowCreate(true)}>+ Новый клиент</Button>} />} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        }
      </Card>
      <CreateClientModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} leadSources={leadSources} contactTypes={contactTypes} />
    </div>
  )
}

export function CreateClientModal({ open, onClose, onCreated, leadSources = [], contactTypes = [] }) {
  const [form, setForm] = useState({ name: '', lead_source: '', notes: '', is_regular: false })
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (open) {
      setForm({ name: '', lead_source: '', notes: '', is_regular: false })
      setContacts([])
    }
  }, [open])

  const nameError = getClientNameError(form.name)
  const contactsError = hasContactErrors(contacts, contactTypes)

  const handle = async () => {
    if (!form.name.trim() || nameError || contactsError) return
    setLoading(true)
    try {
      const normalizedContacts = normalizeContacts(contacts, contactTypes)
      const payload = {
        name: form.name,
        notes: form.notes,
        is_regular: form.is_regular,
        contacts: normalizedContacts.filter(c => c.value),
      }
      if (form.lead_source) payload.lead_source = form.lead_source
      await clientsApi.create(payload)
      onCreated()
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый клиент" width={540}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Имя" required>
          <input style={inputStyle} value={form.name} onChange={e => set('name', sanitizeClientName(e.target.value))} placeholder="Иван Иванов" />
          {nameError && (
            <div style={{ fontSize: '0.82rem', color: 'var(--danger, #dc2626)', marginTop: 6 }}>{nameError}</div>
          )}
        </Field>

        <Field label="Источник клиента">
          <select style={inputStyle} value={form.lead_source} onChange={e => set('lead_source', e.target.value)}>
            <option value="">Не указан</option>
            {leadSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="Контакты для связи">
          <ContactsEditor contacts={contacts} contactTypes={contactTypes} onChange={setContacts} />
        </Field>

        <Field label="Заметки"><textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}><input type="checkbox" checked={form.is_regular} onChange={e => set('is_regular', e.target.checked)} />Постоянный клиент</label>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={handle} disabled={loading || !form.name.trim() || !!nameError || contactsError}>{loading ? '...' : 'Добавить'}</Button>
        </div>
      </div>
    </Modal>
  )
}
