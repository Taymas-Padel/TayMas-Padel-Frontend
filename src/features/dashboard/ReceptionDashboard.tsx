import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, Clock, DollarSign, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PaymentBadge } from '@/components/shared/StatusBadge'
import { getReceptionDashboard } from '@/api/analytics'
import { getAllBookings, confirmPayment } from '@/api/bookings'
import { formatMoney } from '@/utils/format'
import { formatDatetime, todayISO, effectiveBookingStatus } from '@/utils/date'
import { parseApiError } from '@/utils/error'

export function ReceptionDashboard() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['reception-dashboard'],
    queryFn: getReceptionDashboard,
    refetchInterval: 2 * 60 * 1000,
  })

  // Fetch today's bookings directly — more reliable than analytics upcoming_bookings
  // since analytics may not reflect auto-completed bookings in real time.
  const { data: todayBookings = [] } = useQuery({
    queryKey: ['bookings', { date: todayISO() }],
    queryFn: () => getAllBookings({ date: todayISO() }),
    refetchInterval: 2 * 60 * 1000,
  })

  // Show confirmed/pending bookings that haven't ended yet
  const upcomingBookings = useMemo(() => {
    const now = new Date()
    return todayBookings
      .filter((b) => {
        const eff = effectiveBookingStatus(b.status, b.end_time)
        return (eff === 'CONFIRMED' || eff === 'PENDING') && new Date(b.end_time) > now
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [todayBookings])

  const payMutation = useMutation({
    mutationFn: ({ id, method }: { id: number; method: string }) =>
      confirmPayment(id, method),
    onSuccess: () => {
      toast.success('Оплата подтверждена')
      qc.invalidateQueries({ queryKey: ['reception-dashboard'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд ресепшн" description={data?.today} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Броней сегодня"
          value={data?.bookings_today ?? 0}
          icon={<CalendarCheck className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Ожидают оплаты"
          value={data?.pending_payments ?? 0}
          icon={<Clock className="h-5 w-5" />}
          variant={data && data.pending_payments > 0 ? 'warning' : 'default'}
          isLoading={isLoading}
        />
        <KpiCard
          title="Выручка сегодня"
          value={data ? formatMoney(data.today_revenue) : '—'}
          icon={<DollarSign className="h-5 w-5" />}
          variant="success"
          isLoading={isLoading}
        />
        <KpiCard
          title="Статус"
          value="Работаем"
          icon={<AlertCircle className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ближайшие бронирования</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {upcomingBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет предстоящих бронирований</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Время</TableHead>
                  <TableHead>Корт</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{formatDatetime(booking.start_time)}</TableCell>
                    <TableCell>{booking.court_name}</TableCell>
                    <TableCell>{booking.client_name}</TableCell>
                    <TableCell>{formatMoney(booking.price)}</TableCell>
                    <TableCell>
                      <PaymentBadge
                        isPaid={booking.is_paid}
                        membershipUsed={booking.membership_used}
                        price={booking.price}
                      />
                    </TableCell>
                    <TableCell>
                      {!booking.is_paid && booking.membership_used == null && !(booking.price != null && parseFloat(booking.price) === 0) && (
                        <Button
                          size="sm"
                          onClick={() => payMutation.mutate({ id: booking.id, method: 'CASH' })}
                          disabled={payMutation.isPending}
                        >
                          Принять оплату
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
