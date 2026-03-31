import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/types/booking'

const BOOKING_STATUS: Record<BookingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  PENDING: { label: 'Ожидает', variant: 'warning' },
  CONFIRMED: { label: 'Подтверждено', variant: 'success' },
  CANCELED: { label: 'Отменено', variant: 'destructive' },
  COMPLETED: { label: 'Завершено', variant: 'secondary' },
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = BOOKING_STATUS[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function PaymentBadge({ isPaid, membershipUsed, price }: { isPaid: boolean; membershipUsed?: number | null; price?: string }) {
  const isMembership = membershipUsed != null || (!isPaid && price != null && parseFloat(price) === 0)
  if (isMembership) {
    return <Badge variant="info">По абонементу</Badge>
  }
  return (
    <Badge variant={isPaid ? 'success' : 'warning'}>
      {isPaid ? 'Оплачено' : 'Не оплачено'}
    </Badge>
  )
}

export function QrStatusBadge({ isBlocked }: { isBlocked: boolean }) {
  return (
    <Badge variant={isBlocked ? 'destructive' : 'success'}>
      {isBlocked ? 'Заблокирован' : 'Активен'}
    </Badge>
  )
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'secondary'}>
      {isActive ? 'Активен' : 'Неактивен'}
    </Badge>
  )
}
