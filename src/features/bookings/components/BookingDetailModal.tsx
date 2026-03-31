import { useState } from 'react'
import { Clock, User, Dumbbell, CreditCard, Tag, XCircle, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookingStatusBadge, PaymentBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ConfirmPaymentModal } from './ConfirmPaymentModal'
import { cancelBooking } from '@/api/bookings'
import { formatDatetime, effectiveBookingStatus } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { parseApiError } from '@/utils/error'
import type { Booking } from '@/types/booking'

interface BookingDetailModalProps {
  booking: Booking | null
  open: boolean
  onClose: () => void
}

export function BookingDetailModal({ booking, open, onClose }: BookingDetailModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const qc = useQueryClient()

  // membership_used for new bookings; price=0 fallback for old bookings before the field existed
  const isMembershipBooking =
    booking?.membership_used != null ||
    (!booking?.is_paid && booking?.price != null && parseFloat(booking.price) === 0)

  const displayStatus = booking ? effectiveBookingStatus(booking.status, booking.end_time) : null
  const canCancel = displayStatus === 'PENDING' || displayStatus === 'CONFIRMED'

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(booking!.id),
    onSuccess: (result) => {
      if (result.hours_returned > 0) {
        toast.success(`Бронь отменена. На абонемент возвращено ${result.hours_returned} ч.`)
      } else {
        toast.success('Бронь отменена')
      }
      qc.invalidateQueries({ queryKey: ['schedule'] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
      qc.resetQueries({ queryKey: ['memberships'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Бронирование #{booking?.id}</DialogTitle>
          </DialogHeader>

          {booking && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BookingStatusBadge status={displayStatus ?? booking.status} />
                <PaymentBadge isPaid={booking.is_paid} membershipUsed={booking.membership_used} price={booking.price} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{booking.court_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatDatetime(booking.start_time)} — {formatDatetime(booking.end_time).split(' ').pop()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.client_name}</span>
                  <span className="text-muted-foreground">{booking.client_phone}</span>
                </div>
                {booking.coach_name && (
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.coach_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {booking.membership_used != null ? 'По абонементу' : formatMoney(booking.price)}
                  </span>
                </div>
              </div>

              {booking.services.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Услуги</p>
                  <div className="space-y-1">
                    {booking.services.map((s, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{s.service_name} × {s.quantity}</span>
                        <span>{formatMoney(s.price_at_moment)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {booking.participants.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Участники</p>
                  <div className="flex flex-wrap gap-1.5">
                    {booking.participants.map((p, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {!booking.is_paid && !isMembershipBooking && (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                  <Button className="flex-1" onClick={() => setConfirmOpen(true)}>
                    Принять оплату
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setCancelConfirmOpen(true)}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Отменить бронь
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmPaymentModal
        bookingId={booking?.id ?? null}
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Отменить бронирование?"
        description={
          isMembershipBooking
            ? 'Бронь будет отменена. Часы автоматически вернутся на абонемент клиента.'
            : 'Это действие нельзя отменить.'
        }
        confirmLabel="Отменить бронь"
        isDestructive
        onConfirm={() => cancelMutation.mutate()}
      />
    </>
  )
}
