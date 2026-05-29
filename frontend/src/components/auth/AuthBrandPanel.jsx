export default function AuthBrandPanel() {
  return (
    <div className="auth-brand">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 'var(--font-display-weight)', color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
        Управляй своим<br /><span style={{ color: 'var(--accent)' }}>фрилансом</span><br />эффективно
      </div>
      <p className="auth-brand-desc" style={{ color: 'var(--text-sidebar)', fontSize: '0.875rem', lineHeight: 1.7 }}>
        Заказы, клиенты, услуги и аналитика доходов — всё в одном месте.
      </p>
    </div>
  )
}

export const authPageLayout = {
  page: { className: 'auth-page' },
  formSide: { className: 'auth-form-side' },
  formWrap: { className: 'auth-form-wrap' },
}
