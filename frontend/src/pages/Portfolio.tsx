import { Wallet, TrendingUp } from 'lucide-react'
import { MUTUAL_FUNDS } from '@/data/mockFunds'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AllocationDonut } from '@/components/charts/AllocationDonut'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { chartValueToNumber, cn, formatCurrency, formatPercent } from '@/lib/utils'

interface Holding {
  fundId: string
  units: number
  investedValue: number
  purchaseDate: string
}

const HOLDINGS: Holding[] = [
  { fundId: 'ppfas-flexicap', units: 842.3, investedValue: 58000, purchaseDate: '2023-04-12' },
  { fundId: 'hdfc-topup', units: 62.1, investedValue: 65000, purchaseDate: '2022-11-03' },
  { fundId: 'sbi-smallcap', units: 210.7, investedValue: 30000, purchaseDate: '2024-01-20' },
  { fundId: 'axis-midcap', units: 305.4, investedValue: 27650, purchaseDate: '2023-08-15' },
  { fundId: 'dsp-corpbond', units: 3200, investedValue: 44000, purchaseDate: '2022-06-01' },
]

const HISTORY = [
  { month: 'Feb', value: 380000 },
  { month: 'Mar', value: 395000 },
  { month: 'Apr', value: 402000 },
  { month: 'May', value: 418000 },
  { month: 'Jun', value: 445000 },
  { month: 'Jul', value: 482650 },
]

export default function Portfolio() {
  const enriched = HOLDINGS.map((h) => {
    const fund = MUTUAL_FUNDS.find((f) => f.id === h.fundId)!
    const currentValue = Math.round(h.units * (fund.nav ?? 0))
    const pnl = currentValue - h.investedValue
    const pnlPercent = Math.round((pnl / h.investedValue) * 10000) / 100
    return { ...h, fund, currentValue, pnl, pnlPercent }
  })

  const totalInvested = enriched.reduce((sum, h) => sum + h.investedValue, 0)
  const totalCurrent = enriched.reduce((sum, h) => sum + h.currentValue, 0)
  const totalPnl = totalCurrent - totalInvested
  const totalPnlPercent = Math.round((totalPnl / totalInvested) * 10000) / 100

  const allocationData = enriched.map((h) => ({ name: h.fund.name.split(' ').slice(0, 3).join(' '), value: h.currentValue }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-950 dark:text-white flex items-center gap-2">
          <Wallet className="w-6 h-6" /> Portfolio
        </h1>
        <p className="text-sm text-ink-500 dark:text-paper-200/50">A snapshot of your mutual fund holdings.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-ink-500 dark:text-paper-200/50 uppercase mb-1">Invested Amount</p>
            <p className="text-2xl font-mono-data font-semibold text-ink-950 dark:text-white">{formatCurrency(totalInvested, true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-ink-500 dark:text-paper-200/50 uppercase mb-1">Current Value</p>
            <p className="text-2xl font-mono-data font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(totalCurrent, true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-ink-500 dark:text-paper-200/50 uppercase mb-1">Total P&L</p>
            <p className={cn('text-2xl font-mono-data font-semibold flex items-center gap-1', totalPnl >= 0 ? 'ticker-up' : 'ticker-down')}>
              <TrendingUp className="w-5 h-5" /> {formatCurrency(totalPnl, true)} ({formatPercent(totalPnlPercent)})
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Growth</CardTitle>
            <CardDescription>Value over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={HISTORY} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0fae72" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0fae72" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} tickFormatter={(v) => formatCurrency(v, true)} axisLine={false} tickLine={false} width={64} />
                <Tooltip formatter={(v) => formatCurrency(chartValueToNumber(v))} />
                <Area type="monotone" dataKey="value" stroke="#0fae72" fill="url(#portfolioFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonut data={allocationData} height={260} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-950/5 dark:border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-ink-500 dark:text-paper-200/50 uppercase">Fund</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-500 dark:text-paper-200/50 uppercase">Units</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-500 dark:text-paper-200/50 uppercase">Invested</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-500 dark:text-paper-200/50 uppercase">Current Value</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-500 dark:text-paper-200/50 uppercase">P&L</th>
                  <th className="px-5 py-3 text-xs font-medium text-ink-500 dark:text-paper-200/50 uppercase">Purchase Date</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((h) => (
                  <tr key={h.fundId} className="border-b border-ink-950/5 dark:border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/funds/${h.fund.id}`} className="font-medium text-ink-950 dark:text-paper-100 hover:text-emerald-600 dark:hover:text-emerald-400">
                        {h.fund.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono-data text-ink-950 dark:text-paper-100">{h.units.toFixed(2)}</td>
                    <td className="px-5 py-3 font-mono-data text-ink-950 dark:text-paper-100">{formatCurrency(h.investedValue, true)}</td>
                    <td className="px-5 py-3 font-mono-data text-ink-950 dark:text-white">{formatCurrency(h.currentValue, true)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={h.pnl >= 0 ? 'emerald' : 'crimson'}>{formatPercent(h.pnlPercent)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-ink-500 dark:text-paper-200/50 font-mono-data">{h.purchaseDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
