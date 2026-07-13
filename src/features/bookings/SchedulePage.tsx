import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Loader2, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { ScheduleGrid } from './components/ScheduleGrid'
import { CreateBookingModal } from './components/CreateBookingModal'
import { getSchedule, getAllBookings } from '@/api/bookings'
import { getCoaches } from '@/api/coaches'
import { getSettings } from '@/api/core'
import { todayISO, formatDate } from '@/utils/date'
import { addDays, subDays } from 'date-fns'
import { cn } from '@/utils/cn'
import type { BookingStatus } from '@/types/booking'

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

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

const STATUS_OPTIONS: {
  value: BookingStatus | 'ALL'
  label: string
  tone: 'secondary' | 'warning' | 'success' | 'info' | 'destructive'
}[] = [
  { value: 'ALL', label: 'Все', tone: 'secondary' },
  { value: 'PENDING', label: 'Ожидает', tone: 'warning' },
  { value: 'CONFIRMED', label: 'Подтверждено', tone: 'success' },
  { value: 'COMPLETED', label: 'Завершено', tone: 'info' },
  { value: 'CANCELED', label: 'Отменено', tone: 'destructive' },
]

export function SchedulePage() {
  const [date, setDate] = useState(todayISO())
  const [createOpen, setCreateOpen] = useState(false)
  const [filterCourts, setFilterCourts] = useState<number[]>([])
  const [filterCoach, setFilterCoach] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [onlyFreeNow, setOnlyFreeNow] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', date],
    queryFn: () => getSchedule(date),
  })

  // Fetch canceled bookings separately — the schedule endpoint doesn't return them
  const { data: canceledBookings = [] } = useQuery({
    queryKey: ['bookings', { date, status: 'CANCELED' }],
    queryFn: () => getAllBookings({ date, status: 'CANCELED' }),
    enabled: filterStatus === 'CANCELED',
  })

  // Fetch completed bookings separately — the schedule endpoint doesn't return them either
  const { data: completedBookings = [] } = useQuery({
    queryKey: ['bookings', { date, status: 'COMPLETED' }],
    queryFn: () => getAllBookings({ date, status: 'COMPLETED' }),
    enabled: filterStatus === 'COMPLETED',
  })

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: getCoaches,
  })

  const { data: settings = [] } = useQuery({
    queryKey: ['club-settings'],
    queryFn: getSettings,
  })

  const startHour = parseOpenHour(settings.find((s) => s.key === 'OPEN_TIME')?.value)
  const endHour = parseCloseHour(settings.find((s) => s.key === 'CLOSE_TIME')?.value, startHour)

  function prev() {
    setDate(formatDateInput(subDays(new Date(date), 1)))
  }

  function next() {
    setDate(formatDateInput(addDays(new Date(date), 1)))
  }

  function setQuickDate(offsetDays: number) {
    setDate(formatDateInput(addDays(new Date(), offsetDays)))
  }

  function toggleCourt(courtId: number) {
    setFilterCourts((prev) =>
      prev.includes(courtId) ? prev.filter((id) => id !== courtId) : [...prev, courtId]
    )
  }

  function clearFilters() {
    setFilterCourts([])
    setFilterCoach('')
    setFilterStatus('ALL')
    setOnlyFreeNow(false)
  }

  const hasFilters = filterCourts.length > 0 || !!filterCoach || filterStatus !== 'ALL' || onlyFreeNow

  // Merge canceled/completed bookings (fetched separately) into schedule courts by court_name
  const mergedCourts = useMemo(() => {
    if (!data) return []
    const extraBookings =
      filterStatus === 'CANCELED' ? canceledBookings :
      filterStatus === 'COMPLETED' ? completedBookings : []
    if (extraBookings.length === 0) return data.schedule
    return data.schedule.map((court) => ({
      ...court,
      bookings: [
        ...court.bookings,
        ...extraBookings.filter(
          (b) => b.court_name === court.court_name && !court.bookings.some((existing) => existing.id === b.id)
        ),
      ],
    }))
  }, [data, filterStatus, canceledBookings, completedBookings])

  const isTodaySelected = date === todayISO()

  const busyCourtIdsNow = useMemo(() => {
    if (!isTodaySelected) return new Set<number>()
    const now = new Date()
    const ids = new Set<number>()
    for (const court of mergedCourts) {
      const hasActiveBooking = court.bookings.some((b) => {
        if (b.status === 'CANCELED') return false
        const start = new Date(b.start_time)
        const end = new Date(b.end_time)
        return start <= now && end > now
      })
      if (hasActiveBooking) ids.add(court.court_id)
    }
    return ids
  }, [mergedCourts, isTodaySelected])

  const effectiveCourtFilter = useMemo(() => {
    const manuallyFiltered = new Set(filterCourts)
    if (!onlyFreeNow || !isTodaySelected) return filterCourts

    const freeNowIds = mergedCourts
      .map((c) => c.court_id)
      .filter((id) => !busyCourtIdsNow.has(id))

    if (manuallyFiltered.size === 0) return freeNowIds
    return freeNowIds.filter((id) => manuallyFiltered.has(id))
  }, [onlyFreeNow, isTodaySelected, mergedCourts, busyCourtIdsNow, filterCourts])

  useEffect(() => {
    if (!isTodaySelected && onlyFreeNow) {
      setOnlyFreeNow(false)
    }
  }, [isTodaySelected, onlyFreeNow])

  // Compute stats from schedule data (use canceledBookings count separately since they're not in schedule)
  const stats = useMemo(() => {
    if (!data) return null
    const allBookings = data.schedule.flatMap((c) => c.bookings)
    const totalCourts = data.schedule.length
    const busyNow = isTodaySelected ? busyCourtIdsNow.size : 0
    const freeNow = isTodaySelected ? Math.max(totalCourts - busyNow, 0) : 0
    const occupancyNow = isTodaySelected && totalCourts > 0 ? Math.round((busyNow / totalCourts) * 100) : 0
    return {
      total: allBookings.filter((b) => b.status !== 'CANCELED').length,
      pending: allBookings.filter((b) => b.status === 'PENDING').length,
      confirmed: allBookings.filter((b) => b.status === 'CONFIRMED').length,
      canceled: canceledBookings.length,
      completed: filterStatus === 'COMPLETED' && completedBookings.length > 0
        ? completedBookings.length
        : allBookings.filter((b) => b.status === 'COMPLETED').length,
      totalCourts,
      busyNow,
      freeNow,
      occupancyNow,
    }
  }, [data, canceledBookings, completedBookings, filterStatus, isTodaySelected, busyCourtIdsNow])

  // Collect all unique coaches from today's schedule
  const scheduleCoaches = useMemo(() => {
    if (!data) return []
    const names = new Set<string>()
    for (const court of data.schedule) {
      for (const booking of court.bookings) {
        if (booking.coach_name) names.add(booking.coach_name)
      }
    }
    // Also include coaches from the coaches list (by full_name)
    for (const coach of coaches) {
      names.add(coach.full_name)
    }
    return Array.from(names).sort()
  }, [data, coaches])

  return (
      <div className="space-y-4 min-w-0">
      <PageHeader
        title="Расписание"
        description="Брони по кортам на выбранный день"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Новая бронь
          </Button>
        }
      />

      {/* Date navigation + stats */}
      <div className="surface-elevated rounded-xl p-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 min-w-0 flex-1 sm:flex-none rounded-md border border-input bg-background/85 px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/65"
          />
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground capitalize w-full sm:w-auto">
            {formatDate(date)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDate(todayISO())}
            className="text-xs h-9"
          >
            Сегодня
          </Button>
        </div>

        <div className="hidden sm:block h-5 w-px bg-border" />
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" className="h-9 sm:h-8 text-xs" onClick={() => setQuickDate(1)}>
            Завтра
          </Button>
          <Button variant="outline" size="sm" className="h-9 sm:h-8 text-xs" onClick={() => setQuickDate(7)}>
            +7 дней
          </Button>
        </div>

        {/* Stats pills */}
        {stats && (
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <span className="text-xs text-muted-foreground">Броней:</span>
            <Badge variant="outline" className="text-xs gap-1">
              Всего <strong>{stats.total}</strong>
            </Badge>
            {stats.pending > 0 && <Badge variant="warning" className="text-xs">Ожидает {stats.pending}</Badge>}
            {stats.confirmed > 0 && <Badge variant="success" className="text-xs">Подтверждено {stats.confirmed}</Badge>}
            {stats.completed > 0 && <Badge variant="info" className="text-xs">Завершено {stats.completed}</Badge>}
            {stats.canceled > 0 && <Badge variant="destructive" className="text-xs">Отменено {stats.canceled}</Badge>}
            <div className="w-px h-4 bg-border mx-0.5 hidden sm:block" />
            <Badge variant="secondary" className="text-xs">Корты {stats.totalCourts}</Badge>
            {isTodaySelected && (
              <>
                <Badge variant="outline" className="text-xs">Занято сейчас {stats.busyNow}</Badge>
                <Badge variant="outline" className="text-xs">Свободно {stats.freeNow}</Badge>
                <Badge variant="outline" className="text-xs">Загрузка {stats.occupancyNow}%</Badge>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filter bar */}
      {data && (
        <div className="surface-elevated rounded-xl flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-start gap-2 min-w-0">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-2 sm:mt-0.5" />

            {/* Status filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilterStatus(opt.value)}
                  className={cn(
                    'px-2.5 py-1.5 sm:px-2 sm:py-0.5 rounded-full text-xs border font-medium transition-all min-h-8',
                    filterStatus === opt.value
                      ? opt.value === 'ALL'
                        ? 'bg-foreground text-background border-foreground'
                        : cn(
                            opt.tone === 'warning' && 'bg-amber-500/15 text-amber-900 border-amber-500/30',
                            opt.tone === 'success' && 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
                            opt.tone === 'info' && 'bg-blue-500/15 text-blue-800 border-blue-500/30',
                            opt.tone === 'destructive' && 'bg-red-500/15 text-red-800 border-red-500/30',
                            'border opacity-100 ring-1 ring-offset-1 ring-foreground/30'
                          )
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:block w-px h-5 bg-border" />

          {/* Coach filter */}
          <Select value={filterCoach || '__all__'} onValueChange={(v) => setFilterCoach(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-9 sm:h-7 text-xs w-full sm:w-[180px]">
              <SelectValue placeholder="Все тренеры" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Все тренеры</SelectItem>
              {scheduleCoaches.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden sm:block w-px h-5 bg-border" />

          <Button
            type="button"
            variant={onlyFreeNow ? 'default' : 'outline'}
            size="sm"
            className="h-9 sm:h-7 text-xs w-full sm:w-auto"
            disabled={!isTodaySelected}
            onClick={() => setOnlyFreeNow((v) => !v)}
            title={isTodaySelected ? 'Показать только свободные корты на текущее время' : 'Работает только для текущей даты'}
          >
            Только свободные сейчас
          </Button>

          <div className="hidden sm:block w-px h-5 bg-border" />

          {/* Court filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">Корты:</span>
            {data.schedule.map((court) => (
              <button
                key={court.court_id}
                type="button"
                onClick={() => toggleCourt(court.court_id)}
                className={cn(
                  'px-2.5 py-1.5 sm:px-2 sm:py-0.5 rounded-full text-xs border font-medium transition-all min-h-8',
                  filterCourts.includes(court.court_id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                )}
              >
                {court.court_name}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <>
              <div className="hidden sm:block w-px h-5 bg-border" />
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-8"
              >
                <X className="h-3 w-3" />
                Сбросить
              </button>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <ScheduleGrid
          courts={mergedCourts}
          date={date}
          filterCourts={effectiveCourtFilter}
          filterCoach={filterCoach || null}
          filterStatus={filterStatus !== 'ALL' ? filterStatus : null}
          startHour={startHour}
          endHour={endHour}
        />
      ) : null}

      <CreateBookingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        openHour={startHour}
        closeHour={endHour}
      />
    </div>
  )
}
