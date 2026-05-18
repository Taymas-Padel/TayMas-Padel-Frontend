import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Clock, CalendarCheck, DollarSign, Users, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { getReceptionDashboard } from '@/api/analytics'
import { getAllBookings, confirmPayment } from '@/api/bookings'
import { formatMoney } from '@/utils/format'
import { formatTime, todayISO, effectiveBookingStatus } from '@/utils/date'
import { parseApiError } from '@/utils/error'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

/**
 * Reception Dashboard per spec:
 * - Operational timeline at top (live, what's happening now)
 * - Upcoming 2 hours next
 * - Compact KPIs at bottom (not hero cards)
 * - NO "Welcome back" greeting, NO heavy decorations
 */
export function ReceptionDashboard() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['reception-dashboard'],
    queryFn: getReceptionDashboard,
    refetchInterval: 30 * 1000, // 30 sec per spec
    staleTime: 30 * 1000,
  })

  const { data: todayBookings = [] } = useQuery({
    queryKey: ['bookings', { date: todayISO() }],
    queryFn: () => getAllBookings({ date: todayISO() }),
    refetchInterval: 30 * 1000,
    staleTime: 30 * 1000,
  })

  const now = new Date()

  // Active bookings (happening right now)
  const activeBookings = useMemo(() => {
    return todayBookings.filter((b) => {
      const start = new Date(b.start_time)
      const end = new Date(b.end_time)
      const eff = effectiveBookingStatus(b.status, b.end_time)
      return (eff === 'CONFIRMED' || eff === 'PENDING') && start <= now && end > now
    }).map((b) => {
      const start = new Date(b.start_time)
      const end = new Date(b.end_time)
      const total = end.getTime() - start.getTime()
      const elapsed = now.getTime() - start.getTime()
      const progress = Math.min(100, Math.round((elapsed / total) * 100))
      return { ...b, progress }
    })
  }, [todayBookings, now])

  // Upcoming bookings (next 2 hours)
  const upcomingBookings = useMemo(() => {
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    return todayBookings
      .filter((b) => {
        const start = new Date(b.start_time)
        const eff = effectiveBookingStatus(b.status, b.end_time)
        return (eff === 'CONFIRMED' || eff === 'PENDING') && start > now && start <= twoHoursLater
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 6)
  }, [todayBookings, now])

  // Alerts
  const alerts = useMemo(() => {
    const unpaidCount = todayBookings.filter((b) => {
      const eff = effectiveBookingStatus(b.status, b.end_time)
      return (eff === 'CONFIRMED' || eff === 'PENDING') && !b.is_paid && !b.membership_used
    }).length

    const pendingCount = todayBookings.filter((b) => b.status === 'PENDING').length

    return { unpaidCount, pendingCount }
  }, [todayBookings])

  const payMutation = useMutation({
    mutationFn: ({ id, method }: { id: number; method: string }) =>
      confirmPayment(id, method),
    onSuccess: () => {
      toast.success('Оплата подтверждена')
      qc.invalidateQueries({ queryKey: ['reception-dashboard'] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const todayDate = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Сегодня, ${todayDate}`}
        actions={
          <Button onClick={() => navigate(ROUTES.BOOKINGS_SCHEDULE)}>
            + Новая бронь
          </Button>
        }
      />

      {/* Active Now Section */}
      <section className="surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-tm-accent animate-pulse" />
            Идёт сейчас
          </h2>
          <span className="text-caption">{activeBookings.length} активных</span>
        </div>

        {activeBookings.length === 0 ? (
          <p className="text-caption py-4 text-center">Нет активных бронирований</p>
        ) : (
          <div className="space-y-2">
            {activeBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-3 p-3 rounded-md bg-background border border-border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{booking.court_name}</span>
                    <span className="text-caption">
                      {formatTime(booking.start_time)}–{formatTime(booking.end_time)}
                    </span>
                  </div>
                  <p className="text-caption truncate">{booking.client_name}</p>
                </div>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tm-accent transition-all duration-1000"
                    style={{ width: `${booking.progress}%` }}
                  />
                </div>
                <span className="text-caption w-10 text-right">{booking.progress}%</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming 2 Hours */}
      <section className="surface p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">Ближайшие 2 часа</h2>

        {upcomingBookings.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-6 w-6" />}
            title="Нет предстоящих броней"
            description="На ближайшие 2 часа нет запланированных бронирований"
          />
        ) : (
          <div className="space-y-1">
            {upcomingBookings.map((booking) => {
              const isPending = booking.status === 'PENDING'
              const isUnpaid = !booking.is_paid && !booking.membership_used

              return (
                <div
                  key={booking.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md',
                    'hover:bg-foreground/[0.03] transition-colors duration-150 cursor-pointer'
                  )}
                  onClick={() => navigate(ROUTES.BOOKINGS_SCHEDULE)}
                >
                  <span className="text-sm font-medium tabular-nums w-14">
                    {formatTime(booking.start_time)}
                  </span>
                  <span className="text-sm text-muted-foreground w-20 truncate">
                    {booking.court_name}
                  </span>
                  <span className="text-sm flex-1 truncate">{booking.client_name}</span>
                  
                  {isPending && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Ожидает
                    </span>
                  )}
                  {isUnpaid && !isPending && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        payMutation.mutate({ id: booking.id, method: 'CASH' })
                      }}
                      disabled={payMutation.isPending}
                    >
                      Принять оплату
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Alerts Section */}
      {(alerts.unpaidCount > 0 || alerts.pendingCount > 0) && (
        <section className="surface p-4">
          <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            Требует внимания
          </h2>
          <div className="flex gap-4">
            {alerts.unpaidCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Неоплачено:</span>
                <span className="font-medium">{alerts.unpaidCount}</span>
              </div>
            )}
            {alerts.pendingCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Ожидает подтверждения:</span>
                <span className="font-medium">{alerts.pendingCount}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Compact KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          title="Броней сегодня"
          value={data?.bookings_today ?? 0}
          icon={<CalendarCheck className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Выручка"
          value={data ? formatMoney(data.today_revenue) : '—'}
          icon={<DollarSign className="h-4 w-4" />}
          variant="success"
          isLoading={isLoading}
        />
        <KpiCard
          title="Загрузка"
          value={`${activeBookings.length} / ${data?.total_courts ?? '?'}`}
          subtitle="кортов занято"
          icon={<Clock className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Новых клиентов"
          value={data?.new_clients_today ?? 0}
          icon={<Users className="h-4 w-4" />}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
