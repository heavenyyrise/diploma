export default function AuthBrandPanel() {
  return (
    <div style={{ flex: 1, background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', maxWidth: 420 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
        Управляй своим<br /><span style={{ color: 'var(--accent)' }}>фрилансом</span><br />эффективно
      </div>
      <p style={{ color: 'var(--text-sidebar)', fontSize: '0.875rem', lineHeight: 1.7 }}>
        Заказы, клиенты, услуги и аналитика доходов — всё в одном месте.
      </p>
    </div>
  )
}

export const authPageLayout = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg)' },
  formSide: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 },
  formWrap: { width: '100%', maxWidth: 360 },
}
