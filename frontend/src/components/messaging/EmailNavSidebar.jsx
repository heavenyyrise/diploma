import { Button, inputStyle } from '../ui'

export default function EmailNavSidebar({ activeTab, onTabChange, replyTo, onReplyToChange, onSaveReplyTo, savingReply, replySaved }) {
  const tabs = [
    { id: 'sent', label: 'Отправленные' },
    { id: 'templates', label: 'Шаблоны' },
  ]

  return (
    <aside style={{
      width: 280, flexShrink: 0, borderRight: '1px solid var(--border)',
      background: 'var(--bg-card)', display: 'flex', flexDirection: 'column',
      overflowY: 'auto', minHeight: 0,
    }}>
      <div style={{ padding: '20px 16px 12px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 500,
          marginBottom: 16, color: 'var(--text-primary)',
        }}>
          Почта
        </h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: '0.875rem', fontWeight: activeTab === tab.id ? 500 : 400,
                background: activeTab === tab.id ? 'var(--accent-light)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-dark)' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500, lineHeight: 1.4 }}>
          Ответить на email
        </div>
        <input
          type="email"
          value={replyTo}
          onChange={e => onReplyToChange(e.target.value)}
          placeholder="your@gmail.com"
          style={{ ...inputStyle, fontSize: '0.82rem', marginBottom: 8, width: '100%', boxSizing: 'border-box' }}
        />
        <Button size="sm" onClick={onSaveReplyTo} disabled={savingReply} style={{ width: '100%' }}>
          {savingReply ? '...' : replySaved ? '✓ Сохранено' : 'Сохранить'}
        </Button>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.4 }}>
          Клиенты будут отвечать на этот адрес
        </p>
      </div>
    </aside>
  )
}
