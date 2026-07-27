import { generatePrediction } from '@/data/predictionEngine'
import { getFundById } from '@/data/mockFunds'
import type { PredictionHorizon, PredictionResult } from '@/types/fund'
import type { ApiPredictionListResponse } from '@/types/api'
import { apiClient, isBackendConfigured } from '@/api/client'
import { adaptApiPrediction } from '@/services/predictionAdapter'
import { fetchFundById } from '@/services/fundService'

function delay<T>(value: T, ms = 1400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export class PredictionNotAvailableError extends Error {}

async function requestPredictionFromApi(
  fundId: string,
  horizon: PredictionHorizon
): Promise<PredictionResult> {
  const fund = await fetchFundById(fundId)
  const currentNav = fund?.nav ?? 0

  let data: ApiPredictionListResponse
  try {
    const response = await apiClient.get<ApiPredictionListResponse>(`/predictions/${fundId}`)
    data = response.data
  } catch (err) {
    // The backend returns 404 when no predictions have been generated yet
    // for this fund — generation is an admin-triggered/scheduled action
    // (POST /predictions/{fund_id}/generate is admin-only), so a regular
    // user hitting this is an expected, not-exceptional, outcome.
    throw new PredictionNotAvailableError(
      err instanceof Error ? err.message : 'Predictions are not yet available for this fund.'
    )
  }

  const match = data.predictions.find((p) => p.horizon_days === horizon)
  if (!match) {
    throw new PredictionNotAvailableError(`No ${horizon}-day prediction has been generated for this fund yet.`)
  }

  return { ...adaptApiPrediction(match, currentNav), fundId }
}

export async function requestPrediction(
  fundId: string,
  horizon: PredictionHorizon
): Promise<PredictionResult> {
  if (isBackendConfigured) {
    return requestPredictionFromApi(fundId, horizon)
  }

  const fund = getFundById(fundId)
  if (!fund) throw new Error('Fund not found')
  const result = generatePrediction(fund, horizon)
  return delay(result, 1600)
}
