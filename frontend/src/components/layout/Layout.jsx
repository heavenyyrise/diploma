import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLeads } from '../../context/LeadsContext'
import LeadToast from '../ui/LeadToast'

const NAV = [
  { to: '/',             label: 'Дашборд',      icon: <GridIcon />,   exact: true },
  { to: '/orders',       label: 'Заказы',        icon: <BriefIcon /> },
  { to: '/leads',        label: 'Заявки',        icon: <InboxIcon />,  badge: true },
  { to: '/clients',      label: 'Клиенты',       icon: <UsersIcon /> },
  { to: '/services',     label: 'Услуги',        icon: <StarIcon /> },
  { to: '/income',       label: 'Доходы',        icon: <ChartIcon /> },
  { to: '/form-settings',label: 'Форма заявки',  icon: <FormIcon /> },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { newCount } = useLeads()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 'var(--sidebar-width)', background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid #292524' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500, color: '#fff' }}>Freelancer</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>ARM</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: isActive ? 500 : 400, color: isActive ? '#fff' : 'var(--text-sidebar)', background: isActive ? 'var(--bg-sidebar-active)' : 'transparent', textDecoration: 'none' })}>
              {({ isActive }) => (
                <>
                  <span style={{ opacity: 0.7, display: 'flex' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && newCount > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: 'var(--accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
                      {newCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid #292524' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#fff', flexShrink: 0 }}>
              {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.first_name || user?.username}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Фрилансер</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} style={{ width: '100%', padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'transparent', border: '1px solid #292524', cursor: 'pointer', textAlign: 'left' }}>
            Выйти
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 'var(--sidebar-width)', flex: 1, minHeight: '100vh', background: 'var(--bg)' }}>
        <Outlet />
      </main>
      <LeadToast />
    </div>
  )
}

function GridIcon()  { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function BriefIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> }
function InboxIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> }
function UsersIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function StarIcon()  { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function ChartIcon() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function FormIcon()  { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="11" y2="16"/></svg> }
