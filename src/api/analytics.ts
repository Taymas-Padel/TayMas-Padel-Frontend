import { apiClient } from './client'
import type { ReceptionDashboard, DirectorDashboard } from '@/types/analytics'

export async function getReceptionDashboard(): Promise<ReceptionDashboard> {
  const { data } = await apiClient.get<ReceptionDashboard>('/analytics/reception/')
  return data
}

export async function getDirectorDashboard(): Promise<DirectorDashboard> {
  const { data } = await apiClient.get<DirectorDashboard>('/analytics/dashboard/')
  return data
}
