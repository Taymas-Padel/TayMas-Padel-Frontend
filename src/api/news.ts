import { apiClient } from './client'
import type { NewsItem } from '@/types/court'

export async function getNews(): Promise<NewsItem[]> {
  const { data } = await apiClient.get<NewsItem[]>('/news/manage/')
  return data
}

export async function createNews(payload: Partial<NewsItem>): Promise<NewsItem> {
  const { data } = await apiClient.post<NewsItem>('/news/manage/', payload)
  return data
}

export async function updateNews(id: number, payload: Partial<NewsItem>): Promise<NewsItem> {
  const { data } = await apiClient.patch<NewsItem>(`/news/manage/${id}/`, payload)
  return data
}

export async function deleteNews(id: number): Promise<void> {
  await apiClient.delete(`/news/manage/${id}/`)
}
