import { useState, useMemo } from 'react'
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

const STATUS_OPTIONS: { value: BookingStatus | 'ALL'; label: string; color: string }[] = [
  { value: 'ALL', label: 'Все', color: 'bg-muted text-muted-foreground' },
  { value: 'PENDING', label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'CONFIRMED', label: 'Подтверждено', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'COMPLETED', label: 'Завершено', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'CANCELED', label: 'Отменено', color: 'bg-red-100 text-red-800 border-red-300' },
]

export function SchedulePage() {
  const [date, setDate] = useState(todayISO())
  const [createOpen, setCreateOpen] = useState(false)
  const [filterCourts, setFilterCourts] = useState<number[]>([])
  const [filterCoach, setFilterCoach] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

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

  function toggleCourt(courtId: number) {
    setFilterCourts((prev) =>
      prev.includes(courtId) ? prev.filter((id) => id !== courtId) : [...prev, courtId]
    )
  }

  function clearFilters() {
    setFilterCourts([])
    setFilterCoach('')
    setFilterStatus('ALL')
  }

  const hasFilters = filterCourts.length > 0 || !!filterCoach || filterStatus !== 'ALL'

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

  // Compute stats from schedule data (use canceledBookings count separately since they're not in schedule)
  const stats = useMemo(() => {
    if (!data) return null
    const allBookings = data.schedule.flatMap((c) => c.bookings)
    return {
      total: allBookings.filter((b) => b.status !== 'CANCELED').length,
      pending: allBookings.filter((b) => b.status === 'PENDING').length,
      confirmed: allBookings.filter((b) => b.status === 'CONFIRMED').length,
      canceled: canceledBookings.length,
      completed: filterStatus === 'COMPLETED' && completedBookings.length > 0
        ? completedBookings.length
        : allBookings.filter((b) => b.status === 'COMPLETED').length,
    }
  }, [data, canceledBookings, completedBookings])

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
    <div className="space-y-4">
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm"
          />
          <Button variant="outline" size="icon" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground capitalize">
            {formatDate(date)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDate(todayISO())}
            className="text-xs"
          >
            Сегодня
          </Button>
        </div>

        {/* Stats pills */}
        {stats && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="text-xs text-muted-foreground">Броней:</span>
            <Badge variant="outline" className="text-xs gap-1">
              Всего <strong>{stats.total}</strong>
            </Badge>
            {stats.pending > 0 && (
              <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">
                Ожидает {stats.pending}
              </Badge>
            )}
            {stats.confirmed > 0 && (
              <Badge className="text-xs bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
                Подтверждено {stats.confirmed}
              </Badge>
            )}
            {stats.completed > 0 && (
              <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">
                Завершено {stats.completed}
              </Badge>
            )}
            {stats.canceled > 0 && (
              <Badge className="text-xs bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
                Отменено {stats.canceled}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Filter bar */}
      {data && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-lg border">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />

          {/* Status filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterStatus(opt.value)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs border font-medium transition-all',
                  filterStatus === opt.value
                    ? opt.value === 'ALL'
                      ? 'bg-foreground text-background border-foreground'
                      : cn(opt.color, 'border opacity-100 ring-2 ring-offset-1 ring-current')
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Coach filter */}
          <Select value={filterCoach || '__all__'} onValueChange={(v) => setFilterCoach(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-7 text-xs w-[180px]">
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

          <div className="w-px h-5 bg-border" />

          {/* Court filter chips */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Корты:</span>
            {data.schedule.map((court) => (
              <button
                key={court.court_id}
                type="button"
                onClick={() => toggleCourt(court.court_id)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs border font-medium transition-all',
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
              <div className="w-px h-5 bg-border" />
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
          filterCourts={filterCourts}
          filterCoach={filterCoach || null}
          filterStatus={filterStatus !== 'ALL' ? filterStatus : null}
          startHour={startHour}
          endHour={endHour}
        />
      ) : null}

      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
