import { apiClient } from './client'
import type { Booking, ScheduleResponse, CreateBookingData } from '@/types/booking'

export async function getSchedule(date: string): Promise<ScheduleResponse> {
  const { data } = await apiClient.get<ScheduleResponse>('/bookings/manager/schedule/', {
    params: { date },
  })
  return data
}

export async function getAllBookings(params?: {
  date?: string
  status?: string
  court_id?: number
  client_id?: number
}): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/bookings/all/', { params })
  return data
}

export async function createBooking(payload: CreateBookingData): Promise<Booking> {
  const { data } = await apiClient.post<Booking>('/bookings/reception/create/', payload)
  return data
}

export async function confirmPayment(
  bookingId: number,
  paymentMethod: string
): Promise<{ status: string; booking_id: number; is_paid: boolean; payment_method: string }> {
  const { data } = await apiClient.post(`/bookings/${bookingId}/confirm-payment/`, {
    payment_method: paymentMethod,
  })
  return data
}

export async function cancelBooking(bookingId: number): Promise<{ status: string; hours_returned: number }> {
  const { data } = await apiClient.post<{ status: string; hours_returned: number }>(`/bookings/${bookingId}/cancel/`)
  return data
}
