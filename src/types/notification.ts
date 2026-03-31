export type NotificationType = 'BOOKING' | 'MEMBERSHIP' | 'FRIEND' | 'MATCH' | 'LOBBY' | 'PROMO' | 'NEWS' | 'PAYMENT' | 'SYSTEM'

export interface Notification {
  id: number
  notification_type: NotificationType
  title: string
  body: string
  is_read: boolean
  data: Record<string, unknown> | null
  created_at: string
}
