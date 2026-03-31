import { apiClient } from './client'
import type { ClientUser, UserActionResponse } from '@/types/client'

export async function getClients(params?: {
  search?: string
  role?: string
}): Promise<ClientUser[]> {
  const { data } = await apiClient.get<ClientUser[]>('/auth/clients/', { params })
  return data
}

export async function searchByPhone(phone: string): Promise<ClientUser[]> {
  const { data } = await apiClient.get<ClientUser[]>('/auth/reception/search/', {
    params: { phone },
  })
  return data
}

export async function searchClients(query: string): Promise<ClientUser[]> {
  // Try both phone search and general name/search in parallel, deduplicate by id
  const [phoneResults, nameResults] = await Promise.allSettled([
    apiClient.get<ClientUser[]>('/auth/reception/search/', { params: { phone: query } }),
    apiClient.get<ClientUser[]>('/auth/clients/', { params: { search: query, role: 'CLIENT' } }),
  ])

  const seen = new Set<number>()
  const results: ClientUser[] = []

  for (const r of [phoneResults, nameResults]) {
    if (r.status === 'fulfilled') {
      for (const c of r.value.data) {
        if (!seen.has(c.id)) {
          seen.add(c.id)
          results.push(c)
        }
      }
    }
  }

  return results
}

export async function getClientDetail(id: number): Promise<ClientUser> {
  const { data } = await apiClient.get<ClientUser>(`/auth/reception/user/${id}/`)
  return data
}

export async function userAction(
  id: number,
  action: string,
  extra?: Record<string, string>
): Promise<UserActionResponse> {
  const { data } = await apiClient.post<UserActionResponse>(
    `/auth/reception/user/${id}/action/`,
    { action, ...extra }
  )
  return data
}
