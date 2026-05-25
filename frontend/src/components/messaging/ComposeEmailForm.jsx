import { useState, useRef, useEffect } from 'react'
import { messaging as messagingApi } from '../../api'
import { Button } from '../ui'
import RecipientInput from './RecipientInput'
import { EMPTY_RECIPIENT } from './utils'

export default function ComposeEmailForm({
  recipient: initialRecipient,
  orderId,
  clientId,
  templates = [],
  onSent,
  onReplyToMissing,
}) {
  const [recipient, setRecipient] = useState(initialRecipient || EMPTY_RECIPIENT)
  const [toEmailOverride, setToEmailOverride] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [templateOpen, setTemplateOpen] = useState(false)
  const fileRef = useRef(null)
  const templateRef = useRef(null)

  useEffect(() => {
    if (initialRecipient) {
      setRecipient(initialRecipient)
      setToEmailOverride(initialRecipient.email || '')
    }
  }, [initialRecipient])

  useEffect(() => {
    const onDoc = e => {
      if (templateRef.current && !templateRef.current.contains(e.target)) setTemplateOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const resolveToEmail = () => {
    if (toEmailOverride.trim()) return toEmailOverride.trim()
    if (recipient.email?.includes('@')) return recipient.email.trim()
    return ''
  }

  const applyTemplate = tpl => {
    setSubject(tpl.subject)
    setBody(tpl.body)
    setTemplateOpen(false)
  }

  const addFiles = files => {
    const next = [...attachments]
    for (const f of files) {
      if (next.length >= 5) break
      next.push(f)
    }
    setAttachments(next)
  }

  const removeFile = idx => setAttachments(p => p.filter((_, i) => i !== idx))

  const send = async () => {
    const toEmail = resolveToEmail()
    if (!toEmail) { setError('Укажите email получателя'); return }
    if (!subject.trim()) { setError('Укажите тему письма'); return }
    if (!body.trim()) { setError('Укажите текст письма'); return }
    setSending(true)
    setError(null)
    try {
      const payload = {
        to_email: toEmail,
        subject: subject.trim(),
        body: body.trim(),
      }
      if (orderId) payload.order_id = orderId
      if (clientId || recipient.clientId) payload.client_id = clientId || recipient.clientId
      if (attachments.length) payload.attachments = attachments

      const r = await messagingApi.send(payload)
      if (r.data.status === 'failed') {
        setError(r.data.error_message || 'Не удалось отправить письмо')
        return
      }
      setSubject('')
      setBody('')
      setAttachments([])
      setRecipient(EMPTY_RECIPIENT)
      setToEmailOverride('')
      onSent?.(r.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      const attachErr = err.response?.data?.attachments
      const msg = detail || attachErr || 'Не удалось отправить письмо'
      setError(typeof msg === 'string' ? msg : 'Не удалось отправить письмо')
      if (typeof detail === 'string' && detail.includes('email для ответов')) {
        onReplyToMissing?.()
      }
    } finally {
      setSending(false)
    }
  }

  const showEmailField = recipient.name && !recipient.email?.includes('@')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: showEmailField ? 10 : 0 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>To:</span>
          <RecipientInput recipient={recipient} onChange={r => {
            setRecipient(r)
            setToEmailOverride(r.email || '')
          }} />
        </div>
        {showEmailField && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>@</span>
            <input
              type="email"
              value={toEmailOverride}
              onChange={e => setToEmailOverride(e.target.value)}
              placeholder="Email получателя"
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem',
                fontFamily: 'var(--font-body)', background: 'transparent',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Тема"
          style={{
            width: '100%', border: 'none', outline: 'none', fontSize: '0.95rem',
            fontWeight: 500, fontFamily: 'var(--font-body)', background: 'transparent',
          }}
        />
      </div>

      <div style={{ flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Текст письма..."
          style={{
            flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none',
            fontSize: '0.875rem', lineHeight: 1.6, fontFamily: 'var(--font-body)',
            background: 'transparent', minHeight: 200,
          }}
        />
      </div>

      {attachments.length > 0 && (
        <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {attachments.map((f, i) => (
            <span key={i} style={{
              fontSize: '0.78rem', padding: '4px 10px', borderRadius: 20,
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {f.name}
              <button type="button" onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: '0 24px 12px', fontSize: '0.82rem', color: 'var(--danger)' }}>{error}</div>
      )}

      <div style={{
        padding: '12px 24px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.docx,.zip"
            style={{ display: 'none' }}
            onChange={e => { addFiles(Array.from(e.target.files || [])); e.target.value = '' }}
          />
          <IconButton title="Прикрепить файл" onClick={() => fileRef.current?.click()}>📎</IconButton>
          <div ref={templateRef} style={{ position: 'relative' }}>
            <IconButton title="Шаблоны" onClick={() => setTemplateOpen(v => !v)}>Шаблоны</IconButton>
            {templateOpen && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
                minWidth: 220, maxHeight: 240, overflowY: 'auto', zIndex: 20,
              }}>
                {templates.length === 0
                  ? <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Нет шаблонов</div>
                  : templates.map(t => (
                    <button key={t.id} type="button" onClick={() => applyTemplate(t)} style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                      border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem',
                      borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-body)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      {t.name}
                    </button>
                  ))
                }
              </div>
            )}
          </div>
        </div>
        <Button onClick={send} disabled={sending} style={{ background: 'var(--success)', color: '#fff' }}>
          {sending ? 'Отправка...' : 'Отправить'}
        </Button>
      </div>
    </div>
  )
}

function IconButton({ children, onClick, title }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none',
      background: 'transparent', cursor: 'pointer', fontSize: '0.82rem',
      color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}
