import { useState, useEffect } from 'react'
import { formSettings as api, services as servicesApi } from '../api'
import { Card, PageHeader, Button, Field, inputStyle } from '../components/ui'

const FIELDS = [
  { key: 'show_email',       label: 'Email',           hint: 'Необязательное поле' },
  { key: 'show_description', label: 'Описание задачи', hint: 'Основное текстовое поле' },
  { key: 'show_service',     label: 'Выбор услуги',    hint: 'Выпадающий список услуг' },
  { key: 'show_budget',      label: 'Бюджет',          hint: 'Числовое поле' },
  { key: 'show_deadline',    label: 'Желаемый срок',   hint: 'Поле даты' },
]

export default function FormSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [services, setServices] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get().then(r => setSettings(r.data))
    servicesApi.list({ is_active: true }).then(r => setServices(r.data.results || r.data))
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

  const formLink = `${window.location.origin}/form`

  if (!settings) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Загрузка...</div>

  return (
    <div style={{ padding: '36px 40px', maxWidth: 860 }}>
      <PageHeader
        title="Настройки формы"
        subtitle="Редактируйте публичную форму заявки"
        action={<Button onClick={save} disabled={saving}>{saving ? 'Сохранение...' : saved ? '✓ Сохранено' : 'Сохранить'}</Button>}
      />

      <Card style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', flexShrink: 0 }}>Ссылка на форму:</span>
        <code style={{ flex: 1, fontSize: '0.85rem', color: 'var(--accent-dark)', background: 'var(--accent-light)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}>{formLink}</code>
        <Button size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(formLink)}>Скопировать</Button>
        <Button size="sm" variant="ghost" onClick={() => window.open(formLink, '_blank')}>Открыть ↗</Button>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 24 }}>
            <SectionLabel>Тексты формы</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Заголовок"><input style={inputStyle} value={settings.title} onChange={e => set('title', e.target.value)} placeholder="Оставить заявку" /></Field>
              <Field label="Подзаголовок"><textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={settings.subtitle} onChange={e => set('subtitle', e.target.value)} /></Field>
              <Field label="Текст кнопки"><input style={inputStyle} value={settings.button_text} onChange={e => set('button_text', e.target.value)} /></Field>
              <Field label="Сообщение после отправки"><textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={settings.success_message} onChange={e => set('success_message', e.target.value)} /></Field>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 24 }}>
            <SectionLabel>Поля формы</SectionLabel>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Имя и контакт — обязательные, всегда отображаются</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FIELDS.map(f => (
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

          <Card style={{ padding: 24 }}>
            <SectionLabel>Услуги в форме</SectionLabel>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              {settings.services?.length === 0 ? 'Ни одна услуга не выбрана — поле услуги будет пустым' : `Выбрано: ${settings.services?.length}`}
              {settings.services?.length > 0 && <> — <button onClick={() => setSettings(p => ({ ...p, services: [] }))} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>сбросить</button></>}
            </p>
            {services.length === 0
              ? <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Нет активных услуг. Создайте их во вкладке «Услуги».</div>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {services.map(s => {
                    const sel = settings.services?.includes(s.id)
                    return (
                      <button key={s.id} type="button" onClick={() => toggleService(s.id)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: sel ? 500 : 400, background: sel ? 'var(--accent)' : 'var(--bg)', color: sel ? '#fff' : 'var(--text-secondary)', border: sel ? '1px solid var(--accent)' : '1px solid var(--border)', transition: 'all 0.15s' }}>
                        {s.name}{s.price ? <span style={{ opacity: 0.8, fontSize: '0.75rem', marginLeft: 4 }}>{Number(s.price).toLocaleString('ru-RU')} ₽</span> : null}
                      </button>
                    )
                  })}
                </div>
            }
          </Card>
        </div>
      </div>

      <Card style={{ marginTop: 20, padding: 24 }}>
        <SectionLabel>Превью</SectionLabel>
        <div style={{ textAlign: 'center', padding: '28px 20px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px dashed var(--border-strong)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, marginBottom: 10 }}>{settings.title || 'Заголовок формы'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 20px' }}>{settings.subtitle || 'Подзаголовок'}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            {FIELDS.filter(f => settings[f.key]).map(f => <span key={f.key} style={{ fontSize: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '3px 10px', borderRadius: 20 }}>{f.label}</span>)}
          </div>
          <button style={{ padding: '10px 28px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 500, cursor: 'default', fontFamily: 'var(--font-body)' }}>
            {settings.button_text || 'Отправить заявку'}
          </button>
        </div>
      </Card>
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{children}</div>
}
