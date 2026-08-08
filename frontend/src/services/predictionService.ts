import type {
  PredictionHorizon,
  PredictionResult,
} from '@/types/fund'

import type {
  ApiPredictionListResponse,
} from '@/types/api'

import { apiClient } from '@/api/client'
import { adaptApiPrediction } from '@/services/predictionAdapter'
import { fetchFundById } from '@/services/fundService'

export class PredictionNotAvailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PredictionNotAvailableError'
  }
}

async function requestPredictionFromApi(
  fundId: string,
  horizon: PredictionHorizon,
): Promise<PredictionResult> {
  if (!fundId) {
    throw new PredictionNotAvailableError(
      'A valid fund ID is required for prediction.',
    )
  }

  // Load the latest real NAV for the selected fund.
  const fund = await fetchFundById(fundId)

  if (!fund) {
    throw new PredictionNotAvailableError(
      'Fund information could not be loaded.',
    )
  }

  const currentNav = fund.nav

  if (currentNav == null || !Number.isFinite(currentNav)) {
    throw new PredictionNotAvailableError(
      'Current NAV is not available for this fund.',
    )
  }

  let data: ApiPredictionListResponse

  try {
    const response = await apiClient.get<ApiPredictionListResponse>(
      `/predictions/${encodeURIComponent(fundId)}`,
    )

    data = response.data
  } catch (error) {
    if (error instanceof Error) {
      throw new PredictionNotAvailableError(error.message)
    }

    throw new PredictionNotAvailableError(
      'Predictions are not yet available for this fund.',
    )
  }

  if (!data || !Array.isArray(data.predictions)) {
    throw new PredictionNotAvailableError(
      'Invalid prediction response received from the backend.',
    )
  }

  const match = data.predictions.find(
    (prediction) => prediction.horizon_days === horizon,
  )

  if (!match) {
    throw new PredictionNotAvailableError(
      `No ${horizon}-day prediction has been generated for this fund yet.`,
    )
  }

  return {
    ...adaptApiPrediction(match, currentNav),
    fundId,
  }
}

export async function requestPrediction(
  fundId: string,
  horizon: PredictionHorizon,
): Promise<PredictionResult> {
  return requestPredictionFromApi(fundId, horizon)
}
