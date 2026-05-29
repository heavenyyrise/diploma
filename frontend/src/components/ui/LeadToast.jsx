import { useLeads } from '../../context/LeadsContext'
import { useNavigate } from 'react-router-dom'

export default function LeadToast() {
  const { toast, dismissToast } = useLeads()
  const navigate = useNavigate()
  if (!toast) return null
  return (
    <div className="lead-toast" style={{ background: 'var(--bg-sidebar)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes shrink{from{width:100%}to{width:0%}}`}</style>
      <div style={{ height: 3, background: 'var(--accent)', animation: 'shrink 6s linear forwards' }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📬 Новая заявка</span>
          <button onClick={dismissToast} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>×</button>
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#fff', marginBottom: 3 }}>{toast.name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>{toast.contact}{toast.service_detail && <> · {toast.service_detail.name}</>}</div>
        <button onClick={() => { navigate('/leads'); dismissToast() }} style={{ width: '100%', padding: '7px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Посмотреть заявку →
        </button>
      </div>
    </div>
  )
}
