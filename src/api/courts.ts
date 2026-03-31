import { apiClient } from './client'
import type { Court } from '@/types/court'

export async function getCourts(): Promise<Court[]> {
  const { data } = await apiClient.get<Court[]>('/courts/')
  return data
}

export async function getCourtsManage(): Promise<Court[]> {
  const { data } = await apiClient.get<Court[]>('/courts/manage/')
  return data
}

export async function createCourt(payload: FormData | Partial<Court>): Promise<Court> {
  const { data } = await apiClient.post<Court>('/courts/manage/', payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return data
}

export async function updateCourt(id: number, payload: FormData | Partial<Court>): Promise<Court> {
  const { data } = await apiClient.patch<Court>(`/courts/manage/${id}/`, payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return data
}

export async function deleteCourt(id: number): Promise<void> {
  await apiClient.delete(`/courts/manage/${id}/`)
}

export async function addCourtGallery(
  courtId: number,
  file: File
): Promise<{ id: number; image: string }> {
  const fd = new FormData()
  fd.append('image', file)
  const { data } = await apiClient.post<{ id: number; image: string }>(
    `/courts/manage/${courtId}/gallery/`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function deleteCourtGallery(courtId: number, galleryId: number): Promise<void> {
  await apiClient.delete(`/courts/manage/${courtId}/gallery/${galleryId}/`)
}
