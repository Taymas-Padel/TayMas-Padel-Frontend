export type StaffRole = 'ADMIN' | 'RECEPTIONIST' | 'SALES_MANAGER' | 'COACH_PADEL' | 'COACH_FITNESS'

export interface StaffMember {
  id: number
  username: string
  first_name: string
  last_name: string
  full_name: string
  phone_number: string
  email: string | null
  role: StaffRole
  role_display: string
  price_per_hour: string
  coach_price_1_2: number | null
  coach_price_3_4: number | null
  is_active: boolean
  avatar: string | null
  created_at: string
  updated_at: string
}
