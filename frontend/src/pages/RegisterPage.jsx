import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../api'
import { Button, inputStyle } from '../components/ui'
import AuthBrandPanel, { authPageLayout } from '../components/auth/AuthBrandPanel'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password2: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handle = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password2) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    try {
      await auth.register({ name: form.name, email: form.email, password: form.password })
      setSent(true)
    } catch (err) {
      const data = err.response?.data
      const msg = data?.email?.[0] || data?.password?.[0] || data?.detail || 'Не удалось зарегистрироваться'
      setError(typeof msg === 'string' ? msg : 'Не удалось зарегистрироваться')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div {...authPageLayout.page}>
        <AuthBrandPanel />
        <div {...authPageLayout.formSide}>
          <div {...authPageLayout.formWrap}>
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✉️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 'var(--font-display-weight)', marginBottom: 8 }}>Проверьте почту</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 24 }}>
              Мы отправили письмо на <strong>{form.email}</strong>. Перейдите по ссылке в письме, чтобы подтвердить регистрацию.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 20 }}>Ссылка действительна 24 часа.</p>
            <Button onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              Перейти ко входу
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div {...authPageLayout.page}>
      <AuthBrandPanel />
      <div {...authPageLayout.formSide}>
        <div {...authPageLayout.formWrap}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 'var(--font-display-weight)', marginBottom: 6 }}>Регистрация</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Создайте аккаунт фрилансера</p>
          </div>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Имя</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} placeholder="Иван" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="you@mail.ru" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Пароль</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} style={inputStyle} placeholder="минимум 8 символов" minLength={8} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Подтверждение пароля</label>
              <input type="password" value={form.password2} onChange={e => set('password2', e.target.value)} style={inputStyle} placeholder="••••••••" required />
            </div>
            {error && <div style={{ fontSize: '0.85rem', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
            <Button type="submit" disabled={loading} style={{ marginTop: 8, justifyContent: 'center', padding: '12px' }}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
          <p style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Уже есть аккаунт? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
