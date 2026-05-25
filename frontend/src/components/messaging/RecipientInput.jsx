import { useState, useEffect, useRef } from 'react'
import { clients as clientsApi } from '../../api'
import { getInitials, clientToRecipient } from './utils'

export default function RecipientInput({ recipient, onChange, placeholder = 'Добавить получателя' }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return undefined
    }
    const t = setTimeout(() => {
      setLoading(true)
      clientsApi.list({ search: query.trim() })
        .then(r => {
          const list = r.data.results || r.data
          setSuggestions(list.map(c => clientToRecipient(c)))
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const onDoc = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const select = (item) => {
    onChange(item)
    setQuery('')
    setOpen(false)
    setSuggestions([])
  }

  const clearChip = () => onChange({ clientId: null, name: '', email: '', initials: '' })

  const handleKeyDown = e => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      const emailLike = query.includes('@')
      if (emailLike) {
        onChange({ clientId: null, name: query.trim(), email: query.trim(), initials: getInitials(query) })
        setQuery('')
        setOpen(false)
      } else if (suggestions.length > 0) {
        select(suggestions[0])
      }
    }
  }

  const hasChip = recipient?.name || recipient?.email

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
        minHeight: 36, padding: '4px 0',
      }}>
        {hasChip && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 10px 4px 4px', borderRadius: 20,
            background: 'var(--bg)', border: '1px solid var(--border)',
            fontSize: '0.875rem', maxWidth: '100%',
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-light)', color: 'var(--accent-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.68rem', fontWeight: 600,
            }}>
              {recipient.initials || getInitials(recipient.name || recipient.email)}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {recipient.name || recipient.email}
            </span>
            <button type="button" onClick={clearChip} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1, padding: '0 2px',
            }}>×</button>
          </span>
        )}
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={hasChip ? placeholder : 'Имя или email клиента...'}
          style={{
            border: 'none', outline: 'none', flex: 1, minWidth: 120,
            fontSize: '0.875rem', fontFamily: 'var(--font-body)', background: 'transparent',
            padding: '4px 0',
          }}
        />
      </div>
      {open && query.trim() && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
          marginTop: 4, maxHeight: 240, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Поиск...</div>
          )}
          {!loading && suggestions.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {query.includes('@') ? 'Enter — использовать как email' : 'Клиенты не найдены'}
            </div>
          )}
          {suggestions.map(s => (
            <button
              key={s.clientId}
              type="button"
              onClick={() => select(s)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{s.name}</div>
              {s.email && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.email}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
