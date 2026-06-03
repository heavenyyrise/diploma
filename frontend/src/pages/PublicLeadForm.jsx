import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { formSettings as formSettingsApi, leads as leadsApi } from '../api'
import { sanitizeClientName, getClientNameError } from '../utils/clientName'

export default function PublicLeadForm() {
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('user_id')
  const [cfg, setCfg] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [form, setForm] = useState({
    name: '', description: '', budget: '', deadline: '',
    lead_source: '', contact_type: '', contact_value: '',
  })
  const [selectedServices, setSelectedServices] = useState([])
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) {
      setLoadError('Неверная ссылка на форму. Обратитесь к фрилансеру за актуальной ссылкой.')
      setCfg(null)
      return
    }
    setLoadError(null)
    setCfg(null)
    formSettingsApi.getPublic(userId)
      .then(r => setCfg(r.data))
      .catch(() => setLoadError('Не удалось загрузить форму. Проверьте ссылку или попробуйте позже.'))
  }, [userId])

  useEffect(() => {
    if (cfg?.contact_types?.length && !form.contact_type) {
      setForm(p => ({ ...p, contact_type: cfg.contact_types[0].id }))
    }
  }, [cfg])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const nameError = getClientNameError(form.name, 'Имя')

  const toggleService = id => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handle = async e => {
    e.preventDefault()
    if (!form.name.trim() || nameError || !form.contact_value || !form.contact_type) return
    setLoading(true); setError('')
    try {
      const payload = {
        name: form.name,
        contact_type: form.contact_type,
        contact_value: form.contact_value,
        description: form.description || '',
        services: selectedServices,
      }
      if (form.lead_source) payload.lead_source = form.lead_source
      if (form.budget) payload.budget = form.budget
      if (form.deadline) payload.deadline = form.deadline
      await leadsApi.createPublic(userId, payload)
      // #region agent log
      fetch('http://127.0.0.1:7391/ingest/57ceb7b4-465a-4cb5-97b8-f8cb49bcb906',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fefc84'},body:JSON.stringify({sessionId:'fefc84',location:'PublicLeadForm.jsx:handle',message:'public lead submit ok',data:{hasNameError:!!nameError,servicesCount:selectedServices.length},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setSent(true)
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7391/ingest/57ceb7b4-465a-4cb5-97b8-f8cb49bcb906',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fefc84'},body:JSON.stringify({sessionId:'fefc84',location:'PublicLeadForm.jsx:handle',message:'public lead submit fail',data:{status:err?.response?.status??null,fieldKeys:err?.response?.data?Object.keys(err.response.data):[]},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setError('Что-то пошло не так. Попробуйте ещё раз.')
    }
    finally { setLoading(false) }
  }

  if (loadError) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 'var(--font-display-weight)', marginBottom: 12 }}>Форма недоступна</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>{loadError}</p>
      </div>
    </div>
  )

  if (!cfg) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
      Загрузка...
    </div>
  )

  if (sent) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 20 }}>✉️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 'var(--font-display-weight)', marginBottom: 12 }}>Заявка отправлена!</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>{cfg.success_message}</p>
      </div>
    </div>
  )

  const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`
  const selectStyle = { ...fStyle, appearance: 'none', paddingRight: 28, backgroundImage: chevron, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', cursor: 'pointer' }
  const currentContactType = cfg.contact_types?.find(t => t.id === Number(form.contact_type))
  const hasProjectBlock = cfg.show_service || cfg.show_description || cfg.show_budget || cfg.show_deadline

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div className="public-form-header">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#fff', fontWeight: 'var(--font-display-weight)' }}>Freelancer ARM</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Форма заявки</div>
      </div>

      <div className="public-form-body">
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <h1 className="public-form-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-weight)', marginBottom: 10 }}>{cfg.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>{cfg.subtitle}</p>
          </div>

          <form onSubmit={handle}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>

              {/* Контактная информация */}
              <div className="public-form-section" style={{ padding: '28px 28px 24px' }}>
                <SLabel>Контактная информация</SLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <FField label="Ваше имя / название организации" required>
                    <input
                      value={form.name}
                      onChange={e => set('name', sanitizeClientName(e.target.value))}
                      placeholder="Иван Иванов"
                      required
                      style={fStyle}
                    />
                    {nameError && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--danger)', marginTop: 2 }}>{nameError}</div>
                    )}
                  </FField>

                  <FField label="Контакт для связи" required hint="Выберите тип и введите значение">
                    <div className="public-contact-row" style={{ display: 'flex', gap: 8 }}>
                      {cfg.contact_types?.length > 0 && (
                        <select value={form.contact_type} onChange={e => set('contact_type', Number(e.target.value))}
                          style={{ ...selectStyle, width: 148, flexShrink: 0 }}>
                          {cfg.contact_types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      )}
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
              {hasProjectBlock && (
                <>
                  <div className="public-form-inner" style={{ margin: '0 28px', borderTop: '1px solid var(--border)' }} />
                  <div className="public-form-section-lg" style={{ padding: '24px 28px 28px' }}>
                    <SLabel>О проекте</SLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      {cfg.show_service && cfg.services?.length > 0 && (
                        <FField label="Нужные услуги" hint="Можно выбрать несколько">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {cfg.services.map(s => {
                              const sel = selectedServices.includes(s.id)
                              return (
                                <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                                  style={{
                                    padding: '7px 16px',
                                    borderRadius: 20,
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    fontWeight: sel ? 500 : 400,
                                    background: sel ? 'var(--accent)' : '#fff',
                                    color: sel ? '#fff' : 'var(--text-secondary)',
                                    border: sel ? '1px solid var(--accent)' : '1px solid var(--border)',
                                    transition: 'all 0.15s',
                                  }}>
                                  {sel && <span style={{ marginRight: 5 }}>✓</span>}
                                  {s.name}
                                  {s.price ? <span style={{ opacity: 0.75, fontSize: '0.8rem', marginLeft: 6 }}>от {Number(s.price).toLocaleString('ru-RU')} BYN</span> : null}
                                </button>
                              )
                            })}
                          </div>
                          {selectedServices.length > 0 && (
                            <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Выбрано: {selectedServices.length}
                            </div>
                          )}
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
                        <div className="grid-form-2" style={{ gridTemplateColumns: cfg.show_budget && cfg.show_deadline ? '1fr 1fr' : '1fr', gap: 14 }}>
                          {cfg.show_budget && (
                            <FField label="Бюджет (BYN)" hint="Приблизительно">
                              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)}
                                placeholder="0" min="0" style={fStyle} />
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
                <button type="submit" disabled={loading || !form.name.trim() || !!nameError || !form.contact_value || !form.contact_type}
                  style={{ width: '100%', padding: '13px', background: form.name.trim() && !nameError && form.contact_value ? 'var(--accent)' : 'var(--border-strong)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.95rem', fontWeight: 500, cursor: loading || !form.name.trim() || nameError || !form.contact_value ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}>
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
