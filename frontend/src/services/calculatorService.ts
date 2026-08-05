import type {
  ApiSipResponse,
  ApiLumpsumResponse,
} from '@/types/api'

export async function calculateSip(data: {
  monthly_investment: number
  duration_years: number
  expected_annual_return_percent: number
  step_up_percent?: number
  inflation_percent?: number
}) {
  const res = await apiClient.post('/calculators/sip', data)
return res.data as ApiSipResponse
}

export async function calculateLumpsum(data: {
  principal: number
  duration_years: number
  expected_annual_return_percent: number
  inflation_percent?: number
}) {
  const res = await apiClient.post('/calculators/lumpsum', data)
  return res.data as ApiLumpsumResponse
}
