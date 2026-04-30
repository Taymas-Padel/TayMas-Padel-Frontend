import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarCheck,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle,
  UserPlus,
  CreditCard,
  TicketPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PaymentBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { getReceptionDashboard } from '@/api/analytics'
import { getAllBookings, confirmPayment } from '@/api/bookings'
import { getClosedDays, getSettings } from '@/api/core'
import { formatMoney } from '@/utils/format'
import { formatDatetime, formatTime, todayISO, effectiveBookingStatus } from '@/utils/date'
import { parseApiError } from '@/utils/error'
import { ROUTES } from '@/constants/routes'

type StatusVariant = 'default' | 'success' | 'warning' | 'danger'

export function ReceptionDashboard() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['reception-dashboard'],
    queryFn: getReceptionDashboard,
    refetchInterval: 2 * 60 * 1000,
  })

  const { data: todayBookings = [] } = useQuery({
    queryKey: ['bookings', { date: todayISO() }],
    queryFn: () => getAllBookings({ date: todayISO() }),
    refetchInterval: 2 * 60 * 1000,
  })

  const { data: closedDays = [] } = useQuery({
    queryKey: ['closed-days'],
    queryFn: getClosedDays,
    refetchInterval: 5 * 60 * 1000,
  })

  const { data: settings = [] } = useQuery({
    queryKey: ['club-settings'],
    queryFn: getSettings,
    refetchInterval: 5 * 60 * 1000,
  })

  const upcomingBookings = useMemo(() => {
    const now = new Date()
    return todayBookings
      .filter((b) => {
        const eff = effectiveBookingStatus(b.status, b.end_time)
        return (eff === 'CONFIRMED' || eff === 'PENDING') && new Date(b.end_time) > now
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [todayBookings])

  const now = new Date()

  const bookingsStartingSoon = useMemo(() => {
    return upcomingBookings.filter((b) => {
      const start = new Date(b.start_time).getTime()
      const diffMin = Math.floor((start - now.getTime()) / 60000)
      return diffMin >= 0 && diffMin <= 30
    })
  }, [upcomingBookings, now])

  const pendingConfirmations = useMemo(
    () => upcomingBookings.filter((b) => b.status === 'PENDING'),
    [upcomingBookings]
  )

  const unpaidUpcoming = useMemo(
    () =>
      upcomingBookings.filter(
        (b) => !b.is_paid && b.membership_used == null && !(b.price != null && parseFloat(b.price) === 0)
      ),
    [upcomingBookings]
  )

  const overdueUnpaidCount = useMemo(() => {
    return todayBookings.filter((b) => {
      const isOverdue = new Date(b.end_time) < now
      const unpaid = !b.is_paid && b.membership_used == null && !(b.price != null && parseFloat(b.price) === 0)
      return isOverdue && unpaid
    }).length
  }, [todayBookings, now])

  const noCoachCount = useMemo(() => {
    return todayBookings.filter((b) => {
      const eff = effectiveBookingStatus(b.status, b.end_time)
      return (eff === 'CONFIRMED' || eff === 'PENDING') && !b.coach_name
    }).length
  }, [todayBookings])

  const occupancySummary = useMemo(() => {
    const activeBookings = todayBookings.filter((b) => {
      const start = new Date(b.start_time)
      const end = new Date(b.end_time)
      const eff = effectiveBookingStatus(b.status, b.end_time)
      return (eff === 'CONFIRMED' || eff === 'PENDING') && start <= now && end > now
    })

    const uniqueCourts = Array.from(new Set(todayBookings.map((b) => b.court_name)))
    const totalCourts = uniqueCourts.length
    const busyNow = activeBookings.length
    const freeNow = Math.max(totalCourts - busyNow, 0)

    const hourLoad = todayBookings.reduce<Record<string, number>>((acc, b) => {
      const hour = formatTime(b.start_time).slice(0, 2)
      acc[hour] = (acc[hour] ?? 0) + 1
      return acc
    }, {})
    const peak = Object.entries(hourLoad).sort((a, b) => b[1] - a[1])[0]
    const peakHourLabel = peak ? `${peak[0]}:00` : '—'

    return { totalCourts, busyNow, freeNow, peakHourLabel }
  }, [todayBookings, now])

  const nextBookingInfo = useMemo(() => {
    const next = upcomingBookings[0]
    if (!next) return null
    const diffMin = Math.max(0, Math.floor((new Date(next.start_time).getTime() - now.getTime()) / 60000))
    return {
      text: `Следующая бронь через ${diffMin} мин`,
      details: `${formatTime(next.start_time)} · ${next.court_name} · ${next.client_name}`,
    }
  }, [upcomingBookings, now])

  const clubStatus = useMemo(() => {
    const today = todayISO()
    const closedDay = closedDays.find((d) => d.date === today)
    if (closedDay) {
      return {
        value: 'Выходной',
        subtitle: closedDay.reason,
        variant: 'danger' as StatusVariant,
      }
    }

    const openRaw = settings.find((s) => s.key === 'OPEN_TIME')?.value
    const closeRaw = settings.find((s) => s.key === 'CLOSE_TIME')?.value

    if (!openRaw || !closeRaw) {
      return {
        value: 'Работаем',
        subtitle: 'По стандартному графику',
        variant: 'success' as StatusVariant,
      }
    }

    const [openHour, openMinute = 0] = openRaw.split(':').map(Number)
    const [closeHour, closeMinute = 0] = closeRaw.split(':').map(Number)
    if (
      Number.isNaN(openHour) || Number.isNaN(openMinute) ||
      Number.isNaN(closeHour) || Number.isNaN(closeMinute)
    ) {
      return {
        value: 'Работаем',
        subtitle: `${openRaw} - ${closeRaw}`,
        variant: 'success' as StatusVariant,
      }
    }

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const openMinutes = openHour * 60 + openMinute
    const closeMinutes = closeHour * 60 + closeMinute

    // Поддерживаем график, который уходит за полночь (например 08:00-01:00)
    const isOpenNow = closeMinutes <= openMinutes
      ? nowMinutes >= openMinutes || nowMinutes < closeMinutes
      : nowMinutes >= openMinutes && nowMinutes < closeMinutes

    return {
      value: isOpenNow ? 'Работаем' : 'Закрыты',
      subtitle: `${openRaw} - ${closeRaw}`,
      variant: (isOpenNow ? 'success' : 'warning') as StatusVariant,
    }
  }, [closedDays, settings])

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

  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд ресепшн" description={data?.today} />

      <Card className="surface-elevated rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate(ROUTES.BOOKINGS_SCHEDULE)}>
            <TicketPlus className="h-4 w-4" />
            Новая бронь
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.CLIENTS)}>
            <UserPlus className="h-4 w-4" />
            Новый клиент
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.MEMBERSHIPS_ISSUE)}>
            <CreditCard className="h-4 w-4" />
            Выдать абонемент
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.BOOKINGS)}>
            <CalendarCheck className="h-4 w-4" />
            Все брони
          </Button>
        </CardContent>
      </Card>

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
          value={clubStatus.value}
          subtitle={clubStatus.subtitle}
          icon={<Activity className="h-5 w-5" />}
          variant={clubStatus.variant}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="surface-elevated rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Нужно сейчас</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span>Старт в 30 минут</span>
              <span className="font-semibold">{bookingsStartingSoon.length}</span>
            </div>
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span>Нужно подтвердить</span>
              <span className="font-semibold">{pendingConfirmations.length}</span>
            </div>
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span>Ожидают оплаты</span>
              <span className="font-semibold">{unpaidUpcoming.length}</span>
            </div>
            {nextBookingInfo ? (
              <div className="pt-2 border-t">
                <p className="text-xs brand-label text-muted-foreground">Следующая бронь</p>
                <p className="font-medium">{nextBookingInfo.text}</p>
                <p className="text-xs text-muted-foreground">{nextBookingInfo.details}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-2 border-t">Сегодня новых стартов нет</p>
            )}
          </CardContent>
        </Card>

        <Card className="surface-elevated rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Алерты смены</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Просроченные оплаты
              </span>
              <span className="font-semibold">{overdueUnpaidCount}</span>
            </div>
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Без назначенного тренера
              </span>
              <span className="font-semibold">{noCoachCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-elevated rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Загрузка кортов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span>Всего кортов</span>
              <span className="font-semibold">{occupancySummary.totalCourts}</span>
            </div>
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span>Занято сейчас</span>
              <span className="font-semibold">{occupancySummary.busyNow}</span>
            </div>
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span>Свободно сейчас</span>
              <span className="font-semibold">{occupancySummary.freeNow}</span>
            </div>
            <div className="flex items-center justify-between border rounded-md px-2.5 py-2">
              <span>Пиковый час</span>
              <span className="font-semibold">{occupancySummary.peakHourLabel}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-elevated rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Ближайшие бронирования</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {upcomingBookings.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="h-8 w-8" />}
              title="Нет предстоящих бронирований"
              description="На сегодня все брони завершены или отсутствуют"
              className="py-12"
            />
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
