import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { BookingStatusBadge, PaymentBadge } from '@/components/shared/StatusBadge'
import { BookingDetailModal } from './components/BookingDetailModal'
import { CreateBookingModal } from './components/CreateBookingModal'
import { getAllBookings } from '@/api/bookings'
import { getSettings } from '@/api/core'
import { formatDatetime, todayISO, effectiveBookingStatus } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import type { Booking } from '@/types/booking'

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '_all', label: 'Все статусы' },
  { value: 'PENDING', label: 'Ожидает' },
  { value: 'CONFIRMED', label: 'Подтверждено' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'CANCELED', label: 'Отменено' },
]

function parseOpenHour(openTime: string | undefined): number {
  if (!openTime) return 7
  const [h] = openTime.split(':').map(Number)
  return h
}

function parseCloseHour(closeTime: string | undefined, startHour: number): number {
  if (!closeTime) return 23
  const [h] = closeTime.split(':').map(Number)
  return h < startHour ? h + 24 : h
}

export function BookingsListPage() {
  const [date, setDate] = useState(todayISO())
  const [status, setStatus] = useState('_all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Fetch all bookings for the date without status filter — status filtering is done
  // client-side via effectiveBookingStatus so COMPLETED shows past CONFIRMED bookings too.
  const { data: allBookings = [], isLoading } = useQuery({
    queryKey: ['bookings', { date }],
    queryFn: () => getAllBookings({ date: date || undefined }),
  })

  const { data: settings = [] } = useQuery({
    queryKey: ['club-settings'],
    queryFn: getSettings,
  })

  const startHour = parseOpenHour(settings.find((s) => s.key === 'OPEN_TIME')?.value)
  const endHour = parseCloseHour(settings.find((s) => s.key === 'CLOSE_TIME')?.value, startHour)

  const bookings = useMemo(() => {
    if (status === '_all') return allBookings
    return allBookings.filter(
      (b) => effectiveBookingStatus(b.status, b.end_time) === status
    )
  }, [allBookings, status])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Все брони"
        description="Список бронирований с фильтрами"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Новая бронь
          </Button>
        }
      />

      <div className="surface-elevated rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full sm:w-[160px]"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(date || status !== '_all') && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => { setDate(''); setStatus('_all') }}
          >
            Сбросить
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground text-sm">Бронирования не найдены</p>
      ) : (
        <div className="surface-elevated rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Корт</TableHead>
                <TableHead>Время</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Оплата</TableHead>
                <TableHead>Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedBooking(b)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{b.client_name}</p>
                      <p className="text-xs text-muted-foreground">{b.client_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{b.court_name}</TableCell>
                  <TableCell className="text-sm">{formatDatetime(b.start_time)}</TableCell>
                  <TableCell><BookingStatusBadge status={effectiveBookingStatus(b.status, b.end_time)} /></TableCell>
                  <TableCell><PaymentBadge isPaid={b.is_paid} membershipUsed={b.membership_used} price={b.price} /></TableCell>
                  <TableCell className="font-medium">{formatMoney(b.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BookingDetailModal
        booking={selectedBooking}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
      <CreateBookingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        openHour={startHour}
        closeHour={endHour}
      />
    </div>
  )
}
