import { cn } from '@/utils/cn'
import { effectiveBookingStatus } from '@/utils/date'
import type { Booking } from '@/types/booking'

const STATUS_COLORS: Record<string, string> = {
  PENDING:
    'bg-amber-100 border-amber-300 border-l-amber-600 text-amber-950 hover:bg-amber-200/90',
  CONFIRMED:
    'bg-emerald-100 border-emerald-300 border-l-emerald-600 text-emerald-950 hover:bg-emerald-200/90',
  CANCELED:
    'bg-rose-100 border-rose-300 border-l-rose-600 text-rose-950 hover:bg-rose-200/90',
  COMPLETED:
    'bg-sky-100 border-sky-300 border-l-sky-600 text-sky-950 hover:bg-sky-200/90',
}

const STATUS_SHORT_LABEL: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтв.',
  CANCELED: 'Отмена',
  COMPLETED: 'Заверш.',
}

interface BookingCellProps {
  booking: Booking
  rowSpan: number
  onClick: () => void
  dimmed?: boolean
}

export function BookingCell({ booking, rowSpan, onClick, dimmed }: BookingCellProps) {
  const displayStatus = effectiveBookingStatus(booking.status, booking.end_time)
  const colors = STATUS_COLORS[displayStatus] ?? 'bg-muted border-border text-foreground'

  return (
    <div
      className={cn(
        'absolute inset-0.5 rounded border-l-4 cursor-pointer transition-all p-1 overflow-hidden shadow-[0_3px_10px_rgba(0,0,0,0.10)]',
        colors,
        dimmed && 'opacity-45 hover:opacity-70'
      )}
      style={{ height: `${rowSpan * 32 - 4}px` }}
      onClick={onClick}
    >
      {rowSpan >= 2 && (
        <span className="mb-0.5 inline-block rounded-sm bg-black/10 px-1 py-[1px] text-[9px] font-semibold uppercase tracking-[0.08em]">
          {STATUS_SHORT_LABEL[displayStatus] ?? displayStatus}
        </span>
      )}
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
      className="absolute inset-0.5 rounded border border-dashed border-border/30 hover:border-primary/40 hover:bg-primary/7 cursor-pointer transition-colors"
      onClick={onClick}
    />
  )
}
