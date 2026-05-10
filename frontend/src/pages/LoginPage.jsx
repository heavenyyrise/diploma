import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, inputStyle } from '../components/ui'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try { await login(form.username, form.password); navigate('/') }
    catch { setError('Неверный логин или пароль') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      <div style={{ flex: 1, background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', maxWidth: 420 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
          Управляй своим<br /><span style={{ color: 'var(--accent)' }}>фрилансом</span><br />эффективно
        </div>
        <p style={{ color: 'var(--text-sidebar)', fontSize: '0.875rem', lineHeight: 1.7 }}>Заказы, клиенты, услуги и аналитика доходов — всё в одном месте.</p>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, marginBottom: 6 }}>Вход</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Введите данные своего аккаунта</p>
          </div>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Логин</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} style={inputStyle} placeholder="username" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Пароль</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={inputStyle} placeholder="••••••••" required />
            </div>
            {error && <div style={{ fontSize: '0.85rem', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
            <Button type="submit" disabled={loading} style={{ marginTop: 8, justifyContent: 'center', padding: '12px' }}>{loading ? 'Входим...' : 'Войти'}</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
