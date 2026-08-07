import { useEffect, useState } from 'react'
import { Calculator, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { calculateRetirement } from '@/services/calculatorService'
import type { ApiRetirementResponse } from '@/types/api'

export default function RetirementCalculator() {
  const [currentAge, setCurrentAge] = useState(25)
  const [retirementAge, setRetirementAge] = useState(60)
  const [currentSavings, setCurrentSavings] = useState(100000)
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000)
  const [annualReturn, setAnnualReturn] = useState(12)
  const [stepUp, setStepUp] = useState(5)
  const [annualExpense, setAnnualExpense] = useState(600000)
  const [inflation, setInflation] = useState(6)
  const [lifeExpectancy, setLifeExpectancy] = useState(85)

  const [result, setResult] = useState<ApiRetirementResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (retirementAge <= currentAge || lifeExpectancy <= retirementAge) {
      setResult(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await calculateRetirement({
          current_age: currentAge,
          retirement_age: retirementAge,
          current_savings: currentSavings,
          monthly_investment: monthlyInvestment,
          expected_annual_return_percent: annualReturn,
          expected_annual_step_up_percent: stepUp,
          post_retirement_annual_expense: annualExpense,
          inflation_percent: inflation,
          life_expectancy_age: lifeExpectancy,
        })

        setResult(response)
      } catch (err) {
        console.error(err)
        setError('Unable to calculate retirement projection.')
        setResult(null)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [
    currentAge,
    retirementAge,
    currentSavings,
    monthlyInvestment,
    annualReturn,
    stepUp,
    annualExpense,
    inflation,
    lifeExpectancy,
  ])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-semibold text-ink-950 dark:text-white">
            Retirement Calculator
          </h1>
        </div>

        <p className="mt-1 text-sm text-ink-500 dark:text-paper-200/60">
          Estimate your retirement corpus and determine whether your current
          investment strategy is sufficient.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Retirement Inputs</CardTitle>
            <CardDescription>
              Adjust your financial assumptions
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <NumberInput
              label="Current Age"
              value={currentAge}
              min={18}
              max={retirementAge - 1}
              step={1}
              onChange={setCurrentAge}
            />

            <NumberInput
              label="Retirement Age"
              value={retirementAge}
              min={currentAge + 1}
              max={lifeExpectancy - 1}
              step={1}
              onChange={setRetirementAge}
            />

            <NumberInput
              label="Current Savings"
              value={currentSavings}
              min={0}
              max={100000000}
              step={5000}
              onChange={setCurrentSavings}
              currency
            />

            <NumberInput
              label="Monthly Investment"
              value={monthlyInvestment}
              min={0}
              max={1000000}
              step={500}
              onChange={setMonthlyInvestment}
              currency
            />

            <NumberInput
              label="Expected Annual Return"
              value={annualReturn}
              min={1}
              max={30}
              step={0.5}
              onChange={setAnnualReturn}
              suffix="%"
            />

            <NumberInput
              label="Annual Step-up"
              value={stepUp}
              min={0}
              max={30}
              step={1}
              onChange={setStepUp}
              suffix="%"
            />

            <NumberInput
              label="Post-retirement Annual Expense"
              value={annualExpense}
              min={0}
              max={10000000}
              step={10000}
              onChange={setAnnualExpense}
              currency
            />

            <NumberInput
              label="Inflation"
              value={inflation}
              min={0}
              max={20}
              step={0.5}
              onChange={setInflation}
              suffix="%"
            />

            <NumberInput
              label="Life Expectancy"
              value={lifeExpectancy}
              min={retirementAge + 1}
              max={120}
              step={1}
              onChange={setLifeExpectancy}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {loading && (
            <Card>
              <CardContent className="p-8 text-center">
                Calculating retirement projection...
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardContent className="p-8 text-center text-red-500">
                {error}
              </CardContent>
            </Card>
          )}

          {retirementAge <= currentAge && (
            <Card>
              <CardContent className="p-8 text-center text-amber-600">
                Retirement age must be greater than current age.
              </CardContent>
            </Card>
          )}

          {lifeExpectancy <= retirementAge && (
            <Card>
              <CardContent className="p-8 text-center text-amber-600">
                Life expectancy must be greater than retirement age.
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <ResultCard
                  title="Years to Retirement"
                  value={`${result.years_to_retirement} years`}
                  icon={<TrendingUp className="w-5 h-5" />}
                />

                <ResultCard
                  title="Corpus at Retirement"
                  value={formatCurrency(result.corpus_at_retirement, true)}
                  icon={<TrendingUp className="w-5 h-5" />}
                />

                <ResultCard
                  title="Required Corpus"
                  value={formatCurrency(
                    result.required_corpus_at_retirement,
                    true
                  )}
                  icon={<Calculator className="w-5 h-5" />}
                />

                <ResultCard
                  title={
                    result.corpus_sufficient
                      ? 'Surplus'
                      : 'Shortfall'
                  }
                  value={formatCurrency(
                    Math.abs(result.shortfall_or_surplus),
                    true
                  )}
                  icon={
                    result.corpus_sufficient ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )
                  }
                  positive={result.corpus_sufficient}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Retirement Readiness
                  </CardTitle>
                  <CardDescription>
                    Based on the assumptions provided
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div
                    className={`rounded-lg border p-5 ${
                      result.corpus_sufficient
                        ? 'border-emerald-500/30'
                        : 'border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.corpus_sufficient ? (
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      )}

                      <div>
                        <p className="font-semibold text-ink-950 dark:text-white">
                          {result.corpus_sufficient
                            ? 'Your projected corpus is sufficient'
                            : 'Your projected corpus may be insufficient'}
                        </p>

                        <p className="text-sm text-ink-500 dark:text-paper-200/60">
                          {result.corpus_sufficient
                            ? 'Your current investment strategy is projected to cover the estimated retirement requirement.'
                            : 'Consider increasing your monthly investment or reviewing your retirement assumptions.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!result.corpus_sufficient &&
                    result.monthly_investment_needed_if_shortfall !== null && (
                      <div className="rounded-lg bg-amber-500/10 p-5">
                        <p className="text-sm text-ink-500 dark:text-paper-200/60">
                          Estimated additional monthly investment required
                        </p>

                        <p className="mt-1 text-2xl font-semibold text-amber-600">
                          {formatCurrency(
                            result.monthly_investment_needed_if_shortfall,
                            true
                          )}
                        </p>
                      </div>
                    )}

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <InfoRow
                      label="Projected Corpus"
                      value={formatCurrency(
                        result.corpus_at_retirement,
                        true
                      )}
                    />

                    <InfoRow
                      label="Required Corpus"
                      value={formatCurrency(
                        result.required_corpus_at_retirement,
                        true
                      )}
                    />

                    <InfoRow
                      label="Retirement Period"
                      value={`${Math.max(
                        0,
                        lifeExpectancy - retirementAge
                      )} years`}
                    />

                    <InfoRow
                      label="Years Remaining"
                      value={`${result.years_to_retirement} years`}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  currency = false,
  suffix = '',
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  currency?: boolean
  suffix?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-950 dark:text-white">
          {label}
        </label>

        <span className="text-xs text-ink-500 dark:text-paper-200/50">
          {currency ? formatCurrency(value, true) : `${value}${suffix}`}
        </span>
      </div>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = Number(e.target.value)
          if (!Number.isNaN(next)) {
            onChange(next)
          }
        }}
        className="w-full rounded-md border border-ink-950/10 dark:border-white/10 bg-transparent p-2.5"
      />
    </div>
  )
}

function ResultCard({
  title,
  value,
  icon,
  positive = true,
}: {
  title: string
  value: string
  icon: React.ReactNode
  positive?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-ink-500 dark:text-paper-200/50">
          {icon}
          <p className="text-xs uppercase">{title}</p>
        </div>

        <p
          className={`mt-2 text-2xl font-semibold ${
            positive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600'
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex justify-between border-b border-ink-950/5 dark:border-white/5 pb-2">
      <span className="text-ink-500 dark:text-paper-200/50">
        {label}
      </span>

      <span className="font-medium text-ink-950 dark:text-white">
        {value}
      </span>
    </div>
  )
}
