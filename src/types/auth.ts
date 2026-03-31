export type Role = 'ADMIN' | 'RECEPTIONIST' | 'SALES_MANAGER'

export interface LoginResponse {
  refresh: string
  access: string
  user_id: number
  role: Role
  first_name: string
  last_name: string
}

export interface TokenRefreshResponse {
  access: string
  refresh: string
}

export interface AuthUser {
  userId: number
  role: Role
  firstName: string
  lastName: string
}
