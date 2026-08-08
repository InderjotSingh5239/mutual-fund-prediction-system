import type {
  MutualFund,
  FundCategory,
  AMC,
  RiskLevel,
} from '@/types/fund'

import type {
  ApiMutualFund,
  ApiMutualFundDetail,
} from '@/types/api'

import { apiClient } from '@/api/client'
import {
  adaptApiFund,
  adaptApiFundDetail,
} from '@/services/fundAdapter'

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

interface ApiFundListResponse {
  items: ApiMutualFund[]
  total: number
  page: number
  page_size: number
}

/**
 * Fetch real mutual-fund data from FastAPI.
 *
 * No mock-data fallback is used here.
 */
export async function fetchFunds(
  filters: FundFilters = {},
): Promise<PaginatedFunds> {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20

  const response =
    await apiClient.get<ApiFundListResponse>(
      '/funds',
      {
        params: {
          page,
          page_size: pageSize,
          search:
            filters.search?.trim() || undefined,
          category:
            filters.category &&
            filters.category !== 'All'
              ? filters.category
              : undefined,
          amc:
            filters.amc &&
            filters.amc !== 'All'
              ? filters.amc
              : undefined,
          risk_level:
            filters.riskLevel &&
            filters.riskLevel !== 'All'
              ? filters.riskLevel
              : undefined,
          max_expense_ratio:
            filters.maxExpenseRatio,
        },
      },
    )

  const data = response.data

  let funds = data.items.map(
    (fund) => adaptApiFund(fund),
  )

  /*
   * These filters are retained client-side as a safety
   * layer in case the deployed backend does not support
   * every optional query parameter yet.
   */

  if (
    filters.category &&
    filters.category !== 'All'
  ) {
    funds = funds.filter(
      (fund) =>
        fund.category === filters.category,
    )
  }

  if (
    filters.amc &&
    filters.amc !== 'All'
  ) {
    funds = funds.filter(
      (fund) => fund.amc === filters.amc,
    )
  }

  if (
    filters.riskLevel &&
    filters.riskLevel !== 'All'
  ) {
    funds = funds.filter(
      (fund) =>
        fund.riskLevel === filters.riskLevel,
    )
  }

  if (
    filters.maxExpenseRatio !== undefined
  ) {
    funds = funds.filter(
      (fund) =>
        (fund.expenseRatio ?? 0) <=
        filters.maxExpenseRatio!,
    )
  }

  if (filters.sortBy) {
    const sortOrder =
      filters.sortOrder ?? 'desc'

    funds = [...funds].sort((a, b) => {
      const aValue = Number(
        a[filters.sortBy!],
      ) || 0

      const bValue = Number(
        b[filters.sortBy!],
      ) || 0

      const difference =
        aValue - bValue

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
      Math.ceil(
        data.total / data.page_size,
      ),
    ),
  }
}

/**
 * Fetch one fund with its complete real
 * backend detail response.
 */
export async function fetchFundById(
  id: string,
): Promise<MutualFund | undefined> {
  if (!id) {
    return undefined
  }

  const response =
    await apiClient.get<ApiMutualFundDetail>(
      `/funds/${encodeURIComponent(id)}`,
    )

  return adaptApiFundDetail(
    response.data,
  )
}

/**
 * Fetch top gaining funds using real API data.
 */
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

/**
 * Fetch top losing funds using real API data.
 */
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

/**
 * Fetch trending funds from the real backend.
 *
 * If the dedicated trending endpoint is unavailable,
 * use the real /funds response and rank by CAGR.
 * No dummy data is introduced.
 */
export async function fetchTrendingFunds(
  limit = 6,
): Promise<MutualFund[]> {
  try {
    const response =
      await apiClient.get<{
        items: ApiMutualFund[]
      }>(
        '/funds/trending',
        {
          params: { limit },
        },
      )

    return response.data.items
      .map((fund) =>
        adaptApiFund(fund),
      )
      .slice(0, limit)
  } catch (error) {
    console.warn(
      'Trending endpoint unavailable. Using real /funds data.',
      error,
    )

    const { funds } =
      await fetchFunds({
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
