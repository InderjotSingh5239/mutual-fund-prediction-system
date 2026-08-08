import type { ApiNews } from '@/types/api'
import { apiClient } from '@/api/client'

export interface NewsItem {
  id: string
  title: string
  url: string
  source?: string
  publishedAt: string
  summary?: string
  category?: string
  sentimentLabel?: string
  sentimentScore?: number
  impactScore?: number
}

function adaptNews(item: ApiNews): NewsItem {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    source: item.source ?? undefined,
    publishedAt: item.published_at,
    summary: item.summary ?? undefined,
    category: item.category ?? undefined,
    sentimentLabel: item.sentiment_label ?? undefined,
    sentimentScore: item.sentiment_score ?? undefined,
    impactScore: item.impact_score ?? undefined,
  }
}

export async function fetchNews(params?: {
  page?: number
  pageSize?: number
  category?: string
}) {
  const response = await apiClient.get<{
    items: ApiNews[]
    total?: number
    page?: number
    page_size?: number
  }>('/news', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 20,
      category: params?.category || undefined,
    },
  })

  return {
    items: response.data.items.map(adaptNews),
    total: response.data.total ?? response.data.items.length,
    page: response.data.page ?? params?.page ?? 1,
    pageSize:
      response.data.page_size ??
      params?.pageSize ??
      20,
  }
}

export async function fetchLatestNews(limit = 10) {
  const response = await apiClient.get<{
    items: ApiNews[]
  }>('/news', {
    params: {
      page: 1,
      page_size: limit,
    },
  })

  return response.data.items
    .map(adaptNews)
    .slice(0, limit)
}
