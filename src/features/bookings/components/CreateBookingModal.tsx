import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PaymentMethodSelect } from '@/components/shared/PaymentMethodSelect'
import { ClientSearch } from '@/components/shared/ClientSearch'
import { createBooking } from '@/api/bookings'
import { getCourts } from '@/api/courts'
import { getCoaches } from '@/api/coaches'
import { parseApiError } from '@/utils/error'
import type { ClientUser } from '@/types/client'

interface CreateBookingModalProps {
  open: boolean
  onClose: () => void
  prefillCourt?: number
  prefillStart?: string // ISO string
}

export function CreateBookingModal({
  open,
  onClose,
  prefillCourt,
  prefillStart,
}: CreateBookingModalProps) {
  const qc = useQueryClient()
  const [client, setClient] = useState<ClientUser | null>(null)
  const [courtId, setCourtId] = useState<string>(prefillCourt?.toString() ?? '')
  const [startTime, setStartTime] = useState(prefillStart ?? '')
  const [duration, setDuration] = useState<string>('60')
  const [coachId, setCoachId] = useState<string>('')
  const [coachParticipants, setCoachParticipants] = useState<2 | 4 | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [promoCode, setPromoCode] = useState('')

  useEffect(() => {
    if (open) {
      setClient(null)
      setCourtId(prefillCourt?.toString() ?? '')
      setStartTime(prefillStart ?? '')
      setDuration('60')
      setCoachId('')
      setCoachParticipants(null)
      setPaymentMethod('CASH')
      setPromoCode('')
    }
  }, [open, prefillCourt, prefillStart])

  const { data: courts = [] } = useQuery({
    queryKey: ['courts'],
    queryFn: getCourts,
  })

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: getCoaches,
  })

  const mutation = useMutation({
    mutationFn: () =>
      createBooking({
        client_id: client!.id,
        court: parseInt(courtId),
        start_time: new Date(startTime).toISOString(),
        duration: parseInt(duration) as 30 | 60 | 90 | 120,
        coach: coachId ? parseInt(coachId) : null,
        ...(coachId && coachParticipants ? { coach_expected_participants: coachParticipants } : {}),
        payment_method: paymentMethod as 'KASPI' | 'CARD' | 'CASH' | 'BONUS' | 'UNKNOWN',
        promo_code: promoCode || undefined,
      }),
    onSuccess: () => {
      toast.success('Бронирование создано')
      qc.invalidateQueries({ queryKey: ['schedule'] })
      qc.invalidateQueries({ queryKey: ['bookings'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const canSubmit = !!client && !!courtId && !!startTime && !!duration

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новое бронирование</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Клиент *</Label>
            <ClientSearch
              onSelect={setClient}
              selectedClient={client}
              onClear={() => setClient(null)}
            />
          </div>

          <div className="space-y-1">
            <Label>Корт *</Label>
            <Select value={courtId} onValueChange={setCourtId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите корт" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Начало *</Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Длительность *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 мин</SelectItem>
                  <SelectItem value="60">60 мин</SelectItem>
                  <SelectItem value="90">90 мин</SelectItem>
                  <SelectItem value="120">120 мин</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Тренер</Label>
            <Select
              value={coachId || '_none'}
              onValueChange={(v) => {
                const val = v === '_none' ? '' : v
                setCoachId(val)
                if (!val) setCoachParticipants(null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Без тренера" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Без тренера</SelectItem>
                {coaches.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {coachId && (
            <div className="space-y-1">
              <Label>Сколько человек будет на тренировке?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCoachParticipants(2)}
                  className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                    coachParticipants === 2
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-input hover:bg-muted'
                  }`}
                >
                  1–2 человека
                </button>
                <button
                  type="button"
                  onClick={() => setCoachParticipants(4)}
                  className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                    coachParticipants === 4
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-input hover:bg-muted'
                  }`}
                >
                  3–4 человека
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label>Способ оплаты</Label>
            <PaymentMethodSelect value={paymentMethod} onChange={setPaymentMethod} />
          </div>

          <div className="space-y-1">
            <Label>Промокод</Label>
            <Input
              placeholder="Введите промокод"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Отмена
            </Button>
            <Button
              className="flex-1"
              onClick={() => mutation.mutate()}
              disabled={!canSubmit || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
