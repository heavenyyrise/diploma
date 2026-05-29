import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { analytics } from '../api'
import { Card, PageHeader, StatCard, formatMoney } from '../components/ui'
import { getLeadSourceColor, getServiceColor } from '../utils/leadSourceColors'

export default function IncomePage() {
  const [summary, setSummary] = useState(null)
  const [byMonth, setByMonth] = useState([])
  const [byLeadSource, setByLeadSource] = useState([])
  const [byService, setByService] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [years, setYears] = useState([])

  useEffect(() => {
    analytics.years().then(r => setYears(r.data.length ? r.data : [new Date().getFullYear()]))
    analytics.summary().then(r => setSummary(r.data))
    analytics.byLeadSource().then(r => setByLeadSource(r.data))
    analytics.byService().then(r => setByService(r.data))
  }, [])

  useEffect(() => {
    analytics.byMonth({ year }).then(r => setByMonth(r.data))
  }, [year])

  return (
    <div className="page">
      <PageHeader title="Доходы" subtitle="Аналитика и статистика" />

      <div className="grid-stats-3" style={{ marginBottom: 28 }}>
        <StatCard label="Всего заработано" value={summary ? formatMoney(summary.total) : '—'} color="var(--accent)" />
        <StatCard label="Завершённых заказов" value={summary?.count ?? '—'} />
        <StatCard
          label="Изменение"
          value={summary ? `${summary.diff_pct > 0 ? '+' : ''}${summary.diff_pct}%` : '—'}
          color={summary?.diff >= 0 ? 'var(--success)' : 'var(--danger)'}
          sub="Относительно предыдущего периода"
        />
      </div>

      {/* Доходы по месяцам */}
      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 'var(--font-display-weight)' }}>Доходы по месяцам</h2>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: '#fff' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byMonth} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}к` : v} />
            <Tooltip formatter={v => formatMoney(v)} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', fontSize: 13 }} />
            <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Доход" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid-2">
        {/* Источники клиентов */}
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 'var(--font-display-weight)', marginBottom: 20 }}>Источники клиентов</h2>
          {byLeadSource.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет данных</div>
            : (
              <div className="pie-row">
                <PieChart width={160} height={160}>
                  <Pie data={byLeadSource} cx={75} cy={75} outerRadius={70} innerRadius={40} dataKey="total" paddingAngle={2}>
                    {byLeadSource.map((item, i) => <Cell key={i} fill={getLeadSourceColor(item.label)} />)}
                  </Pie>
                  <Tooltip formatter={v => formatMoney(v)} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
                </PieChart>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {byLeadSource.map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: getLeadSourceColor(item.label), flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', flex: 1 }}>{item.label}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatMoney(item.total)}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.count} зак.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </Card>

        {/* По услугам */}
        <Card style={{ padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 'var(--font-display-weight)', marginBottom: 20 }}>По услугам</h2>
          {byService.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет данных</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byService.slice(0, 6).map(s => {
                  const pct = (s.total / (byService[0]?.total || 1)) * 100
                  const color = getServiceColor(s.service)
                  return (
                    <div key={s.service}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{s.service}</span>
                        <span style={{ fontWeight: 500 }}>{formatMoney(s.total)}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </Card>
      </div>
    </div>
  )
}
