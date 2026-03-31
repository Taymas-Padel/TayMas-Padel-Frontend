import { apiClient } from './client'
import type { MarketingPromo } from '@/types/court'

export async function getPromos(): Promise<MarketingPromo[]> {
  const { data } = await apiClient.get<MarketingPromo[]>('/marketing/manage/')
  return data
}

export async function createPromo(payload: Omit<MarketingPromo, 'id'>): Promise<MarketingPromo> {
  const { data } = await apiClient.post<MarketingPromo>('/marketing/manage/', payload)
  return data
}

export async function updatePromo(id: number, payload: Partial<MarketingPromo>): Promise<MarketingPromo> {
  const { data } = await apiClient.patch<MarketingPromo>(`/marketing/manage/${id}/`, payload)
  return data
}

export async function deletePromo(id: number): Promise<void> {
  await apiClient.delete(`/marketing/manage/${id}/`)
}
