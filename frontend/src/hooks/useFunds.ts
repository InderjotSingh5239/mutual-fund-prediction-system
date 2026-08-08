import { useQuery } from '@tanstack/react-query'
import {
  fetchFunds,
  fetchTopGainers,
  fetchTopLosers,
  fetchTrendingFunds,
  type FundFilters,
} from '@/services/fundService'

export function useFunds(
  filters: FundFilters = {},
) {
  return useQuery({
    queryKey: ['funds', filters],
    queryFn: () => fetchFunds(filters),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useTopGainers(limit = 5) {
  return useQuery({
    queryKey: ['funds', 'top-gainers', limit],
    queryFn: () => fetchTopGainers(limit),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useTopLosers(limit = 5) {
  return useQuery({
    queryKey: ['funds', 'top-losers', limit],
    queryFn: () => fetchTopLosers(limit),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useTrendingFunds(limit = 6) {
  return useQuery({
    queryKey: ['funds', 'trending', limit],
    queryFn: () => fetchTrendingFunds(limit),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
