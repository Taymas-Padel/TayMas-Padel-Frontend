import { apiClient } from './client'
import type { Membership, MembershipType, IssueMembershipData } from '@/types/membership'

export async function getMembershipTypes(): Promise<MembershipType[]> {
  const { data } = await apiClient.get<MembershipType[]>('/memberships/types/')
  return data
}

export async function getMembershipTypesManage(): Promise<MembershipType[]> {
  const { data } = await apiClient.get<MembershipType[]>('/memberships/types/manage/')
  return data
}

export async function createMembershipType(
  payload: Omit<MembershipType, 'id'>
): Promise<MembershipType> {
  const { data } = await apiClient.post<MembershipType>('/memberships/types/manage/', payload)
  return data
}

export async function updateMembershipType(
  id: number,
  payload: Partial<MembershipType>
): Promise<MembershipType> {
  const { data } = await apiClient.patch<MembershipType>(`/memberships/types/manage/${id}/`, payload)
  return data
}

export async function deleteMembershipType(id: number): Promise<void> {
  await apiClient.delete(`/memberships/types/manage/${id}/`)
}

export async function getAllMemberships(params?: {
  client_id?: number
  is_active?: boolean
}): Promise<Membership[]> {
  const { data } = await apiClient.get<Membership[]>('/memberships/all/', { params })
  return data
}

export async function issueMembership(payload: IssueMembershipData): Promise<{
  status: string
  membership: Membership
}> {
  const { data } = await apiClient.post('/memberships/reception/buy/', payload)
  return data
}
