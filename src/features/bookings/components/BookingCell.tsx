import { cn } from '@/utils/cn'
import { effectiveBookingStatus } from '@/utils/date'
import type { Booking } from '@/types/booking'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
  CONFIRMED: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
  CANCELED: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200',
  COMPLETED: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200',
}

interface BookingCellProps {
  booking: Booking
  rowSpan: number
  onClick: () => void
  dimmed?: boolean
}

export function BookingCell({ booking, rowSpan, onClick, dimmed }: BookingCellProps) {
  const displayStatus = effectiveBookingStatus(booking.status, booking.end_time)
  const colors = STATUS_COLORS[displayStatus] ?? 'bg-gray-100 border-gray-300 text-gray-800'

  return (
    <div
      className={cn(
        'absolute inset-0.5 rounded border cursor-pointer transition-all p-1 overflow-hidden',
        colors,
        dimmed && 'opacity-25 hover:opacity-40'
      )}
      style={{ height: `${rowSpan * 32 - 4}px` }}
      onClick={onClick}
    >
      <p className="text-xs font-semibold leading-tight truncate">{booking.client_name}</p>
      <p className="text-xs leading-tight opacity-75 truncate">{booking.client_phone}</p>
      {booking.coach_name && (
        <p className="text-xs leading-tight opacity-60 truncate">{booking.coach_name}</p>
      )}
    </div>
  )
}

interface EmptyCellProps {
  onClick: () => void
}

export function EmptyCell({ onClick }: EmptyCellProps) {
  return (
    <div
      className="absolute inset-0.5 rounded border border-dashed border-transparent hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors"
      onClick={onClick}
    />
  )
}
