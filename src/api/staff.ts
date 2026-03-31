import { apiClient } from './client'
import type { StaffMember, StaffRole } from '@/types/staff'

export async function getStaff(params?: {
  search?: string
  role?: StaffRole
  is_active?: boolean
}): Promise<StaffMember[]> {
  const { data } = await apiClient.get<StaffMember[]>('/auth/staff/', { params })
  return data
}

export async function getStaffMember(id: number): Promise<StaffMember> {
  const { data } = await apiClient.get<StaffMember>(`/auth/staff/${id}/`)
  return data
}

export interface CreateStaffPayload {
  username: string
  first_name: string
  last_name: string
  phone_number: string
  email?: string
  role: StaffRole
  price_per_hour?: number
  coach_price_1_2?: number | null
  coach_price_3_4?: number | null
  password: string
  password_confirm: string
}

export async function createStaff(payload: CreateStaffPayload): Promise<StaffMember> {
  const { data } = await apiClient.post<StaffMember>('/auth/staff/', payload)
  return data
}

export async function updateStaff(id: number, payload: Partial<Omit<StaffMember, 'id'>>): Promise<StaffMember> {
  const { data } = await apiClient.patch<StaffMember>(`/auth/staff/${id}/`, payload)
  return data
}

export async function setStaffPassword(
  id: number,
  payload: { new_password: string; new_password_confirm: string }
): Promise<{ detail: string }> {
  const { data } = await apiClient.post(`/auth/staff/${id}/set-password/`, payload)
  return data
}

export async function activateStaff(id: number): Promise<{ detail: string; is_active: boolean }> {
  const { data } = await apiClient.post(`/auth/staff/${id}/activate/`)
  return data
}

export async function deactivateStaff(id: number): Promise<{ detail: string; is_active: boolean }> {
  const { data } = await apiClient.post(`/auth/staff/${id}/deactivate/`)
  return data
}

export async function deleteStaff(id: number): Promise<void> {
  await apiClient.delete(`/auth/staff/${id}/`)
}
