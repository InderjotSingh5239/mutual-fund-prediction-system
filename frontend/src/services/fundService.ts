import type {
  MutualFund,
  FundCategory,
  AMC,
  RiskLevel,
} from '@/types/fund'

import type {
  ApiMutualFund,
  ApiMutualFundDetail,
  ApiMutualFundListResponse,
} from '@/types/api'

import { apiClient } from '@/api/client'
import { adaptApiFund, adaptApiFundDetail } from '@/services/fundAdapter'

// =====================================================
// Filters
// =====================================================

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

// =====================================================
// Paginated Response
// =====================================================

export interface PaginatedFunds {
  funds: MutualFund[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// =====================================================
// Fetch Funds
// =====================================================

export async function fetchFunds(
  filters: FundFilters = {},
): Promise<PaginatedFunds> {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 9

  const response = await apiClient.get<ApiMutualFundListResponse>(
    '/funds',
    {
      params: {
        page,
        page_size: pageSize,
        search: filters.search || undefined,
      },
    },
  )

  const data = response.data

  let funds = data.items.map(
    (fund: ApiMutualFund) => adaptApiFund(fund),
  )

  // ---------------------------------------------------
  // Client-side filtering for fields not supported
  // server-side by the current backend
  // ---------------------------------------------------

  if (filters.category && filters.category !== 'All') {
    funds = funds.filter(
      (fund) => fund.category === filters.category,
    )
  }

  if (filters.amc && filters.amc !== 'All') {
    funds = funds.filter(
      (fund) => fund.amc === filters.amc,
    )
  }

  if (filters.riskLevel && filters.riskLevel !== 'All') {
    funds = funds.filter(
      (fund) => fund.riskLevel === filters.riskLevel,
    )
  }

  if (filters.maxExpenseRatio !== undefined) {
    funds = funds.filter(
      (fund) =>
        (fund.expenseRatio ?? 0) <= filters.maxExpenseRatio!,
    )
  }

  // ---------------------------------------------------
  // Sorting
  // ---------------------------------------------------

  if (filters.sortBy) {
    const sortOrder = filters.sortOrder ?? 'desc'

    funds = [...funds].sort((a, b) => {
      const aValue = Number(a[filters.sortBy!]) || 0
      const bValue = Number(b[filters.sortBy!]) || 0

      const difference = aValue - bValue

      return sortOrder === 'asc'
        ? difference
        : -difference
    })
  }

  return {
    funds,
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
    totalPages: Math.max(
      1,
      Math.ceil(data.total / data.page_size),
    ),
  }
}

// =====================================================
// Fetch Fund By ID
// =====================================================

export async function fetchFundById(
  id: string,
): Promise<MutualFund | undefined> {
  try {
    const response = await apiClient.get<ApiMutualFundDetail>(
      `/funds/${id}`,
    )

    return adaptApiFundDetail(response.data)
  } catch (error) {
    console.error('Failed to fetch fund:', error)
    throw error
  }
}

// =====================================================
// Top Gainers
// =====================================================

export async function fetchTopGainers(
  limit = 5,
): Promise<MutualFund[]> {
  const { funds } = await fetchFunds({
    page: 1,
    pageSize: 100,
  })

  return [...funds]
    .sort(
      (a, b) =>
        (b.navChangePercent ?? 0) -
        (a.navChangePercent ?? 0),
    )
    .slice(0, limit)
}

// =====================================================
// Top Losers
// =====================================================

export async function fetchTopLosers(
  limit = 5,
): Promise<MutualFund[]> {
  const { funds } = await fetchFunds({
    page: 1,
    pageSize: 100,
  })

  return [...funds]
    .sort(
      (a, b) =>
        (a.navChangePercent ?? 0) -
        (b.navChangePercent ?? 0),
    )
    .slice(0, limit)
}

// =====================================================
// Trending Funds
// =====================================================

export async function fetchTrendingFunds(
  limit = 6,
): Promise<MutualFund[]> {
  try {
    const response = await apiClient.get<{
      items: ApiMutualFund[]
    }>('/funds/trending', {
      params: { limit },
    })

    return response.data.items
      .map((fund) => adaptApiFund(fund))
      .slice(0, limit)
  } catch (error) {
    console.error(
      'Trending endpoint unavailable:',
      error,
    )

    // Use real /funds data instead of mock data.
    const { funds } = await fetchFunds({
      page: 1,
      pageSize: 100,
    })

    return [...funds]
      .sort(
        (a, b) =>
          (b.cagr3y ?? 0) -
          (a.cagr3y ?? 0),
      )
      .slice(0, limit)
  }
}
