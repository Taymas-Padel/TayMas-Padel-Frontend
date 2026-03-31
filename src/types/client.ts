export type ClientRole = 'CLIENT' | 'COACH_PADEL' | 'COACH_FITNESS' | 'ADMIN' | 'RECEPTIONIST' | 'SALES_MANAGER'

export interface ClientUser {
  id: number
  username: string
  phone_number: string
  first_name: string
  last_name: string
  avatar: string | null
  is_qr_blocked: boolean
  last_device_id: string | null
  role: ClientRole
  rating_elo: number
  is_profile_complete: boolean
  /** false = аккаунт деактивирован, показываем кнопку «Активировать» */
  is_active?: boolean
  created_at: string
}

export interface UserActionResponse {
  status: string
  message: string
  is_qr_blocked?: boolean
  user?: {
    id: number
    first_name: string
    last_name: string
  }
}
