import { useState, useEffect } from 'react'
import { formSettings as api, services as servicesApi, clients as clientsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import { publicFormUrl } from '../utils/publicFormUrl'
import { Card, PageHeader, Button, Field, inputStyle } from '../components/ui'
import { sanitizeClientName, getClientNameError } from '../utils/clientName'

const FORM_FIELDS = [
  { key: 'show_lead_source', label: 'Источник клиента',   hint: 'Откуда узнал о вас' },
  { key: 'show_description', label: 'Описание задачи',    hint: 'Основное текстовое поле' },
  { key: 'show_service',     label: 'Выбор услуги',       hint: 'Выпадающий список услуг' },
  { key: 'show_budget',      label: 'Бюджет',             hint: 'Числовое поле' },
  { key: 'show_deadline',    label: 'Желаемый срок',      hint: 'Поле даты' },
]

export default function FormSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(null)
  const [services, setServices] = useState([])
  const [leadSources, setLeadSources] = useState([])
  const [contactTypes, setContactTypes] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadLeadSources = () => clientsApi.leadSources().then(r => setLeadSources(r.data.results || r.data))
  const loadContactTypes = () => clientsApi.contactTypes().then(r => setContactTypes(r.data.results || r.data))

  useEffect(() => {
    api.get().then(r => setSettings(r.data))
    servicesApi.list({ is_active: true }).then(r => setServices(r.data.results || r.data))
    loadLeadSources()
    loadContactTypes()
  }, [])

  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }))

  const toggleService = id => {
    const current = settings.services || []
    setSettings(p => ({ ...p, services: current.includes(id) ? current.filter(s => s !== id) : [...current, id] }))
  }

  const save = async () => {
    setSaving(true)
    try { await api.update(settings); setSaved(true); setTimeout(() => setSaved(false), 2500) }
    finally { setSaving(false) }
  }

  const formLink = publicFormUrl(user?.id)

  if (!settings) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Загрузка...</div>

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1400 }}>
      <PageHeader
        title="Настройки формы"
        subtitle="Редактируйте публичную форму заявки"
        action={<Button onClick={save} disabled={saving}>{saving ? 'Сохранение...' : saved ? '✓ Сохранено' : 'Сохранить'}</Button>}
      />

      {/* Ссылка */}
      <Card style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', flexShrink: 0 }}>Ссылка на форму:</span>
        <code style={{ flex: 1, fontSize: '0.85rem', color: 'var(--accent-dark)', background: 'var(--accent-light)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}>{formLink}</code>
        <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(formLink)}>Скопировать</Button>
        <Button size="sm" variant="ghost" onClick={() => window.open(formLink, '_blank')}>Открыть ↗</Button>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Тексты */}
        <Card style={{ padding: 24 }}>
          <SectionLabel>Тексты формы</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Заголовок"><input style={inputStyle} value={settings.title} onChange={e => set('title', e.target.value)} /></Field>
            <Field label="Подзаголовок"><textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={settings.subtitle} onChange={e => set('subtitle', e.target.value)} /></Field>
            <Field label="Текст кнопки"><input style={inputStyle} value={settings.button_text} onChange={e => set('button_text', e.target.value)} /></Field>
            <Field label="Сообщение после отправки"><textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={settings.success_message} onChange={e => set('success_message', e.target.value)} /></Field>
          </div>
        </Card>

        {/* Поля */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 24 }}>
            <SectionLabel>Поля формы</SectionLabel>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Имя и контакт — обязательные, всегда отображаются</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FORM_FIELDS.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: settings[f.key] ? 'var(--accent-light)' : 'var(--bg)' }}>
                  <input type="checkbox" checked={settings[f.key]} onChange={e => set(f.key, e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: settings[f.key] ? 500 : 400, color: settings[f.key] ? 'var(--accent-dark)' : 'var(--text-secondary)' }}>{f.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          {/* Услуги */}
          <Card style={{ padding: 24 }}>
            <SectionLabel>Услуги в форме</SectionLabel>
            {services.length === 0
              ? <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Нет активных услуг</div>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {services.map(s => {
                    const sel = settings.services?.includes(s.id)
                    return (
                      <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                        style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: sel ? 500 : 400, background: sel ? 'var(--accent)' : 'var(--bg)', color: sel ? '#fff' : 'var(--text-secondary)', border: sel ? '1px solid var(--accent)' : '1px solid var(--border)', transition: 'all 0.15s' }}>
                        {s.name}
                      </button>
                    )
                  })}
                </div>
            }
          </Card>
        </div>
      </div>

      {/* Источники и типы контактов */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <EditableListCard
          title="Источники клиентов"
          hint="Варианты ответа на «Откуда вы о нас узнали?»"
          items={leadSources}
          onAdd={name => clientsApi.createLeadSource({ name, order: leadSources.length }).then(loadLeadSources)}
          onUpdate={(id, name) => clientsApi.updateLeadSource(id, { name }).then(loadLeadSources)}
          onDelete={id => clientsApi.deleteLeadSource(id).then(loadLeadSources)}
          onToggle={(id, is_active) => clientsApi.updateLeadSource(id, { is_active }).then(loadLeadSources)}
        />
        <EditableListCard
          title="Типы контактов"
          hint="Способы связи (Telegram, Email и т.д.)"
          items={contactTypes}
          onAdd={name => clientsApi.createContactType({ name, order: contactTypes.length }).then(loadContactTypes)}
          onUpdate={(id, name) => clientsApi.updateContactType(id, { name }).then(loadContactTypes)}
          onDelete={id => clientsApi.deleteContactType(id).then(loadContactTypes)}
          onToggle={(id, is_active) => clientsApi.updateContactType(id, { is_active }).then(loadContactTypes)}
        />
      </div>

      {/* Превью */}
      <Card style={{ padding: 24 }}>
        <SectionLabel>Превью</SectionLabel>
        <div style={{ textAlign: 'center', padding: '28px 20px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px dashed var(--border-strong)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, marginBottom: 10 }}>{settings.title || 'Заголовок формы'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 20px' }}>{settings.subtitle || 'Подзаголовок'}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontSize: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '3px 10px', borderRadius: 20 }}>Имя *</span>
            <span style={{ fontSize: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '3px 10px', borderRadius: 20 }}>Контакт *</span>
            {FORM_FIELDS.filter(f => settings[f.key]).map(f => (
              <span key={f.key} style={{ fontSize: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '3px 10px', borderRadius: 20 }}>{f.label}</span>
            ))}
          </div>
          <button style={{ padding: '10px 28px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 500, cursor: 'default', fontFamily: 'var(--font-body)' }}>
            {settings.button_text || 'Отправить заявку'}
          </button>
        </div>
      </Card>
    </div>
  )
}

