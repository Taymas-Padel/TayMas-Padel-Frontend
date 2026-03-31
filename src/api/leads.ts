import { apiClient } from './client'
import type { Lead, KanbanColumn, LeadStats, CreateLeadData, LeadComment, LeadTask } from '@/types/lead'
import type { LeadStage } from '@/types/lead'

export async function getKanban(params?: {
  assigned_to?: string
  search?: string
}): Promise<KanbanColumn[]> {
  const { data } = await apiClient.get<KanbanColumn[]>('/leads/kanban/', { params })
  return data
}

export async function getLeads(params?: {
  stage?: LeadStage
  assigned_to?: string
  search?: string
}): Promise<Lead[]> {
  const { data } = await apiClient.get<Lead[]>('/leads/', { params })
  return data
}

export async function getLeadDetail(id: number): Promise<Lead> {
  const { data } = await apiClient.get<Lead>(`/leads/${id}/`)
  return data
}

export async function createLead(payload: CreateLeadData): Promise<Lead> {
  const { data } = await apiClient.post<Lead>('/leads/', payload)
  return data
}

export async function updateLead(id: number, payload: Partial<CreateLeadData>): Promise<Lead> {
  const { data } = await apiClient.patch<Lead>(`/leads/${id}/`, payload)
  return data
}

export async function deleteLead(id: number): Promise<void> {
  await apiClient.delete(`/leads/${id}/`)
}

export async function moveLead(
  id: number,
  stage: LeadStage
): Promise<{ status: string; id: number; stage: LeadStage; stage_label: string; last_contact: string }> {
  const { data } = await apiClient.post(`/leads/${id}/move/`, { stage })
  return data
}

export async function getLeadComments(id: number): Promise<LeadComment[]> {
  const { data } = await apiClient.get<LeadComment[]>(`/leads/${id}/comments/`)
  return data
}

export async function addLeadComment(id: number, text: string): Promise<LeadComment> {
  const { data } = await apiClient.post<LeadComment>(`/leads/${id}/comments/`, { text })
  return data
}

export async function deleteLeadComment(leadId: number, commentId: number): Promise<void> {
  await apiClient.delete(`/leads/${leadId}/comments/${commentId}/`)
}

export async function getLeadTasks(id: number): Promise<LeadTask[]> {
  const { data } = await apiClient.get<LeadTask[]>(`/leads/${id}/tasks/`)
  return data
}

export async function addLeadTask(
  id: number,
  payload: { title: string; due_datetime: string; assigned_to?: number | null }
): Promise<LeadTask> {
  const { data } = await apiClient.post<LeadTask>(`/leads/${id}/tasks/`, payload)
  return data
}

export async function updateLeadTask(
  leadId: number,
  taskId: number,
  payload: { is_done?: boolean; title?: string }
): Promise<LeadTask> {
  const { data } = await apiClient.patch<LeadTask>(`/leads/${leadId}/tasks/${taskId}/`, payload)
  return data
}

export async function deleteLeadTask(leadId: number, taskId: number): Promise<void> {
  await apiClient.delete(`/leads/${leadId}/tasks/${taskId}/`)
}

export async function getLeadStats(): Promise<LeadStats> {
  const { data } = await apiClient.get<LeadStats>('/leads/stats/')
  return data
}
