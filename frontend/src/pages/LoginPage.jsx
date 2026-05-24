import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, inputStyle } from '../components/ui'
import AuthBrandPanel, { authPageLayout } from '../components/auth/AuthBrandPanel'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0]
      setError(msg || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={authPageLayout.page}>
      <AuthBrandPanel />
      <div style={authPageLayout.formSide}>
        <div style={authPageLayout.formWrap}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, marginBottom: 6 }}>Вход</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Введите email и пароль</p>
          </div>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="you@mail.ru" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Пароль</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={inputStyle} placeholder="••••••••" required />
            </div>
            {error && <div style={{ fontSize: '0.85rem', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
            <Button type="submit" disabled={loading} style={{ marginTop: 8, justifyContent: 'center', padding: '12px' }}>{loading ? 'Входим...' : 'Войти'}</Button>
          </form>
          <p style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Нет аккаунта? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
