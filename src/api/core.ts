import { apiClient } from './client'
import { AxiosError } from 'axios'

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
  const candidates: Array<{ method: 'delete' | 'post'; url: string }> = [
    { method: 'delete', url: `/core/closed-days/${id}/` },
    { method: 'delete', url: `/core/closed-days/${id}` },
    { method: 'post', url: `/core/closed-days/${id}/delete/` },
    { method: 'post', url: `/core/closed-days/${id}/delete` },
    { method: 'post', url: `/core/closed-days/${id}/remove/` },
    { method: 'post', url: `/core/closed-days/${id}/remove` },
  ]

  let lastError: unknown = null
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    try {
      if (candidate.method === 'delete') {
        await apiClient.delete(candidate.url)
      } else {
        await apiClient.post(candidate.url)
      }
      return
    } catch (err) {
      lastError = err
      const status = err instanceof AxiosError ? err.response?.status : undefined
      // Пробуем следующий вариант только если route/method не найден.
      if (status !== 404 && status !== 405) {
        throw err
      }
      // Иначе продолжаем fallback-цепочку.
      if (i === candidates.length - 1) {
        throw err
      }
    }
  }

  throw lastError
}
