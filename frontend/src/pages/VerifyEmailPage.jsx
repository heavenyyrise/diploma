import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Button } from '../components/ui'
import AuthBrandPanel, { authPageLayout } from '../components/auth/AuthBrandPanel'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Ссылка подтверждения недействительна.')
      return
    }
    axios.get('/api/auth/verify-email/', { params: { token } })
      .then(r => {
        setStatus('success')
        setMessage(r.data.message || 'Email успешно подтверждён.')
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Не удалось подтвердить email.')
      })
  }, [searchParams])

  return (
    <div {...authPageLayout.page}>
      <AuthBrandPanel />
      <div {...authPageLayout.formSide}>
        <div {...authPageLayout.formWrap}>
          {status === 'loading' && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Подтверждаем email...</p>
          )}
          {status === 'success' && (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✓</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 'var(--font-display-weight)', marginBottom: 8, color: 'var(--success)' }}>
                Email подтверждён
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 24 }}>{message}</p>
              <Button onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                Войти
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✕</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 'var(--font-display-weight)', marginBottom: 8, color: 'var(--danger)' }}>
                Ошибка
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 24 }}>{message}</p>
              <Button onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                На страницу входа
              </Button>
              <p style={{ marginTop: 16, fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Нужно новое письмо? <Link to="/register" style={{ color: 'var(--accent)' }}>Зарегистрируйтесь снова</Link> или обратитесь к администратору.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
