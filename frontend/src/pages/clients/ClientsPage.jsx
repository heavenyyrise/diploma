import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clients as clientsApi } from '../../api'
import { Card, PageHeader, Button, Modal, Field, inputStyle, Table, EmptyState, formatDate } from '../../components/ui'

export default function ClientsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    clientsApi.list(search ? { search } : {}).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'name', label: 'Имя', render: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
    { key: 'username', label: 'Ник', render: r => r.username ? <span style={{ color: 'var(--text-secondary)' }}>@{r.username}</span> : '—', muted: true },
    { key: 'platform_display', label: 'Площадка', muted: true },
    { key: 'is_regular', label: 'Тип', render: r => r.is_regular ? <span style={{ fontSize: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Постоянный</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Разовый</span> },
    { key: 'total_orders', label: 'Заказов', muted: true },
    { key: 'total_income', label: 'Доход', render: r => <span style={{ fontWeight: 500 }}>{r.total_income > 0 ? `${Number(r.total_income).toLocaleString('ru-RU')} ₽` : '—'}</span> },
    { key: 'created_at', label: 'Добавлен', render: r => formatDate(r.created_at), muted: true, nowrap: true },
  ]

  return (
    <div style={{ padding: '36px 40px' }}>
      <PageHeader title="Клиенты" subtitle="Ваши заказчики" action={<Button onClick={() => setShowCreate(true)}>+ Новый клиент</Button>} />
      <Card style={{ padding: '16px 20px', marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени, нику, email..." style={{ ...inputStyle, width: 300 }} />
      </Card>
      <Card>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
          : <Table columns={columns} data={data} onRowClick={r => navigate(`/clients/${r.id}`)} emptyState={<EmptyState icon="👥" title="Клиентов нет" subtitle="Добавьте первого клиента" action={<Button onClick={() => setShowCreate(true)}>+ Новый клиент</Button>} />} />
        }
      </Card>
      <CreateClientModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />
    </div>
  )
}

function CreateClientModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', username: '', platform: 'other', phone: '', email: '', notes: '', is_regular: false })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const handle = async () => {
    if (!form.name) return
    setLoading(true)
    try { await clientsApi.create(form); onCreated(); setForm({ name: '', username: '', platform: 'other', phone: '', email: '', notes: '', is_regular: false }) }
    finally { setLoading(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Новый клиент">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Имя" required><input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Иван Иванов" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Никнейм"><input style={inputStyle} value={form.username} onChange={e => set('username', e.target.value)} placeholder="@username" /></Field>
          <Field label="Площадка"><select style={inputStyle} value={form.platform} onChange={e => set('platform', e.target.value)}><option value="instagram">Instagram</option><option value="telegram">Telegram</option><option value="kwork">Kwork</option><option value="other">Другое</option></select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Телефон"><input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7..." /></Field>
          <Field label="Email"><input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" /></Field>
        </div>
        <Field label="Заметки"><textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}><input type="checkbox" checked={form.is_regular} onChange={e => set('is_regular', e.target.checked)} />Постоянный клиент</label>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={handle} disabled={loading || !form.name}>{loading ? '...' : 'Добавить'}</Button>
        </div>
      </div>
    </Modal>
  )
}
