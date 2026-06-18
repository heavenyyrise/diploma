import { useState, useMemo, useCallback } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { analytics } from '../api'
import { Card, PageHeader, StatCard, Button, formatMoney, PageLoadPlaceholder } from '../components/ui'
import { getLeadSourceColor } from '../utils/leadSourceColors'
import { usePageCache } from '../hooks/usePageCache'

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

const MONTH_NAMES = [
  '', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

const MONTH_NAMES_NOM = [
  '', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

function monthDateRange(year, month) {
  const lastDay = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, '0')
  return {
    date_from: `${year}-${mm}-01`,
    date_to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

function buildAnalyticsParams(period, selectedMonth) {
  if (selectedMonth) {
    return monthDateRange(selectedMonth.year, selectedMonth.month)
  }
  return { period }
}

function IncomeChartYTick({ y, payload }) {
  const v = payload.value
  const label = v >= 1000 ? `${v / 1000}к` : String(v)
  return (
    <text x={0} y={y} dy={4} fill="var(--text-muted)" fontSize={12} textAnchor="start">
      {label}
    </text>
  )
}

function PeriodSelect({ value, onChange, disabled }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ ...selectStyle, opacity: disabled ? 0.5 : 1 }}>
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

function serviceBarColor(index, total) {
  if (total <= 1) return 'var(--accent-dark)'
  const t = index / (total - 1)
  const lightMix = Math.round(15 + t * 55)
  return `color-mix(in srgb, var(--accent-dark) ${100 - lightMix}%, var(--accent-light))`
}

function previousPeriodLabel(period, selectedMonth) {
  if (selectedMonth) return 'прошлого месяца'
  if (period === 'year') return 'прошлого года'
  if (period === 'quarter') return 'прошлого квартала'
  return 'прошлого месяца'
}

function statsPeriodLabel(period, selectedMonth) {
  if (selectedMonth) {
    return `${MONTH_NAMES[selectedMonth.month]} ${selectedMonth.year}`
  }
  return periodLabel(period)
}

export default function IncomePage() {
  const [period, setPeriod] = useState('month')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loadError, setLoadError] = useState(null)

  const analyticsParams = useMemo(
    () => buildAnalyticsParams(period, selectedMonth),
    [period, selectedMonth],
  )

  const handleLoadError = () => setLoadError('Не удалось загрузить аналитику. Обновите страницу.')

  const staticLoader = useCallback(async () => {
    try {
      const [yearsRes, leadRes] = await Promise.all([
        analytics.years(),
        analytics.byLeadSource(),
      ])
      return {
        years: yearsRes.data.length ? yearsRes.data : [new Date().getFullYear()],
        byLeadSource: leadRes.data,
      }
    } catch {
      handleLoadError()
      return { years: [new Date().getFullYear()], byLeadSource: [] }
    }
  }, [])

  const statsKey = useMemo(
    () => `income:stats:${JSON.stringify(analyticsParams)}`,
    [analyticsParams],
  )

  const statsLoader = useCallback(async () => {
    setLoadError(null)
    try {
      const [summaryRes, byServiceRes, byClientTypeRes, newClientsRes] = await Promise.all([
        analytics.summary(analyticsParams),
        analytics.byService(analyticsParams),
        analytics.byClientType(analyticsParams),
        analytics.newClientsByLeadSource(analyticsParams),
      ])
      return {
        summary: summaryRes.data,
        byService: byServiceRes.data,
        byClientType: byClientTypeRes.data,
        newClients: newClientsRes.data,
      }
    } catch {
      handleLoadError()
      return { summary: null, byService: [], byClientType: [], newClients: [] }
    }
  }, [analyticsParams])

  const monthLoader = useCallback(async () => {
    try {
      const r = await analytics.byMonth({ year })
      return r.data
    } catch {
      handleLoadError()
      return []
    }
  }, [year])

  const { data: staticData } = usePageCache('income:static', staticLoader)
  const { data: statsData, loading: statsLoading } = usePageCache(statsKey, statsLoader)
  const { data: monthData } = usePageCache(`income:month:${year}`, monthLoader)

  const years = staticData?.years ?? [new Date().getFullYear()]
  const byLeadSource = staticData?.byLeadSource ?? []
  const summary = statsData?.summary ?? null
  const byService = statsData?.byService ?? []
  const byClientType = statsData?.byClientType ?? []
  const newClients = statsData?.newClients ?? []
  const byMonth = monthData ?? []

  const handlePeriodChange = value => {
    setSelectedMonth(null)
    setPeriod(value)
  }

  const handleYearChange = value => {
    setYear(value)
    setSelectedMonth(prev => (prev && prev.year !== value ? null : prev))
  }

  const handleMonthClick = useCallback(data => {
    if (!data?.month) return
    setSelectedMonth(prev => (
      prev?.year === year && prev?.month === data.month
        ? null
        : { year, month: data.month }
    ))
  }, [year])

  const clearSelectedMonth = () => setSelectedMonth(null)

  const periodSub = statsPeriodLabel(period, selectedMonth)
  const completedOrdersSub = selectedMonth
    ? `${MONTH_NAMES_NOM[selectedMonth.month]} ${selectedMonth.year} · по завершённым заказам`
    : `За ${periodLabel(period)} · по завершённым заказам`

  if (statsLoading && !statsData && !staticData) {
    return (
      <div className="page page-income">
        <PageLoadPlaceholder rows={4} />
      </div>
    )
  }

  return (
    <div className="page page-income">
      <PageHeader
        title="Доходы"
        subtitle="Аналитика и статистика"
        action={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {selectedMonth && (
              <>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-dark)', fontWeight: 500 }}>
                  {MONTH_NAMES_NOM[selectedMonth.month]} {selectedMonth.year}
                </span>
                <Button size="sm" variant="ghost" onClick={clearSelectedMonth}>Сбросить</Button>
              </>
            )}
            <PeriodSelect value={period} onChange={handlePeriodChange} disabled={!!selectedMonth} />
          </div>
        )}
      />

      {loadError && (
        <Card style={{ padding: '12px 16px', marginBottom: 16, borderColor: 'var(--danger)', background: 'var(--danger-bg)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>{loadError}</div>
        </Card>
      )}

      <div className="grid-stats-3" style={{ marginBottom: 28 }}>
        <StatCard
          label="Всего заработано"
          value={summary ? formatMoney(summary.total) : '—'}
          color="var(--accent)"
          sub={`За ${periodSub}`}
        />
        <StatCard
          label="Завершённых заказов"
          value={summary?.count ?? '—'}
          sub={`За ${periodSub}`}
        />
        <StatCard
          label="Изменение"
          value={summary ? `${summary.diff_pct > 0 ? '+' : ''}${summary.diff_pct}%` : '—'}
          color={summary?.diff >= 0 ? 'var(--success)' : 'var(--danger)'}
          sub={`Относительно ${previousPeriodLabel(period, selectedMonth)}`}
        />
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={sectionTitle}>Доходы по месяцам</h2>
          <select value={year} onChange={e => handleYearChange(Number(e.target.value))} style={selectStyle}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16, marginTop: 0 }}>
          Нажмите на столбец, чтобы посмотреть статистику за этот месяц
        </p>
        <div className="income-month-chart">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byMonth} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis
                width={30}
                tick={IncomeChartYTick}
                axisLine={false}
                tickLine={false}
              />
            <Tooltip formatter={v => formatMoney(v)} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', fontSize: 13 }} />
            <Bar
              dataKey="total"
              radius={[4, 4, 0, 0]}
              name="Доход"
              cursor="pointer"
              onClick={handleMonthClick}
            >
              {byMonth.map(entry => {
                const selected = selectedMonth?.year === year && selectedMonth?.month === entry.month
                return (
                  <Cell
                    key={entry.month}
                    fill={selected ? 'var(--accent-dark)' : entry.total > 0 ? 'var(--accent)' : 'var(--border-light, #e7e5e4)'}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </Card>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <CardSectionHeader
          title="По услугам"
          subtitle={completedOrdersSub}
        />
        {byService.length === 0
          ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Нет данных</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byService.slice(0, 6).map((s, index, items) => {
                const pct = (s.total / (byService[0]?.total || 1)) * 100
                return (
                  <div key={s.service_id ?? s.service}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.service}</span>
                      <span style={{ fontWeight: 500 }}>{formatMoney(s.total)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: serviceBarColor(index, items.length), borderRadius: 3 }} />
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
            subtitle={completedOrdersSub}
          />
          <SourcePie data={byClientType} />
        </Card>

        <Card style={{ padding: 24 }}>
          <CardSectionHeader
            title="Привлечение за период"
            subtitle={selectedMonth
              ? `Новые клиенты за ${MONTH_NAMES[selectedMonth.month]} ${selectedMonth.year}`
              : `Новые клиенты за ${periodLabel(period)}`}
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
