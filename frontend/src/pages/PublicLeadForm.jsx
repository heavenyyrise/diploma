import { useState, useEffect } from 'react'
import axios from 'axios'

const DEFAULT_CFG = {
  title: 'Оставить заявку',
  subtitle: 'Заполните форму и я свяжусь с вами в ближайшее время, чтобы обсудить детали.',
  button_text: 'Отправить заявку',
  success_message: 'Спасибо за обращение. Я свяжусь с вами в ближайшее время по указанным контактам.',
  show_budget: true, show_deadline: true, show_description: true,
  show_service: true, show_lead_source: true,
  services: [], lead_sources: [], contact_types: [],
}

export default function PublicLeadForm() {
  const [cfg, setCfg] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', service: '', description: '', budget: '', deadline: '',
    lead_source: '', contact_type: '', contact_value: '',
  })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get('/api/form-settings/public/').then(r => setCfg(r.data)).catch(() => setCfg(DEFAULT_CFG))
  }, [])

  // Set default contact_type when cfg loads
  useEffect(() => {
    if (cfg?.contact_types?.length && !form.contact_type) {
      setForm(p => ({ ...p, contact_type: cfg.contact_types[0].id }))
    }
  }, [cfg])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handle = async e => {
    e.preventDefault()
    if (!form.name || !form.contact_value || !form.contact_type) return
    setLoading(true); setError('')
    try {
      const payload = {
        name: form.name,
        contact_type: form.contact_type,
        contact_value: form.contact_value,
        email: form.email || '',
        description: form.description || '',
      }
      if (form.lead_source) payload.lead_source = form.lead_source
      if (form.service) payload.service = form.service
      if (form.budget) payload.budget = form.budget
      if (form.deadline) payload.deadline = form.deadline
      await axios.post('/api/leads/public/', payload)
      setSent(true)
    } catch { setError('Что-то пошло не так. Попробуйте ещё раз.') }
    finally { setLoading(false) }
  }

  if (!cfg) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
      Загрузка...
    </div>
  )

  if (sent) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 20 }}>✉️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 500, marginBottom: 12 }}>Заявка отправлена!</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>{cfg.success_message}</p>
      </div>
    </div>
  )

  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`
  const selectStyle = { ...fStyle, appearance: 'none', paddingRight: 28, backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', cursor: 'pointer' }

  const currentContactType = cfg.contact_types?.find(t => t.id === Number(form.contact_type))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bg-sidebar)', padding: '20px 40px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fff', fontWeight: 500 }}>Freelancer ARM</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Форма заявки</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 500, marginBottom: 10 }}>{cfg.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>{cfg.subtitle}</p>
          </div>

          <form onSubmit={handle}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
              {/* Контактная информация */}
              <div style={{ padding: '28px 28px 24px' }}>
                <SLabel>Контактная информация</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  <FField label="Ваше имя / название организации" required>
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Иван Иванов или ООО «Компания»" required style={fStyle} />
                  </FField>

                  <FField label="Контакт для связи" required hint="Выберите тип и введите значение">
                    <div style={{ display: 'flex', gap: 8 }}>
                      {cfg.contact_types?.length > 0 ? (
                        <select value={form.contact_type} onChange={e => set('contact_type', Number(e.target.value))}
                          style={{ ...selectStyle, width: 148, flexShrink: 0 }}>
                          {cfg.contact_types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      ) : null}
                      <input value={form.contact_value} onChange={e => set('contact_value', e.target.value)}
                        placeholder={currentContactType ? `Ваш ${currentContactType.name}` : 'Контакт для связи'}
                        required style={{ ...fStyle, flex: 1 }} />
                    </div>
                  </FField>

                  {cfg.show_lead_source && cfg.lead_sources?.length > 0 && (
                        <FField label="Откуда вы о нас узнали?" required>
                          <select value={form.lead_source} onChange={e => set('lead_source', e.target.value)} required style={selectStyle}>
                            <option value="">Выберите вариант</option>
                            {cfg.lead_sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </FField>
                      )}
                </div>
              </div>

              {/* О проекте */}
              {(cfg.show_service || cfg.show_lead_source || cfg.show_description || cfg.show_budget || cfg.show_deadline) && (
                <>
                  <div style={{ margin: '0 28px', borderTop: '1px solid var(--border)' }} />
                  <div style={{ padding: '24px 28px 28px' }}>
                    <SLabel>О проекте</SLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      {cfg.show_service && cfg.services?.length > 0 && (
                        <FField label="Нужная услуга">
                          <select value={form.service} onChange={e => set('service', e.target.value)} style={selectStyle}>
                            <option value="">Не знаю / другое</option>
                            {cfg.services.map(s => <option key={s.id} value={s.id}>{s.name}{s.price ? ` — от ${Number(s.price).toLocaleString('ru-RU')} ₽` : ''}</option>)}
                          </select>
                        </FField>
                      )}

                      {cfg.show_description && (
                        <FField label="Описание задачи">
                          <textarea value={form.description} onChange={e => set('description', e.target.value)}
                            placeholder="Расскажите подробнее о вашем проекте..."
                            style={{ ...fStyle, minHeight: 120, resize: 'vertical' }} />
                        </FField>
                      )}

                      {(cfg.show_budget || cfg.show_deadline) && (
                        <div style={{ display: 'grid', gridTemplateColumns: cfg.show_budget && cfg.show_deadline ? '1fr 1fr' : '1fr', gap: 14 }}>
                          {cfg.show_budget && (
                            <FField label="Бюджет (₽)" hint="Приблизительно">
                              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0" min="0" style={fStyle} />
                            </FField>
                          )}
                          {cfg.show_deadline && (
                            <FField label="Желаемый срок">
                              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={fStyle} />
                            </FField>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div style={{ padding: '20px 28px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {error && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>
                )}
                <button type="submit" disabled={loading || !form.name || !form.contact_value || !form.contact_type}
                  style={{ width: '100%', padding: '13px', background: form.name && form.contact_value ? 'var(--accent)' : 'var(--border-strong)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', fontWeight: 500, cursor: loading || !form.name || !form.contact_value ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}>
                  {loading ? 'Отправляем...' : cfg.button_text}
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Нажимая кнопку, вы соглашаетесь на обработку персональных данных</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const fStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', background: '#fff', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }

function SLabel({ children }) {
  return <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>{children}</div>
}

function FField({ label, children, required, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {label}{required && <span style={{ color: 'var(--accent)' }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.77rem' }}>— {hint}</span>}
      </label>
      {children}
    </div>
  )
}
