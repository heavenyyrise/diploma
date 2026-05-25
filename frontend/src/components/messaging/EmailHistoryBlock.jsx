import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { messaging as messagingApi } from '../../api'
import { Card } from '../ui'

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EmailHistoryBlock({ orderId, clientId, limit = 5 }) {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = {}
    if (orderId) params.order_id = orderId
    if (clientId) params.client_id = clientId
    setLoading(true)
    messagingApi.sent(params)
      .then(r => setEmails((r.data || []).slice(0, limit)))
      .catch(() => setEmails([]))
      .finally(() => setLoading(false))
  }, [orderId, clientId, limit])

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          История писем
        </h3>
        <Link to="/email" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none' }}>Все →</Link>
      </div>
      {loading
        ? <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Загрузка...</div>
        : emails.length === 0
          ? <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Писем пока нет</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {emails.map(e => (
                <div key={e.id} style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.3 }}>{e.subject}</div>
                    <StatusBadge status={e.status} label={e.status_display} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {e.to_email} · {formatDateTime(e.sent_at)}
                  </div>
                  {e.status === 'failed' && e.error_message && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: 4 }}>{e.error_message}</div>
                  )}
                </div>
              ))}
            </div>
          )
      }
    </Card>
  )
}

function StatusBadge({ status, label }) {
  const isSent = status === 'sent'
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 500, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
      background: isSent ? 'var(--success-bg)' : 'var(--danger-bg)',
      color: isSent ? 'var(--success)' : 'var(--danger)',
    }}>
      {label}
    </span>
  )
}
