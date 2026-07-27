import { useState } from 'react'
import { GitCompareArrows, X, Plus } from 'lucide-react'
import { MUTUAL_FUNDS } from '@/data/mockFunds'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { cn, formatPercent } from '@/lib/utils'

const MAX_COMPARE = 5

const ROWS: { label: string; get: (f: (typeof MUTUAL_FUNDS)[number]) => string; positive?: (f: (typeof MUTUAL_FUNDS)[number]) => boolean }[] = [
  { label: 'NAV', get: (f) => `₹${(f.nav ?? 0).toFixed(2)}` },
  { label: '3Y CAGR', get: (f) => `${f.cagr3y ?? '—'}%`, positive: () => true },
  { label: '1Y Return', get: (f) => formatPercent(f.returns?.['1Y'] ?? 0), positive: (f) => (f.returns?.['1Y'] ?? 0) >= 0 },
  { label: 'Risk Level', get: (f) => f.riskLevel ?? '—' },
  { label: 'Expense Ratio', get: (f) => `${f.expenseRatio}%` },
  { label: 'AUM', get: (f) => `₹${(f.aum ?? 0).toLocaleString('en-IN')}Cr` },
  { label: 'Alpha', get: (f) => (f.riskMetrics?.alpha ?? 0).toString(), positive: (f) => (f.riskMetrics?.alpha ?? 0) >= 0 },
  { label: 'Beta', get: (f) => (f.riskMetrics?.beta ?? 0).toString() },
  { label: 'Sharpe Ratio', get: (f) => (f.riskMetrics?.sharpeRatio ?? 0).toString(), positive: (f) => (f.riskMetrics?.sharpeRatio ?? 0) >= 1 },
]

export default function CompareFunds() {
  const [selectedIds, setSelectedIds] = useState<string[]>([MUTUAL_FUNDS[0].id, MUTUAL_FUNDS[1].id])

  const funds = selectedIds.map((id) => MUTUAL_FUNDS.find((f) => f.id === id)!).filter(Boolean)
  const availableToAdd = MUTUAL_FUNDS.filter((f) => !selectedIds.includes(f.id))

  const addFund = (id: string) => {
    if (selectedIds.length < MAX_COMPARE) setSelectedIds((prev) => [...prev, id])
  }
  const removeFund = (id: string) => setSelectedIds((prev) => prev.filter((i) => i !== id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-950 dark:text-white flex items-center gap-2">
          <GitCompareArrows className="w-6 h-6" /> Compare Funds
        </h1>
        <p className="text-sm text-ink-500 dark:text-paper-200/50">Compare up to {MAX_COMPARE} funds side by side.</p>
      </div>

      {selectedIds.length < MAX_COMPARE && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <Plus className="w-4 h-4 text-ink-500 shrink-0" />
            <Select
              className="max-w-sm"
              value=""
              onChange={(e) => e.target.value && addFund(e.target.value)}
            >
              <option value="">Add a fund to compare...</option>
              {availableToAdd.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
            <span className="text-xs text-ink-500 dark:text-paper-200/40">{selectedIds.length}/{MAX_COMPARE} selected</span>
          </CardContent>
        </Card>
      )}

      {funds.length === 0 ? (
        <EmptyState icon={GitCompareArrows} title="No funds selected" description="Add funds above to start comparing." />
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="min-w-[640px]">
            <div
              className="grid gap-3 mb-3"
              style={{ gridTemplateColumns: `160px repeat(${funds.length}, minmax(180px, 1fr))` }}
            >
              <div />
              {funds.map((f) => (
                <Card key={f.id} className="relative">
                  <button
                    onClick={() => removeFund(f.id)}
                    aria-label={`Remove ${f.name}`}
                    className="absolute top-2 right-2 p-1 rounded-lg hover:bg-ink-950/10 dark:hover:bg-white/10 text-ink-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <CardContent className="p-4">
                    <p className="font-display font-semibold text-sm text-ink-950 dark:text-white leading-snug pr-5 mb-1">{f.name}</p>
                    <p className="text-xs text-ink-500 dark:text-paper-200/50">{f.amc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                {ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      'grid items-center px-4 py-3',
                      i !== ROWS.length - 1 && 'border-b border-ink-950/5 dark:border-white/5'
                    )}
                    style={{ gridTemplateColumns: `160px repeat(${funds.length}, minmax(180px, 1fr))` }}
                  >
                    <p className="text-xs font-medium text-ink-500 dark:text-paper-200/50 uppercase tracking-wide">{row.label}</p>
                    {funds.map((f) => {
                      const isGood = row.positive?.(f)
                      return (
                        <p
                          key={f.id}
                          className={cn(
                            'text-sm font-mono-data font-medium',
                            row.positive ? (isGood ? 'ticker-up' : 'ticker-down') : 'text-ink-950 dark:text-paper-100'
                          )}
                        >
                          {row.get(f)}
                        </p>
                      )
                    })}
                  </div>
                ))}
                <div
                  className="grid items-center px-4 py-3"
                  style={{ gridTemplateColumns: `160px repeat(${funds.length}, minmax(180px, 1fr))` }}
                >
                  <p className="text-xs font-medium text-ink-500 dark:text-paper-200/50 uppercase tracking-wide">Category</p>
                  {funds.map((f) => (
                    <Badge key={f.id} variant="outline" className="w-fit">
                      {f.category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
