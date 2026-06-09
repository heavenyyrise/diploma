import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { orders as ordersApi } from '../api'
import { StatCard, Card, Badge, formatMoney, formatDate, PageLoadPlaceholder } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { usePageCache } from '../hooks/usePageCache'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const loader = useCallback(async () => {
    const [statsRes, recentRes] = await Promise.all([
      ordersApi.stats(),
      ordersApi.recent(),
    ])
    return { stats: statsRes.data, recent: recentRes.data }
  }, [])

  const { data, loading } = usePageCache('dashboard', loader)
  const stats = data?.stats ?? null
  const recent = data?.recent ?? []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 'var(--font-display-weight)', marginBottom: 4 }}>
          {greeting}{user?.first_name ? `, ${user.first_name}` : ''} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {loading && !data ? (
        <PageLoadPlaceholder rows={4} />
      ) : (
        <>
      <div className="grid-stats-4" style={{ marginBottom: 20 }}>
        <StatCard label="В работе" value={stats?.in_progress ?? '—'} color="var(--info)" />
        <StatCard label="Завершено" value={stats?.completed ?? '—'} color="var(--success)" />
        <StatCard label="Доход за месяц" value={stats ? formatMoney(stats.month_income) : '—'} color="var(--accent)" />
        <StatCard label="Всего доходов" value={stats ? formatMoney(stats.total_income) : '—'} />
      </div>

      <div className="grid-stats-3" style={{ marginBottom: 32 }}>
        <StatCard label="Заморожено" value={stats?.frozen ?? '—'} />
        <StatCard label="Отменено" value={stats?.cancelled ?? '—'} />
        <StatCard label="Просрочено" value={stats?.overdue ?? '—'} color={stats?.overdue > 0 ? 'var(--danger)' : undefined} sub={stats?.overdue > 0 ? 'Требует внимания' : 'Всё в порядке'} />
      </div>

      <Card>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 'var(--font-display-weight)' }}>Последние заказы</h2>
          <button onClick={() => navigate('/orders')} style={{ fontSize: '0.8rem', color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 500 }}>Все заказы →</button>
        </div>
        {recent.length === 0
          ? <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Заказов пока нет</div>
          : recent.map((order, i) => (
              <div key={order.id} onClick={() => navigate(`/orders/${order.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                className="list-row"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{order.client?.name || 'Без клиента'} · {order.platform_display}</div>
                </div>
                <Badge status={order.status} label={order.status_display} />
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{formatMoney(order.price)}</div>
                <div className="list-row-meta hide-sm">{formatDate(order.created_at)}</div>
              </div>
            ))
        }
      </Card>
        </>
      )}
    </div>
  )
}
