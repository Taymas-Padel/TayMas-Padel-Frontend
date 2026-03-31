export interface UpcomingBooking {
  id: number
  court: string
  start_time: string
  client: string
  status: string
  is_paid: boolean
  price: number
}

export interface ReceptionDashboard {
  today: string
  bookings_today: number
  pending_payments: number
  today_revenue: number
  upcoming_bookings: UpcomingBooking[]
}

export interface RevenueStructureItem {
  type: string
  label: string
  amount: number
  count: number
}

export interface DirectorDashboard {
  period: { date: string; month: string }
  kpi: {
    today_revenue: number
    week_revenue: number
    month_revenue: number
    total_revenue: number
    occupancy_rate_today: string
    bookings_today: number
    pending_payments: number
    week_bookings: number
    total_clients: number
    new_clients_this_month: number
  }
  revenue_structure: RevenueStructureItem[]
  work_hours: string
}
