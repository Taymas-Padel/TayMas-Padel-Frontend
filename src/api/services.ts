import { apiClient } from './client'
import type { Service, ServiceGroup, ServiceCategory } from '@/types/court'

export async function getServices(params?: { group?: ServiceGroup; category?: ServiceCategory }): Promise<Service[]> {
  const { data } = await apiClient.get<Service[]>('/inventory/services/', { params })
  return data
}

export async function getServicesManage(): Promise<Service[]> {
  const { data } = await apiClient.get<Service[]>('/inventory/services/manage/')
  return data
}

export async function createService(payload: FormData | Omit<Service, 'id'>): Promise<Service> {
  const { data } = await apiClient.post<Service>('/inventory/services/manage/', payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return data
}

export async function updateService(id: number, payload: FormData | Partial<Service>): Promise<Service> {
  const { data } = await apiClient.patch<Service>(`/inventory/services/manage/${id}/`, payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return data
}

export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`/inventory/services/manage/${id}/`)
}
