import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: ru })
  } catch {
    return dateStr
  }
}

export function formatDatetime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd.MM.yyyy HH:mm', { locale: ru })
  } catch {
    return dateStr
  }
}

export function formatTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'HH:mm')
  } catch {
    return dateStr
  }
}

export function toISOString(localDatetime: string): string {
  return new Date(localDatetime).toISOString()
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Returns the effective booking status for display.
 *  If the booking's end_time is in the past and status is still PENDING/CONFIRMED
 *  (schedule API doesn't auto-complete), treat it as COMPLETED visually. */
export function effectiveBookingStatus<T extends string>(status: T, endTime: string): T | 'COMPLETED' {
  if ((status === 'CONFIRMED' || status === 'PENDING') && new Date(endTime) < new Date()) {
    return 'COMPLETED'
  }
  return status
}

export function formatMonthYear(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'LLLL yyyy', { locale: ru })
  } catch {
    return dateStr
  }
}
