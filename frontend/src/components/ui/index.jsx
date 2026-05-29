export function Card({ children, style, onClick, className }) {
  return (
    <div onClick={onClick} className={className} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', ...style, ...(onClick ? { cursor: 'pointer' } : {}) }}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 'var(--font-display-weight)', color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  )
}

const BADGE_COLORS = {
  in_progress: { bg: 'var(--info-bg)', color: 'var(--info)' },
  in_discussion: { bg: 'var(--info-bg)', color: 'var(--info)' },
  completed:   { bg: 'var(--success-bg)', color: 'var(--success)' },
  frozen:      { bg: '#f4f4f5', color: '#71717a' },
  cancelled:   { bg: 'var(--danger-bg)', color: 'var(--danger)' },
  new:         { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  accepted:    { bg: 'var(--success-bg)', color: 'var(--success)' },
  rejected:    { bg: 'var(--danger-bg)', color: 'var(--danger)' },
}

export function Badge({ status, label }) {
  const c = BADGE_COLORS[status] || { bg: '#f4f4f5', color: '#71717a' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, style, type = 'button' }) {
  const base = { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 'var(--radius-sm)', fontWeight: 500, fontFamily: 'var(--font-body)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, border: 'none', transition: 'all 0.15s', ...(size === 'sm' ? { padding: '6px 14px', fontSize: '0.8rem' } : { padding: '9px 20px', fontSize: '0.875rem' }) }
  const variants = {
    primary:   { background: 'var(--accent)', color: '#fff' },
    secondary: { background: 'var(--accent-light)', color: 'var(--accent-dark)' },
    ghost:     { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger:    { background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #fca5a5' },
    success:   { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #86efac' },
  }
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>{children}</button>
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(28,25,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)', padding: '24px' }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 'var(--font-display-weight)', marginBottom: message ? 8 : 20 }}>
          {title}
        </h2>
        {message && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
            {message}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(28,25,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 'var(--font-display-weight)' }}>{title}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', background: 'none', border: 'none', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

export const inputStyle = { padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', background: '#fff', color: 'var(--text-primary)', outline: 'none', width: '100%' }

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 'var(--font-display-weight)', color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>{subtitle}</div>}
      {action}
    </div>
  )
}

export function StatCard({ label, value, sub, color }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 'var(--font-display-weight)', color: color || 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </Card>
  )
}

export function Table({ columns, data, onRowClick, emptyState }) {
  if (!data?.length) return emptyState || null
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            {columns.map(c => <th key={c.key} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick?.(row)} style={{ borderBottom: '1px solid var(--border)', cursor: onRowClick ? 'pointer' : 'default' }}
              onMouseEnter={e => onRowClick && (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              {columns.map(c => <td key={c.key} style={{ padding: '14px 16px', color: c.muted ? 'var(--text-secondary)' : 'var(--text-primary)', whiteSpace: c.nowrap ? 'nowrap' : 'normal' }}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function formatMoney(n) {
  const val = Number(n || 0)
  return `${val.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} BYN`
}

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
