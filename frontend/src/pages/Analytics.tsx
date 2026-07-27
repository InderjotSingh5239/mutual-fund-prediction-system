import { useMemo, useState } from 'react'
import { LineChart as LineChartIcon } from 'lucide-react'
import { MUTUAL_FUNDS } from '@/data/mockFunds'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { chartValueToNumber, cn, formatPercent } from '@/lib/utils'

function computeRollingReturns(navHistory: { date: string; nav: number }[], windowDays: number) {
  const result: { date: string; return: number }[] = []
  for (let i = windowDays; i < navHistory.length; i++) {
    const past = navHistory[i - windowDays].nav
    const current = navHistory[i].nav
    result.push({ date: navHistory[i].date, return: Math.round(((current - past) / past) * 10000) / 100 })
  }
  return result
}

function computeDrawdown(navHistory: { date: string; nav: number }[]) {
  let peak = -Infinity
  return navHistory.map((p) => {
    peak = Math.max(peak, p.nav)
    return { date: p.date, drawdown: Math.round(((p.nav - peak) / peak) * 10000) / 100 }
  })
}

function computeMonthlyReturns(navHistory: { date: string; nav: number }[]) {
  const byMonth = new Map<string, { first: number; last: number }>()
  for (const p of navHistory) {
    const key = p.date.slice(0, 7)
    if (!byMonth.has(key)) byMonth.set(key, { first: p.nav, last: p.nav })
    else byMonth.get(key)!.last = p.nav
  }
  return Array.from(byMonth.entries()).map(([month, { first, last }]) => ({
    month,
    return: Math.round(((last - first) / first) * 10000) / 100,
  }))
}

export default function Analytics() {
  const [fundId, setFundId] = useState(MUTUAL_FUNDS[0].id)
  const fund = MUTUAL_FUNDS.find((f) => f.id === fundId)!

  const rolling30 = useMemo(() => computeRollingReturns(fund.navHistory, 30), [fund])
  const drawdown = useMemo(() => computeDrawdown(fund.navHistory), [fund])
  const monthly = useMemo(() => computeMonthlyReturns(fund.navHistory), [fund])
  const maxDrawdown = Math.min(...drawdown.map((d) => d.drawdown))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-950 dark:text-white flex items-center gap-2">
            <LineChartIcon className="w-6 h-6" /> Performance Analytics
          </h1>
          <p className="text-sm text-ink-500 dark:text-paper-200/50">Deep risk and return analysis for a single fund.</p>
        </div>
        <Select value={fundId} onChange={(e) => setFundId(e.target.value)} className="max-w-xs">
          {MUTUAL_FUNDS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <MetricCard label="3Y CAGR" value={`${fund.cagr3y ?? '—'}%`} positive />
        <MetricCard label="Alpha" value={(fund.riskMetrics?.alpha ?? 0).toString()} positive={(fund.riskMetrics?.alpha ?? 0) >= 0} />
        <MetricCard label="Beta" value={(fund.riskMetrics?.beta ?? 0).toString()} />
        <MetricCard label="Sharpe Ratio" value={(fund.riskMetrics?.sharpeRatio ?? 0).toString()} positive={(fund.riskMetrics?.sharpeRatio ?? 0) >= 1} />
        <MetricCard label="Std. Deviation" value={`${fund.riskMetrics?.standardDeviation ?? '—'}%`} />
        <MetricCard label="Max Drawdown" value={`${maxDrawdown}%`} positive={false} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>30-Day Rolling Returns</CardTitle>
            <CardDescription>Annualized-style rolling window return over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={rolling30.filter((_, i) => i % 5 === 0)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} minTickGap={40} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${chartValueToNumber(v).toFixed(2)}%`} />
                <Line type="monotone" dataKey="return" stroke="#2f6fed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drawdown</CardTitle>
            <CardDescription>Decline from peak NAV over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={drawdown.filter((_, i) => i % 5 === 0)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e5484d" stopOpacity={0} />
                    <stop offset="100%" stopColor="#e5484d" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} minTickGap={40} />
                <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${chartValueToNumber(v).toFixed(2)}%`} />
                <Area type="monotone" dataKey="drawdown" stroke="#e5484d" strokeWidth={1.5} fill="url(#ddFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Returns Heatmap</CardTitle>
          <CardDescription>Month-over-month NAV change</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {monthly.map((m) => (
              <div
                key={m.month}
                title={`${m.month}: ${formatPercent(m.return)}`}
                className={cn(
                  'w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white',
                  m.return >= 3
                    ? 'bg-emerald-600'
                    : m.return >= 0
                      ? 'bg-emerald-500/60'
                      : m.return >= -3
                        ? 'bg-crimson-500/60'
                        : 'bg-crimson-600'
                )}
              >
                <span className="text-[9px] font-mono-data opacity-80">{m.month.slice(2)}</span>
                <span className="text-xs font-mono-data font-semibold">{m.return}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[10px] text-ink-500 dark:text-paper-200/50 uppercase tracking-wide mb-1">{label}</p>
        <p className={cn('text-lg font-mono-data font-semibold', positive === undefined ? 'text-ink-950 dark:text-white' : positive ? 'ticker-up' : 'ticker-down')}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}
