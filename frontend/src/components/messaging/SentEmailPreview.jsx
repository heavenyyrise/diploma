import { Button } from '../ui'
import { formatEmailDateTime } from './utils'

export default function SentEmailPreview({ email, onReply }) {
  if (!email) return null

  const isSent = email.status === 'sent'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500, marginBottom: 8 }}>
            {email.subject}
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Кому: {email.to_email}
            {email.client_name && ` · ${email.client_name}`}
            {' · '}{formatEmailDateTime(email.sent_at)}
          </div>
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: 500, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
          background: isSent ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: isSent ? 'var(--success)' : 'var(--danger)',
        }}>
          {email.status_display}
        </span>
      </div>

      <div style={{
        flex: 1, padding: '24px', overflowY: 'auto',
        fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
      }}>
        {email.body}
      </div>

      {email.status === 'failed' && email.error_message && (
        <div style={{ padding: '0 24px 16px', fontSize: '0.82rem', color: 'var(--danger)' }}>
          {email.error_message}
        </div>
      )}

      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
        <Button variant="secondary" onClick={() => onReply?.(email)}>Ответить</Button>
      </div>
    </div>
  )
}
