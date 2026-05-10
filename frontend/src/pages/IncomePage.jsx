import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { analytics } from '../api'
import { Card, PageHeader, StatCard, formatMoney } from '../components/ui'

const COLORS = ['#c17b5c','#a0624a','#d4967a','#e8bba8','#6b9e8a','#4a7fb5']

export default function IncomePage() {
  const [summary, setSummary] = useState(null)
  const [byMonth, setByMonth] = useState([])
  const [byPlatform, setByPlatform] = useState([])
  const [byService, setByService] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [years, setYears] = useState([])

  useEffect(() => {
    analytics.years().then(r => setYears(r.data.length ? r.data : [new Date().getFullYear()]))
    analytics.summary().then(r => setSummary(r.data))
  }, [])

  useEffect(() => {
    analytics.byMonth({ year }).then(r => setByMonth(r.data))
    analytics.byPlatform().then(r => setByPlatform(r.data))
    analytics.byService().then(r => setByService(r.data))
  }, [year])

  return (
    <div style={{ padding: '36px 40px' }}>
      <PageHeader title="Доходы" subtitle="Аналитика и статистика" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Всего заработано" value={summary ? formatMoney(summary.total) : '—'} color="var(--accent)" />
        <StatCard label="Завершённых заказов" value={summary?.count ?? '—'} />
        <StatCard label="Изменение" value={summary ? `${summary.diff_pct > 0 ? '+' : ''}${summary.diff_pct}%` : '—'} color={summary?.diff >= 0 ? 'var(--success)' : 'var(--danger)'} sub="Относительно предыдущего периода" />
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 500 }}>Доходы по месяцам</h2>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: '#fff' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byMonth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}к` : v} />
            <Tooltip formatter={v => formatMoney(v)} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', fontSize: 13 }} />
            <Bar dataKey="total" fill="var(--accent)" radius={[4,4,0,0]} name="Доход" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 500, marginBottom: 20 }}>По площадкам</h2>
          {byPlatform.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет данных</div>
            : <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <PieChart width={160} height={160}>
                  <Pie data={byPlatform} cx={75} cy={75} outerRadius={70} innerRadius={40} dataKey="total" paddingAngle={2}>
                    {byPlatform.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatMoney(v)} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                </PieChart>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {byPlatform.map((p, i) => (
                    <div key={p.platform} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', flex: 1 }}>{p.label}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatMoney(p.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </Card>

        <Card style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 500, marginBottom: 20 }}>По услугам</h2>
          {byService.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет данных</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byService.slice(0, 6).map((s, i) => {
                  const pct = (s.total / (byService[0]?.total || 1)) * 100
                  return (
                    <div key={s.service}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{s.service}</span>
                        <span style={{ fontWeight: 500 }}>{formatMoney(s.total)}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--accent-light)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </Card>
      </div>
    </div>
  )
}
