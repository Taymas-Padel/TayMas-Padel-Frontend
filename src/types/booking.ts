export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED'
export type PaymentMethod = 'KASPI' | 'CARD' | 'CASH' | 'BONUS' | 'UNKNOWN'

export interface BookingService {
  service_name: string
  quantity: number
  price_at_moment: string
}

export interface Booking {
  id: number
  start_time: string
  end_time: string
  court_name: string
  client_name: string
  client_phone: string
  status: BookingStatus
  is_paid: boolean
  price: string
  membership_used: number | null
  coach_name: string | null
  participants: string[]
  services: BookingService[]
}

export interface CourtSchedule {
  court_id: number
  court_name: string
  court_type: 'INDOOR' | 'OUTDOOR' | 'PANORAMIC'
  bookings: Booking[]
}

export interface ScheduleResponse {
  date: string
  schedule: CourtSchedule[]
}

export interface CreateBookingData {
  client_id: number
  court: number
  start_time: string
  duration: 30 | 60 | 90 | 120
  coach?: number | null
  coach_expected_participants?: number
  payment_method?: PaymentMethod
  promo_code?: string
  services?: Array<{ service_id: number; quantity: number }>
}
