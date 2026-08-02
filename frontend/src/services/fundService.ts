import { MUTUAL_FUNDS, getFundById } from '@/data/mutualFunds'
import type { MutualFund, FundCategory, AMC, RiskLevel } from '@/types/fund'
import type { ApiMutualFundDetail, ApiMutualFundListResponse } from '@/types/api'
import { apiClient, isBackendConfigured } from '@/api/client'
import { adaptApiFund, adaptApiFundDetail } from '@/services/fundAdapter'

const NETWORK_DELAY = 400
function delay<T>(value: T, ms = NETWORK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface FundFilters {
  search?: string
  category?: FundCategory | 'All'
  amc?: AMC | 'All'
  riskLevel?: RiskLevel | 'All'
  maxExpenseRatio?: number
  sortBy?: 'nav' | 'cagr3y' | 'aum' | 'rating' | 'expenseRatio'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface PaginatedFunds {
  funds: MutualFund[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchFundsFromApi(filters: FundFilters): Promise<PaginatedFunds> {
  const page = filters.page || 1
  const pageSize = filters.pageSize || 9

  const { data } = await apiClient.get<ApiMutualFundListResponse>('/funds', {
    params: { page, page_size: pageSize, search: filters.search || undefined },
  })

  // The real backend only supports search + pagination server-side (see
  // docs/API_INTEGRATION.md). Category/risk/expense-ratio filtering and
  // sorting are applied client-side on the *current page* as a best-effort —
  // this is a known limitation (it doesn't filter/sort across the full
  // result set) rather than a fabricated full-dataset filter.
  let funds = data.items.map(adaptApiFund)

  if (filters.category && filters.category !== 'All') {
    funds = funds.filter((f) => f.category === filters.category)
  }
  if (filters.riskLevel && filters.riskLevel !== 'All') {
    funds = funds.filter((f) => f.riskLevel === filters.riskLevel)
  }
  if (filters.maxExpenseRatio !== undefined) {
    funds = funds.filter((f) => (f.expenseRatio ?? 0) <= filters.maxExpenseRatio!)
  }
  if (filters.sortBy) {
    const sortOrder = filters.sortOrder || 'desc'
    funds = [...funds].sort((a, b) => {
      const diff = (Number(a[filters.sortBy!]) || 0) - (Number(b[filters.sortBy!]) || 0)
      return sortOrder === 'asc' ? diff : -diff
    })
  }

  return { funds, total: data.total, page: data.page, pageSize: data.page_size, totalPages: Math.max(1, Math.ceil(data.total / data.page_size)) }
}

function fetchFundsFromMock(filters: FundFilters): Promise<PaginatedFunds> {
  let results = [...MUTUAL_FUNDS]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    results = results.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.amc ?? '').toLowerCase().includes(q)
    )
  }
  if (filters.category && filters.category !== 'All') {
    results = results.filter((f) => f.category === filters.category)
  }
  if (filters.amc && filters.amc !== 'All') {
    results = results.filter((f) => f.amc === filters.amc)
  }
  if (filters.riskLevel && filters.riskLevel !== 'All') {
    results = results.filter((f) => f.riskLevel === filters.riskLevel)
  }
  if (filters.maxExpenseRatio !== undefined) {
    results = results.filter((f) => (f.expenseRatio ?? 0) <= filters.maxExpenseRatio!)
  }

  const sortBy = filters.sortBy || 'aum'
  const sortOrder = filters.sortOrder || 'desc'
  results.sort((a, b) => {
    const diff = (Number(a[sortBy]) || 0) - (Number(b[sortBy]) || 0)
    return sortOrder === 'asc' ? diff : -diff
  })

  const page = filters.page || 1
  const pageSize = filters.pageSize || 9
  const total = results.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paged = results.slice((page - 1) * pageSize, page * pageSize)

  return delay({ funds: paged, total, page, pageSize, totalPages })
}

export async function fetchFunds(
  filters: FundFilters = {}
): Promise<PaginatedFunds> {

  if (!isBackendConfigured) {
    return fetchFundsFromMock(filters)
  }

  try {
    return await fetchFundsFromApi(filters)
  } catch (error) {
    console.error("Backend Error:", error)

    throw error
  }
}

export async function fetchFundById(
  id: string
): Promise<MutualFund | undefined> {

  if (!isBackendConfigured) {
    return delay(getFundById(id))
  }

  try {
    const { data } = await apiClient.get<ApiMutualFundDetail>(`/funds/${id}`)
    return adaptApiFundDetail(data)
  } catch (error) {
    console.error(error)
    throw error
  }
}

/**
 * Top gainers/losers by day change. Backed by real data (latest_nav /
 * nav_change_percent from GET /funds) when a backend is configured — this
 * fetches a larger page and sorts client-side since the backend doesn't
 * expose a dedicated "top movers" endpoint.
 */
export async function fetchTopGainers(limit = 5): Promise<MutualFund[]> {
  if (isBackendConfigured) {
    const { funds } = await fetchFundsFromApi({ pageSize: 100 })
    return [...funds].sort((a, b) => (b.navChangePercent ?? 0) - (a.navChangePercent ?? 0)).slice(0, limit)
  }
  const sorted = [...MUTUAL_FUNDS].sort((a, b) => (b.navChangePercent ?? 0) - (a.navChangePercent ?? 0))
  return delay(sorted.slice(0, limit))
}

export async function fetchTopLosers(limit = 5): Promise<MutualFund[]> {
  if (isBackendConfigured) {
    const { funds } = await fetchFundsFromApi({ pageSize: 100 })
    return [...funds].sort((a, b) => (a.navChangePercent ?? 0) - (b.navChangePercent ?? 0)).slice(0, limit)
  }
  const sorted = [...MUTUAL_FUNDS].sort((a, b) => (a.navChangePercent ?? 0) - (b.navChangePercent ?? 0))
  return delay(sorted.slice(0, limit))
}

/**
 * "Trending" ideally ranks by 3Y CAGR, which the backend doesn't compute
 * (no aggregate returns table). In real mode this falls back to the same
 * day-change ranking as top gainers — a documented approximation, not a
 * fabricated CAGR figure.
 */
export async function fetchTrendingFunds(limit = 6): Promise<MutualFund[]> {
  if (isBackendConfigured) {
    return fetchTopGainers(limit)
  }
  const sorted = [...MUTUAL_FUNDS].sort((a, b) => (b.cagr3y ?? 0) - (a.cagr3y ?? 0))
  return delay(sorted.slice(0, limit))
}
