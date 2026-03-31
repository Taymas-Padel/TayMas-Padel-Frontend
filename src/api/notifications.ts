import { apiClient } from './client'
import type { Notification } from '@/types/notification'

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get<Notification[]>('/notifications/')
  return data
}

export async function getUnreadCount(): Promise<{ unread_count: number }> {
  const { data } = await apiClient.get<{ unread_count: number }>('/notifications/unread-count/')
  return data
}

export async function markRead(id: number): Promise<void> {
  await apiClient.post(`/notifications/${id}/mark-read/`)
}

export async function markAllRead(): Promise<void> {
  await apiClient.post('/notifications/mark-all-read/')
}

export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`/notifications/${id}/`)
}
