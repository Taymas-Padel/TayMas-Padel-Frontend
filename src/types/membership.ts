export type MembershipServiceType = 'PADEL_HOURS' | 'GYM' | 'TRAINING_HOURS' | 'VIP'

export interface MembershipType {
  id: number
  name: string
  description: string | null
  service_type: MembershipServiceType
  service_type_display: string
  total_hours: string | null
  total_visits: number
  days_valid: number
  price: string
  priority_time_start: string | null
  priority_time_end: string | null
  prime_time_surcharge: string
  min_participants: number
  max_participants: number
  includes_coach: boolean
  court_type_restriction: string
  discount_on_court: number
  max_quantity: number | null
  issued_count: number
  remaining_quantity: number | null
  is_active: boolean
}

export interface Membership {
  id: number
  user: number
  user_name: string
  membership_type: number
  membership_type_name: string
  service_type: MembershipServiceType
  service_type_display: string
  start_date: string
  end_date: string
  hours_remaining: string | null
  visits_remaining: number | null
  is_active: boolean
  is_frozen: boolean
  priority_time_start: string | null
  priority_time_end: string | null
  prime_time_surcharge: string
  includes_coach: boolean
  min_participants: number
  max_participants: number
}

export interface IssueMembershipData {
  client_id: number
  membership_type_id: number
  payment_method: 'KASPI' | 'CARD' | 'CASH'
}
