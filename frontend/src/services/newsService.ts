import { MOCK_NEWS, type NewsItem } from '@/data/mockNews'
import type { ApiNews } from '@/types/api'
import { apiClient, isBackendConfigured } from '@/api/client'
import { adaptApiNews } from '@/services/newsAdapter'

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function fetchNews(category?: NewsItem['category'] | 'All'): Promise<NewsItem[]> {
  if (isBackendConfigured) {
    const { data } = await apiClient.get<ApiNews[]>('/news', { params: { limit: 50 } })
    const items = data.map(adaptApiNews)
    return !category || category === 'All' ? items : items.filter((n) => n.category === category)
  }

  const items =
    !category || category === 'All' ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.category === category)
  return delay(items)
}
