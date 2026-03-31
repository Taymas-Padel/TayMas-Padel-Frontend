import { apiClient } from './client'

export interface ClubSetting {
  key: string
  value: string
  description: string
}

export interface ClosedDay {
  id: number
  date: string
  reason: string
}

export async function getSettings(): Promise<ClubSetting[]> {
  const { data } = await apiClient.get<ClubSetting[]>('/core/settings/')
  return data
}

export async function updateSetting(key: string, value: string): Promise<ClubSetting> {
  const { data } = await apiClient.patch<ClubSetting>(`/core/settings/${key}/`, { value })
  return data
}

export async function getClosedDays(): Promise<ClosedDay[]> {
  const { data } = await apiClient.get<ClosedDay[]>('/core/closed-days/')
  return data
}

/** Требуется на бэкенде: разрешить метод POST на /core/closed-days/ (create). */
export async function createClosedDay(payload: { date: string; reason: string }): Promise<ClosedDay> {
  const { data } = await apiClient.post<ClosedDay>('/core/closed-days/', payload)
  return data
}

export async function deleteClosedDay(id: number): Promise<void> {
  await apiClient.delete(`/core/closed-days/${id}/`)
}
