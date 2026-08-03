import { Wallet, TrendingUp, TrendingDown, Sparkles, Activity, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/common/StatCard'
import { FundRow } from '@/components/common/FundRow'
import { FundCard } from '@/components/common/FundCard'
import { Loader } from '@/components/common/Loader'
import { NavHistoryChart } from '@/components/charts/NavHistoryChart'
import { useTopGainers, useTopLosers, useTrendingFunds } from '@/hooks/useFunds'
import { formatPercent } from '@/lib/utils'

const RECENT_ACTIVITY = [
  { id: 1, action: 'SIP executed', fund: 'Parag Parikh Flexi Cap Fund', amount: '₹5,000', time: '2h ago' },
  { id: 2, action: 'Added to watchlist', fund: 'Mirae Asset Tax Saver Fund', amount: null, time: '5h ago' },
  { id: 3, action: 'AI prediction generated', fund: 'SBI Small Cap Fund', amount: null, time: '1d ago' },
  { id: 4, action: 'Lumpsum invested', fund: 'HDFC Top 100 Fund', amount: '₹25,000', time: '2d ago' },
]

export default function Dashboard() {
  const { data: gainers, isLoading: loadingGainers } = useTopGainers(4)
  const { data: losers, isLoading: loadingLosers } = useTopLosers(4)
  const { data: trending, isLoading: loadingTrending } = useTrendingFunds(3)
 const { data: AI_PICKS = [] } = useTrendingFunds(6)

  const benchmarkFund = trending?.[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-950 dark:text-white">Dashboard</h1>
          <p className="text-sm text-ink-500 dark:text-paper-200/50">Welcome back — here's your market overview.</p>
        </div>
        <Link to="/predict">
          <Button>
            <Sparkles className="w-4 h-4" /> Run AI Prediction
          </Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Portfolio Value" value="₹4,82,650" delta="+3.2%" positive accent="emerald" />
        <StatCard
  icon={Activity}
  label="Total Funds Tracked"
  value={trending?.length?.toString() ?? "0"}
  delta="+2 this month"
  positive
  accent="blue"
/>
        <StatCard icon={TrendingUp} label="Top Category CAGR" value="26.7%" delta="Small Cap" positive accent="emerald" />
        <StatCard icon={TrendingDown} label="Avg. Expense Ratio" value="0.58%" delta="-0.03%" positive accent="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main chart + AI picks */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>
  {benchmarkFund?.name ?? "Loading..."} · {benchmarkFund?.benchmark ?? ""}
</CardDescription>
              </div>
              <Badge variant="emerald">{formatPercent(benchmarkFund?.navChangePercent ?? 0)}</Badge>
            </CardHeader>
            <CardContent>
              <NavHistoryChart data={benchmarkFund?.navHistory ?? []} showMovingAverages />
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-ink-950 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> AI Recommendations
              </h2>
              <Link to="/predict" className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AI_PICKS.map((fund) => (
                <FundCard key={fund.id} fund={fund} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Meter</CardTitle>
              <CardDescription>Your portfolio's blended volatility score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-mono-data font-semibold text-ink-950 dark:text-white">6.2</span>
                <Badge variant="amber">Moderately High</Badge>
              </div>
              <Progress value={62} barClassName="bg-gradient-to-r from-emerald-500 via-amber-500 to-crimson-500" />
              <p className="text-xs text-ink-500 dark:text-paper-200/50">
                Based on standard deviation across your top holdings vs. category benchmarks.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Gainers</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingGainers ? <Loader /> : <div className="divide-y divide-ink-950/5 dark:divide-white/5">{gainers?.map((f) => <FundRow key={f.id} fund={f} />)}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Losers</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLosers ? <Loader /> : <div className="divide-y divide-ink-950/5 dark:divide-white/5">{losers?.map((f) => <FundRow key={f.id} fund={f} />)}</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trending Funds</CardTitle>
            <CardDescription>Ranked by 3-year CAGR</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrending ? (
              <Loader />
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                {trending?.map((f) => (
                  <FundCard key={f.id} fund={f} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {RECENT_ACTIVITY.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2 py-2.5 border-b border-ink-950/5 dark:border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-ink-950 dark:text-paper-100">{a.action}</p>
                  <p className="text-xs text-ink-500 dark:text-paper-200/50">{a.fund}</p>
                </div>
                <div className="text-right shrink-0">
                  {a.amount && <p className="text-sm font-mono-data font-medium text-ink-950 dark:text-white">{a.amount}</p>}
                  <p className="text-xs text-ink-500 dark:text-paper-200/40">{a.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
