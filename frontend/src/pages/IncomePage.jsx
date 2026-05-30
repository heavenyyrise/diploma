import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { analytics } from '../api'
import { Card, PageHeader, StatCard, formatMoney } from '../components/ui'
import { getLeadSourceColor, getServiceColor } from '../utils/leadSourceColors'

const selectStyle = {
  padding: '6px 12px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.85rem',
  background: '#fff',
  flexShrink: 0,
}

const sectionTitle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.05rem',
  fontWeight: 'var(--font-display-weight)',
}

function PeriodSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
      <option value="month">Месяц</option>
      <option value="quarter">Квартал</option>
      <option value="year">Год</option>
    </select>
  )
}

function CardSectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={sectionTitle}>{title}</h2>
      {subtitle && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>{subtitle}</p>
      )}
    </div>
  )
}

function SourcePie({ data, valueKey = 'total', formatValue = formatMoney }) {
  if (!data.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет данных</div>
  }
  return (
    <div className="pie-row">
      <PieChart width={160} height={160}>
        <Pie data={data} cx={75} cy={75} outerRadius={70} innerRadius={40} dataKey={valueKey} paddingAngle={2}>
          {data.map((item, i) => <Cell key={i} fill={getLeadSourceColor(item.label)} />)}
        </Pie>
        <Tooltip formatter={v => formatValue(v)} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
      </PieChart>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: getLeadSourceColor(item.label), flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', flex: 1 }}>{item.label}</span>
            <div style={{ textAlign: 'right' }}>
              {valueKey === 'total' && (
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{formatMoney(item.total)}</div>
              )}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.count} зак.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function clientCountLabel(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return `${n} новых клиентов`
  if (mod10 === 1) return `${n} новый клиент`
  if (mod10 >= 2 && mod10 <= 4) return `${n} новых клиента`
  return `${n} новых клиентов`
}

function periodLabel(period) {
  if (period === 'year') return 'год'
  if (period === 'quarter') return 'квартал'
  return 'месяц'
}

function previousPeriodLabel(period) {
  if (period === 'year') return 'прошлого года'
  if (period === 'quarter') return 'прошлого квартала'
  return 'прошлого месяца'
}

export default function IncomePage() {
  const [period, setPeriod] = useState('month')
  const [summary, setSummary] = useState(null)
  const [byMonth, setByMonth] = useState([])
  const [byLeadSource, setByLeadSource] = useState([])
  const [byClientType, setByClientType] = useState([])
  const [newClients, setNewClients] = useState([])
  const [byService, setByService] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [years, setYears] = useState([])

  useEffect(() => {
    analytics.years().then(r => setYears(r.data.length ? r.data : [new Date().getFullYear()]))
    analytics.byLeadSource().then(r => setByLeadSource(r.data))
  }, [])

  useEffect(() => {
    analytics.summary({ period }).then(r => setSummary(r.data))
    analytics.byService({ period }).then(r => setByService(r.data))
    analytics.byClientType({ period }).then(r => setByClientType(r.data))
    analytics.newClientsByLeadSource({ period }).then(r => setNewClients(r.data))
  }, [period])

  useEffect(() => {
    analytics.byMonth({ year }).then(r => setByMonth(r.data))
  }, [year])

  return (
    <div className="page">
      <PageHeader
        title="Доходы"
        subtitle="Аналитика и статистика"
        action={<PeriodSelect value={period} onChange={setPeriod} />}
      />

      <div className="grid-stats-3" style={{ marginBottom: 28 }}>
        <StatCard
          label="Всего заработано"
          value={summary ? formatMoney(summary.total) : '—'}
          color="var(--accent)"
          sub={`За ${periodLabel(period)}`}
        />
        <StatCard
          label="Завершённых заказов"
          value={summary?.count ?? '—'}
          sub={`За ${periodLabel(period)}`}
        />
        <StatCard
          label="Изменение"
          value={summary ? `${summary.diff_pct > 0 ? '+' : ''}${summary.diff_pct}%` : '—'}
          color={summary?.diff >= 0 ? 'var(--success)' : 'var(--danger)'}
          sub={`Относительно ${previousPeriodLabel(period)}`}
        />
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={sectionTitle}>Доходы по месяцам</h2>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={selectStyle}>
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

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <CardSectionHeader
          title="По услугам"
          subtitle={`За ${periodLabel(period)} · по завершённым заказам`}
        />
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

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <Card style={{ padding: 24 }}>
          <CardSectionHeader
            title="Доход по типу клиента"
            subtitle={`За ${periodLabel(period)} · по завершённым заказам`}
          />
          <SourcePie data={byClientType} />
        </Card>

        <Card style={{ padding: 24 }}>
          <CardSectionHeader
            title="Привлечение за период"
            subtitle={`Новые клиенты за ${periodLabel(period)}`}
          />
          {newClients.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет новых клиентов</div>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {newClients.map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: getLeadSourceColor(item.label), flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {clientCountLabel(item.count)}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      <Card style={{ padding: 24 }}>
        <h2 style={{ ...sectionTitle, marginBottom: 4 }}>Доход по источникам</h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>За всё время · first-touch · общая ценность каналов</p>
        <SourcePie data={byLeadSource} />
      </Card>
    </div>
  )
}
