import { useState } from 'react'
import { BookingCell, EmptyCell } from './BookingCell'
import { BookingDetailModal } from './BookingDetailModal'
import { CreateBookingModal } from './CreateBookingModal'
import { effectiveBookingStatus } from '@/utils/date'
import type { CourtSchedule, Booking } from '@/types/booking'

const SLOT_HEIGHT = 32 // px per 30-min slot

// Slot: key is raw hour string (can exceed 23 for past-midnight), label is display time
interface Slot {
  key: string    // unique, e.g. "24:00" for midnight
  label: string  // display, e.g. "00:00"
  rawHour: number
}

function generateSlots(startHour: number, endHour: number): Slot[] {
  const slots: Slot[] = []
  for (let h = startHour; h < endHour; h++) {
    const displayH = h % 24
    const label = String(displayH).padStart(2, '0')
    slots.push({ key: `${h}:00`, label: `${label}:00`, rawHour: h })
    slots.push({ key: `${h}:30`, label: `${label}:30`, rawHour: h })
  }
  return slots
}

function getSlotIndex(isoString: string, startHour: number): number {
  const date = new Date(isoString)
  let hours = date.getHours()
  // Past midnight (00:xx, 01:xx etc.) — treat as continuation of previous day
  if (hours < startHour) hours += 24
  return (hours - startHour) * 2 + (date.getMinutes() >= 30 ? 1 : 0)
}

function getDurationSlots(start: string, end: string): number {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  return Math.round((endMs - startMs) / (30 * 60 * 1000))
}

interface ScheduleGridProps {
  courts: CourtSchedule[]
  date: string
  filterCourts?: number[]
  filterCoach?: string | null
  filterStatus?: string | null
  startHour?: number
  endHour?: number
}

export function ScheduleGrid({ courts, date, filterCourts, filterCoach, filterStatus, startHour = 7, endHour = 23 }: ScheduleGridProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createCourt, setCreateCourt] = useState<number | undefined>()
  const [createStart, setCreateStart] = useState<string | undefined>()

  const TIME_SLOTS = generateSlots(startHour, endHour)

  function handleEmptyClick(courtId: number, slot: Slot) {
    setCreateCourt(courtId)
    setCreateStart(`${date}T${slot.label}`)
    setCreateOpen(true)
  }

  const hasActiveFilters = (filterCourts && filterCourts.length > 0) || !!filterCoach || (!!filterStatus && filterStatus !== 'ALL')

  const visibleCourts = filterCourts && filterCourts.length > 0
    ? courts.filter((c) => filterCourts.includes(c.court_id))
    : courts

  if (visibleCourts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        По выбранным фильтрам нет доступных кортов.
      </div>
    )
  }

  function isBookingDimmed(booking: Booking): boolean {
    if (!hasActiveFilters) return false
    if (filterCoach && booking.coach_name !== filterCoach) return true
    if (filterStatus && filterStatus !== 'ALL') {
      if (filterStatus === 'COMPLETED') {
        // COMPLETED filter: include both actual COMPLETED and past-ended PENDING/CONFIRMED
        const effStatus = effectiveBookingStatus(booking.status, booking.end_time)
        if (effStatus !== 'COMPLETED') return true
      } else {
        // For PENDING, CONFIRMED, CANCELED: match raw backend status
        if (booking.status !== filterStatus) return true
      }
    }
    return false
  }

  type OccupiedMap = Map<string, { booking: Booking; rowSpan: number; isFirst: boolean }>

  const courtOccupied = new Map<number, OccupiedMap>()
  for (const court of visibleCourts) {
    const occupied: OccupiedMap = new Map()
    for (const booking of court.bookings) {
      if (booking.status === 'CANCELED' && filterStatus !== 'CANCELED') continue
      const startSlot = getSlotIndex(booking.start_time, startHour)
      const durationSlots = getDurationSlots(booking.start_time, booking.end_time)
      for (let i = 0; i < durationSlots; i++) {
        const slot = TIME_SLOTS[startSlot + i]
        if (!slot) continue
        occupied.set(slot.key, {
          booking,
          rowSpan: durationSlots,
          isFirst: i === 0,
        })
      }
    }
    courtOccupied.set(court.court_id, occupied)
  }

  return (
    <>
      <div className="overflow-x-auto overflow-y-auto border rounded-lg max-w-full">
        <div
          className="grid min-w-[320px]"
          style={{
            gridTemplateColumns: `56px repeat(${visibleCourts.length}, minmax(120px, 1fr))`,
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-background border-b border-r py-2 px-2 text-xs text-muted-foreground font-medium">
            Время
          </div>
          {visibleCourts.map((court) => (
            <div
              key={court.court_id}
              className="sticky top-0 z-20 bg-background border-b border-r py-2 px-2 text-xs font-semibold truncate"
            >
              {court.court_name}
              <span className="ml-1 text-muted-foreground font-normal">
                ({court.bookings.filter((b) => b.status !== 'CANCELED').length})
              </span>
            </div>
          ))}

          {/* Time rows */}
          {TIME_SLOTS.map((slot) => (
            <>
              {/* Time label */}
              <div
                key={`time-${slot.key}`}
                className="border-r border-b text-xs text-muted-foreground px-2 flex items-start pt-1"
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                {slot.label.endsWith(':00') ? slot.label : ''}
              </div>

              {/* Court cells */}
              {visibleCourts.map((court) => {
                const occupied = courtOccupied.get(court.court_id)
                const cellInfo = occupied?.get(slot.key)

                return (
                  <div
                    key={`${court.court_id}-${slot.key}`}
                    className="border-r border-b relative"
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  >
                    {cellInfo?.isFirst ? (
                      <BookingCell
                        booking={cellInfo.booking}
                        rowSpan={cellInfo.rowSpan}
                        onClick={() => setSelectedBooking(cellInfo.booking)}
                        dimmed={isBookingDimmed(cellInfo.booking)}
                      />
                    ) : !cellInfo ? (
                      <EmptyCell
                        onClick={() => handleEmptyClick(court.court_id, slot)}
                      />
                    ) : null}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>

      <BookingDetailModal
        booking={selectedBooking}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      <CreateBookingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        prefillCourt={createCourt}
        prefillStart={createStart}
        openHour={startHour}
        closeHour={endHour}
      />
    </>
  )
}
