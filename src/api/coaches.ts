import { apiClient } from './client'
import type { Coach } from '@/types/court'

export async function getCoaches(): Promise<Coach[]> {
  const { data } = await apiClient.get<Coach[]>('/auth/coaches/')
  return data
}
