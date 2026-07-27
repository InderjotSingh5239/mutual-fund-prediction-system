import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AllocationDonut } from '@/components/charts/AllocationDonut'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { chartValueToNumber, formatCurrency } from '@/lib/utils'

function calculateLumpsum(principal: number, years: number, annualReturn: number) {
  const r = annualReturn / 100
  const series: { year: number; value: number }[] = [{ year: 0, value: principal }]
  for (let y = 1; y <= years; y++) {
    series.push({ year: y, value: Math.round(principal * Math.pow(1 + r, y)) })
  }
  const maturity = series[series.length - 1].value
  return { invested: principal, maturity, returns: maturity - principal, series }
}

export default function LumpsumCalculator() {
  const [principal, setPrincipal] = useState(100000)
  const [years, setYears] = useState(10)
  const [annualReturn, setAnnualReturn] = useState(12)

  const result = useMemo(() => calculateLumpsum(principal, years, annualReturn), [principal, years, annualReturn])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-950 dark:text-white flex items-center gap-2">
          <Calculator className="w-6 h-6" /> Lumpsum Calculator
        </h1>
        <p className="text-sm text-ink-500 dark:text-paper-200/50">
          Estimate the future value of a one-time investment.{' '}
          <Link to="/calculators/sip" className="text-emerald-600 dark:text-emerald-400 hover:underline">
            Try SIP instead →
          </Link>
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Investment Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderInput label="Lumpsum Amount" value={principal} min={5000} max={5000000} step={5000} onChange={setPrincipal} format={(v) => formatCurrency(v, true)} />
            <SliderInput label="Investment Period" value={years} min={1} max={30} step={1} onChange={setYears} format={(v) => `${v} years`} />
            <SliderInput label="Expected Annual Return" value={annualReturn} min={1} max={30} step={0.5} onChange={setAnnualReturn} format={(v) => `${v}%`} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-ink-500 dark:text-paper-200/50 uppercase mb-1">Invested Amount</p>
                <p className="text-2xl font-mono-data font-semibold text-ink-950 dark:text-white">{formatCurrency(result.invested, true)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-ink-500 dark:text-paper-200/50 uppercase mb-1">Estimated Returns</p>
                <p className="text-2xl font-mono-data font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(result.returns, true)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-ink-500 dark:text-paper-200/50 uppercase mb-1">Total Value</p>
                <p className="text-2xl font-mono-data font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(result.maturity, true)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Growth Projection</CardTitle>
              <CardDescription>Compounded growth over the investment period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={result.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lumpValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0fae72" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0fae72" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
                  <XAxis dataKey="year" tickFormatter={(v) => `Y${v}`} tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} tickFormatter={(v) => formatCurrency(v, true)} axisLine={false} tickLine={false} width={64} />
                  <Tooltip formatter={(v) => formatCurrency(chartValueToNumber(v))} labelFormatter={(v) => `Year ${v}`} />
                  <Area type="monotone" dataKey="value" name="Value" stroke="#0fae72" fill="url(#lumpValue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment Split</CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationDonut
                data={[
                  { name: 'Invested', value: result.invested },
                  { name: 'Returns', value: result.returns },
                ]}
                height={200}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-ink-950 dark:text-paper-100">{label}</label>
        <span className="text-sm font-mono-data font-semibold text-emerald-600 dark:text-emerald-400">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500"
      />
    </div>
  )
}
