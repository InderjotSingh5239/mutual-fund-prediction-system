import type { ApiPrediction } from '@/types/api'
import type {
  PredictionHorizon,
  PredictionResult,
  Recommendation,
} from '@/types/fund'

function mapRecommendation(raw: string): Recommendation {
  const normalized = raw.toUpperCase()

  if (normalized === 'BUY' || normalized.includes('BUY')) {
    return 'Buy'
  }

  if (normalized === 'SELL' || normalized.includes('SELL')) {
    return 'Sell'
  }

  return 'Hold'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function adaptApiPrediction(
  api: ApiPrediction,
  currentNav: number,
): PredictionResult {
  const predictedNav = Number(api.predicted_nav)

  const lower =
    api.lower_bound != null
      ? Number(api.lower_bound)
      : predictedNav * 0.95

  const upper =
    api.upper_bound != null
      ? Number(api.upper_bound)
      : predictedNav * 1.05

  const confidenceScore = clamp(
    Number(api.confidence_score),
    0,
    1,
  )

  const riskScore = clamp(
    Number(api.risk_score),
    0,
    100,
  )

  return {
    fundId: '',
    horizon: api.horizon_days as PredictionHorizon,

    currentNav,

    predictedNav,

    expectedReturnPercent: Number(api.expected_return_pct),

    confidenceScore: Math.round(confidenceScore * 100),

    recommendation: mapRecommendation(api.recommendation),

    riskScore: Math.max(
      1,
      Math.min(
        10,
        Math.round(riskScore / 10),
      ),
    ),

    forecastSeries: [
      {
        date: api.prediction_date,
        nav: currentNav,
        lowerBound: currentNav,
        upperBound: currentNav,
      },
      {
        date: api.target_date,
        nav: predictedNav,
        lowerBound: lower,
        upperBound: upper,
      },
    ],

    generatedAt: api.created_at,

    modelVersion: 'production-model',

    featureImportance: [],
  }
}