function EditableListCard({ title, hint, items, onAdd, onUpdate, onDelete, onToggle }) {
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [adding, setAdding] = useState(false)

  const newNameError = getClientNameError(newName, 'Название')
  const editNameError = getClientNameError(editName, 'Название')

  const handleAdd = async () => {
    if (!newName.trim() || newNameError) return
    setAdding(true)
    try { await onAdd(newName.trim()); setNewName('') }
    finally { setAdding(false) }
  }

  const handleUpdate = async id => {
    if (!editName.trim() || editNameError) return
    await onUpdate(id, editName.trim())
    setEditId(null)
  }

  return (
    <Card style={{ padding: 24 }}>
      <SectionLabel>{title}</SectionLabel>
      {hint && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>{hint}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: item.is_active ? 'var(--bg)' : '#f4f4f5' }}>
            {editId === item.id ? (
              <>
                <div style={{ flex: 1 }}>
                  <input value={editName} onChange={e => setEditName(sanitizeClientName(e.target.value))} autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(item.id); if (e.key === 'Escape') setEditId(null) }}
                    style={{ ...inputStyle, width: '100%', padding: '4px 8px', fontSize: '0.85rem' }} />
                  {editNameError && <div style={{ fontSize: '0.75rem', color: 'var(--danger, #dc2626)', marginTop: 4 }}>{editNameError}</div>}
                </div>
                <button onClick={() => handleUpdate(item.id)} disabled={!!editNameError || !editName.trim()} style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, opacity: editNameError || !editName.trim() ? 0.5 : 1 }}>✓</button>
                <button onClick={() => setEditId(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: '0.875rem', color: item.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{item.name}</span>
                <button onClick={() => onToggle(item.id, !item.is_active)}
                  style={{ fontSize: '0.72rem', color: item.is_active ? 'var(--text-muted)' : 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {item.is_active ? 'скрыть' : 'показать'}
                </button>
                <button onClick={() => { setEditId(item.id); setEditName(item.name) }}
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>✏️</button>
                <button onClick={() => { if (confirm(`Удалить "${item.name}"?`)) onDelete(item.id) }}
                  style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <input value={newName} onChange={e => setNewName(sanitizeClientName(e.target.value))} placeholder="Новый вариант..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ ...inputStyle, width: '100%', padding: '7px 10px', fontSize: '0.85rem' }} />
          {newNameError && <div style={{ fontSize: '0.75rem', color: 'var(--danger, #dc2626)', marginTop: 4 }}>{newNameError}</div>}
        </div>
        <button onClick={handleAdd} disabled={adding || !newName.trim() || !!newNameError}
          style={{ padding: '7px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: !newName.trim() || newNameError ? 0.5 : 1 }}>
          + Добавить
        </button>
      </div>
    </Card>
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{children}</div>
}
