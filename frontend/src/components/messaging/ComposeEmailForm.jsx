import { useState, useRef, useEffect } from 'react'
import { messaging as messagingApi, orders as ordersApi } from '../../api'
import { Button } from '../ui'
import AuthenticatedImage from '../ui/AuthenticatedImage'
import RecipientInput from './RecipientInput'
import { EMPTY_RECIPIENT } from './utils'
import { getUserFacingError } from '../../utils/userFacingError'

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
  const [manualAttachments, setManualAttachments] = useState([])
  const [orderAttachments, setOrderAttachments] = useState([])
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

  useEffect(() => {
    if (!orderId) {
      setOrderAttachments([])
      return
    }
    ordersApi.attachments(orderId, 'deliverable')
      .then(r => setOrderAttachments(r.data))
      .catch(() => setOrderAttachments([]))
  }, [orderId])

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

  const totalAttachments = orderAttachments.length + manualAttachments.length

  const addFiles = files => {
    const next = [...manualAttachments]
    for (const f of files) {
      if (orderAttachments.length + next.length >= 5) break
      next.push(f)
    }
    setManualAttachments(next)
  }

  const removeManualFile = idx => setManualAttachments(p => p.filter((_, i) => i !== idx))
  const removeOrderFile = id => setOrderAttachments(p => p.filter(a => a.id !== id))

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
      if (manualAttachments.length) payload.attachments = manualAttachments
      if (orderAttachments.length) payload.order_attachment_ids = orderAttachments.map(a => a.id)

      const r = await messagingApi.send(payload)
      if (r.data.status === 'failed') {
        setError(r.data.error_message || 'Не удалось отправить письмо')
        return
      }
      setSubject('')
      setBody('')
      setManualAttachments([])
      setOrderAttachments([])
      setRecipient(EMPTY_RECIPIENT)
      setToEmailOverride('')
      onSent?.(r.data)
    } catch (err) {
      const msg = getUserFacingError(err, 'Не удалось отправить письмо')
      setError(msg)
      if (msg.includes('email для ответов')) {
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

      {totalAttachments > 0 && (
        <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {orderAttachments.map(a => (
            <AttachmentChip
              key={`order-${a.id}`}
              name={a.original_name}
              isImage={a.is_image}
              previewUrl={a.file_url}
              badge="из заказа"
              accent
              authenticated
              onRemove={() => removeOrderFile(a.id)}
            />
          ))}
          {manualAttachments.map((f, i) => (
            <ManualAttachmentChip
              key={`manual-${i}`}
              file={f}
              onRemove={() => removeManualFile(i)}
            />
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

function isImageName(name) {
  return /\.(jpe?g|png)$/i.test(name || '')
}

function AttachmentThumb({ name, isImage, previewUrl, authenticated }) {
  if (isImage && previewUrl) {
    if (authenticated) {
      return (
        <AuthenticatedImage
          fileUrl={previewUrl}
          alt={name}
          style={{
            width: 36, height: 36, objectFit: 'cover', borderRadius: 6,
            border: '1px solid var(--border)', flexShrink: 0,
          }}
        />
      )
    }
    return (
      <img
        src={previewUrl}
        alt={name}
        style={{
          width: 36, height: 36, objectFit: 'cover', borderRadius: 6,
          border: '1px solid var(--border)', flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 6, background: 'var(--accent-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: '1rem',
    }}>
      📄
    </div>
  )
}

function AttachmentChip({ name, isImage, previewUrl, badge, accent, authenticated, onRemove }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 10px 6px 6px', borderRadius: 'var(--radius-sm)',
      background: accent ? 'var(--accent-light)' : 'var(--bg)',
      border: '1px solid var(--border)', maxWidth: 280,
    }}>
      <AttachmentThumb name={name} isImage={isImage} previewUrl={previewUrl} authenticated={authenticated} />
      <span style={{
        fontSize: '0.78rem', lineHeight: 1.3, wordBreak: 'break-word',
        flex: 1, minWidth: 0,
      }}>
        {name}
        {badge && (
          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
            {badge}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, fontSize: '1.1rem', padding: '0 2px' }}
      >
        ×
      </button>
    </div>
  )
}

function ManualAttachmentChip({ file, onRemove }) {
  const isImage = isImageName(file.name) || file.type?.startsWith('image/')
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!isImage) {
      setPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isImage])

  return (
    <AttachmentChip
      name={file.name}
      isImage={isImage}
      previewUrl={previewUrl}
      onRemove={onRemove}
    />
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
