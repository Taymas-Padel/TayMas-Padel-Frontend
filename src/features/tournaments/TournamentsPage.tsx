import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, Users, CalendarDays, Trophy, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/PageHeader'
import { getTournaments, createTournament } from '@/api/tournaments'
import { formatMoney } from '@/utils/format'
import { parseApiError } from '@/utils/error'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import type { Tournament, TournamentStatus, TournamentFormat } from '@/types/tournament'

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Черновик',
  REGISTRATION: 'Регистрация',
  IN_PROGRESS: 'Идёт турнир',
  COMPLETED: 'Завершён',
  CANCELED: 'Отменён',
}

export const TOURNAMENT_STATUS_BADGE_VARIANTS: Record<
  TournamentStatus,
  'secondary' | 'info' | 'success' | 'default' | 'destructive'
> = {
  DRAFT: 'secondary',
  REGISTRATION: 'info',
  IN_PROGRESS: 'success',
  COMPLETED: 'default',
  CANCELED: 'destructive',
}

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  DOUBLES: 'Парный (2×2)',
  SINGLES: 'Одиночный (1×1)',
}

const STATUS_TABS: { value: TournamentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'DRAFT', label: 'Черновики' },
  { value: 'REGISTRATION', label: 'Регистрация' },
  { value: 'IN_PROGRESS', label: 'Идут' },
  { value: 'COMPLETED', label: 'Завершены' },
  { value: 'CANCELED', label: 'Отменены' },
]

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Обязательное поле'),
  end_date: z.string().min(1, 'Обязательное поле'),
  registration_deadline: z.string().min(1, 'Обязательное поле'),
  format: z.enum(['DOUBLES', 'SINGLES']),
  is_paid: z.boolean(),
  entry_fee: z.string().optional(),
  max_teams: z.coerce.number().min(2).optional().nullable(),
  prize_info: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function CreateTournamentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      format: 'DOUBLES',
      is_paid: false,
      entry_fee: '',
      prize_info: '',
    },
  })

  useEffect(() => {
    if (open) reset({ name: '', description: '', format: 'DOUBLES', is_paid: false, entry_fee: '', prize_info: '' })
  }, [open, reset])

  const isPaid = watch('is_paid')

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createTournament({
        name: values.name.trim(),
        description: values.description?.trim() || null,
        start_date: values.start_date,
        end_date: values.end_date,
        registration_deadline: values.registration_deadline,
        format: values.format,
        is_paid: values.is_paid,
        entry_fee: values.is_paid ? (values.entry_fee || '0') : '0',
        max_teams: values.max_teams ?? null,
        prize_info: values.prize_info?.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Турнир создан')
      qc.invalidateQueries({ queryKey: ['tournaments'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый турнир</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Название *</Label>
            <Input {...register('name')} placeholder="Grand Padel Cup 2026" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Формат *</Label>
              <Select value={watch('format')} onValueChange={(v) => setValue('format', v as TournamentFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Макс. команд</Label>
              <Input {...register('max_teams')} type="number" min="2" placeholder="16" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Дата начала *</Label>
              <Input {...register('start_date')} type="datetime-local" />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Дата конца *</Label>
              <Input {...register('end_date')} type="datetime-local" />
              {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Дедлайн регистрации *</Label>
            <Input {...register('registration_deadline')} type="datetime-local" />
            {errors.registration_deadline && (
              <p className="text-xs text-destructive">{errors.registration_deadline.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isPaid} onCheckedChange={(v) => setValue('is_paid', v)} />
            <Label>Платный турнир</Label>
          </div>

          {isPaid && (
            <div className="space-y-1">
              <Label>Взнос (₸) *</Label>
              <Input {...register('entry_fee')} placeholder="12000" />
            </div>
          )}

          <div className="space-y-1">
            <Label>Призы</Label>
            <Input {...register('prize_info')} placeholder="1 место — 100 000₸, 2 место — 50 000₸" />
          </div>

          <div className="space-y-1">
            <Label>Описание</Label>
            <Input {...register('description')} placeholder="Открытый турнир клуба..." />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const navigate = useNavigate()
  const startDate = new Date(tournament.start_date)

  return (
    <div
      onClick={() => navigate(ROUTES.TOURNAMENT_DETAIL(tournament.id))}
      className="border rounded-xl p-5 bg-card hover:border-primary/50 hover:shadow-sm cursor-pointer transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-base truncate">{tournament.name}</h3>
            <Badge variant={TOURNAMENT_STATUS_BADGE_VARIANTS[tournament.status]} className="text-xs shrink-0">
              {TOURNAMENT_STATUS_LABELS[tournament.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span>{FORMAT_LABELS[tournament.format]}</span>
            {tournament.is_paid && (
              <span className="text-emerald-600 font-medium">{formatMoney(tournament.entry_fee)} взнос</span>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{tournament.teams_count}</strong>
            {tournament.max_teams ? ` / ${tournament.max_teams}` : ''} команд
          </span>
        </span>
        {tournament.is_paid && tournament.paid_teams_count > 0 && (
          <span className="text-muted-foreground">
            <strong className="text-emerald-600">{tournament.paid_teams_count}</strong> оплачено
          </span>
        )}
        {tournament.prize_info && (
          <span className="flex items-center gap-1 text-amber-600 text-xs">
            <Trophy className="h-3.5 w-3.5" />
            {tournament.prize_info.length > 30
              ? tournament.prize_info.slice(0, 30) + '…'
              : tournament.prize_info}
          </span>
        )}
      </div>
    </div>
  )
}

export function TournamentsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'ALL'>('ALL')

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => getTournaments(),
  })

  const filtered = statusFilter === 'ALL'
    ? tournaments
    : tournaments.filter((t) => t.status === statusFilter)

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Турниры"
          description="Управление турнирами клуба"
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Создать турнир
            </Button>
          }
        />

        {/* Status filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.value !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {tournaments.filter((t) => t.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет турниров в этой категории</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((t) => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        )}
      </div>

      <CreateTournamentDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
