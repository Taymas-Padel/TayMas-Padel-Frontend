import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Loader2, Users, Trophy, Swords, BarChart3,
  Plus, CheckCircle, RefreshCw, DollarSign, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ClientSearch } from '@/components/shared/ClientSearch'
import { PaymentMethodSelect } from '@/components/shared/PaymentMethodSelect'
import {
  getTournament, getTournamentTeams, addTeam, updateTeam,
  confirmPayment, refundTeam, generateBracket, getBracket,
  getTournamentMatches, updateMatch, changeTournamentStatus,
  getTournamentReport,
} from '@/api/tournaments'
import { formatMoney } from '@/utils/format'
import { parseApiError } from '@/utils/error'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { TOURNAMENT_STATUS_LABELS, TOURNAMENT_STATUS_COLORS } from './TournamentsPage'
import type {
  TournamentStatus, TournamentTeam, TournamentMatch, TeamStatus,
} from '@/types/tournament'
import type { ClientUser } from '@/types/client'

const TEAM_STATUS_LABELS: Record<TeamStatus, string> = {
  PENDING: 'Заявка',
  CONFIRMED: 'Подтверждён',
  PAID: 'Оплачен',
  WITHDRAWN: 'Снят',
  REFUNDED: 'Возврат',
}

const TEAM_STATUS_COLORS: Record<TeamStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  WITHDRAWN: 'bg-slate-100 text-slate-600 border-slate-200',
  REFUNDED: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_TRANSITIONS: Record<TournamentStatus, TournamentStatus | null> = {
  DRAFT: 'REGISTRATION',
  REGISTRATION: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: null,
  CANCELED: null,
}

const STATUS_TRANSITION_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Открыть регистрацию',
  REGISTRATION: 'Начать турнир',
  IN_PROGRESS: 'Завершить турнир',
  COMPLETED: '',
  CANCELED: '',
}

// ──────────────────────────────────────────────
// Add Team Dialog
// ──────────────────────────────────────────────
function AddTeamDialog({
  open,
  onClose,
  tournamentId,
  format,
}: {
  open: boolean
  onClose: () => void
  tournamentId: number
  format: string
}) {
  const qc = useQueryClient()
  const [player1, setPlayer1] = useState<ClientUser | null>(null)
  const [player2, setPlayer2] = useState<ClientUser | null>(null)
  const [teamName, setTeamName] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      addTeam(tournamentId, {
        player1_id: player1!.id,
        player2_id: format === 'DOUBLES' ? player2?.id : undefined,
        team_name: teamName.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Команда добавлена')
      qc.invalidateQueries({ queryKey: ['tournament-teams', tournamentId] })
      onClose()
      setPlayer1(null)
      setPlayer2(null)
      setTeamName('')
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const canSubmit = !!player1 && (format === 'SINGLES' || !!player2)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить команду</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Игрок 1 *</Label>
            <ClientSearch
              onSelect={setPlayer1}
              selectedClient={player1}
              onClear={() => setPlayer1(null)}
            />
          </div>
          {format === 'DOUBLES' && (
            <div className="space-y-1">
              <Label>Игрок 2 *</Label>
              <ClientSearch
                onSelect={setPlayer2}
                selectedClient={player2}
                onClear={() => setPlayer2(null)}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label>Название команды (необязательно)</Label>
            <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Dream Team" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Отмена</Button>
            <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Добавить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────
// Teams Tab
// ──────────────────────────────────────────────
function TeamsTab({
  tournamentId,
  format,
  isPaid,
  canEdit,
}: {
  tournamentId: number
  format: string
  isPaid: boolean
  canEdit: boolean
}) {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [payTeam, setPayTeam] = useState<TournamentTeam | null>(null)
  const [payMethod, setPayMethod] = useState('KASPI')
  const [refundTeamId, setRefundTeamId] = useState<number | null>(null)

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['tournament-teams', tournamentId],
    queryFn: () => getTournamentTeams(tournamentId),
  })

  const confirmMutation = useMutation({
    mutationFn: () => confirmPayment(tournamentId, payTeam!.id, payMethod),
    onSuccess: () => {
      toast.success('Оплата подтверждена')
      qc.invalidateQueries({ queryKey: ['tournament-teams', tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      setPayTeam(null)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const refundMutation = useMutation({
    mutationFn: (teamId: number) => refundTeam(tournamentId, teamId),
    onSuccess: () => {
      toast.success('Возврат оформлен')
      qc.invalidateQueries({ queryKey: ['tournament-teams', tournamentId] })
      setRefundTeamId(null)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const confirmStatusMutation = useMutation({
    mutationFn: (teamId: number) => updateTeam(tournamentId, teamId, { status: 'CONFIRMED' }),
    onSuccess: () => {
      toast.success('Команда подтверждена')
      qc.invalidateQueries({ queryKey: ['tournament-teams', tournamentId] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Добавить команду
          </Button>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
          Команд пока нет
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Команда</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сид</TableHead>
                {isPaid && <TableHead>Оплата</TableHead>}
                {canEdit && <TableHead className="w-32" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team, idx) => (
                <TableRow key={team.id}>
                  <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{team.display_name || team.team_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.player1_info?.phone}
                        {team.player2_info && ` · ${team.player2_info.phone}`}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs', TEAM_STATUS_COLORS[team.status])}>
                      {TEAM_STATUS_LABELS[team.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {team.seed ?? '—'}
                  </TableCell>
                  {isPaid && (
                    <TableCell className="text-xs text-muted-foreground">
                      {team.paid_at
                        ? new Date(team.paid_at).toLocaleDateString('ru-RU')
                        : '—'}
                    </TableCell>
                  )}
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        {team.status === 'PENDING' && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => confirmStatusMutation.mutate(team.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Подтв.
                          </Button>
                        )}
                        {isPaid && (team.status === 'CONFIRMED' || team.status === 'PENDING') && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 text-xs text-emerald-600"
                            onClick={() => setPayTeam(team)}
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1" />
                            Оплата
                          </Button>
                        )}
                        {(team.status === 'PAID' || team.status === 'WITHDRAWN') && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 text-xs text-destructive"
                            onClick={() => setRefundTeamId(team.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            Возврат
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddTeamDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        tournamentId={tournamentId}
        format={format}
      />

      {/* Confirm payment dialog */}
      <Dialog open={!!payTeam} onOpenChange={(o) => !o && setPayTeam(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Подтвердить оплату</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Команда: <strong>{payTeam?.display_name}</strong></p>
            <div className="space-y-1">
              <Label>Способ оплаты</Label>
              <PaymentMethodSelect value={payMethod} onChange={setPayMethod} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPayTeam(null)}>Отмена</Button>
              <Button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
                {confirmMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Подтвердить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={refundTeamId !== null}
        onOpenChange={(o) => !o && setRefundTeamId(null)}
        title="Оформить возврат?"
        description="Статус команды изменится на «Возврат»."
        onConfirm={() => refundTeamId && refundMutation.mutate(refundTeamId)}
        isDestructive
      />
    </div>
  )
}

// ──────────────────────────────────────────────
// Bracket Tab
// ──────────────────────────────────────────────
function BracketTab({ tournamentId, isAdmin }: { tournamentId: number; isAdmin: boolean }) {
  const qc = useQueryClient()

  const { data: bracket, isLoading } = useQuery({
    queryKey: ['tournament-bracket', tournamentId],
    queryFn: () => getBracket(tournamentId),
    retry: 1,
  })

  const generateMutation = useMutation({
    mutationFn: () => generateBracket(tournamentId),
    onSuccess: () => {
      toast.success('Сетка сгенерирована')
      qc.invalidateQueries({ queryKey: ['tournament-bracket', tournamentId] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {bracket ? 'Перегенерировать сетку' : 'Сгенерировать сетку'}
          </Button>
        </div>
      )}

      {!bracket ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Swords className="h-10 w-10 mx-auto mb-2 opacity-30" />
          Сетка ещё не создана
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {bracket.rounds.map((round) => (
              <div key={round.round_number} className="flex flex-col gap-2" style={{ minWidth: 220 }}>
                {/* Round header */}
                <div className="text-center pb-2 border-b">
                  <p className="text-sm font-semibold">{round.round_name}</p>
                  <p className="text-xs text-muted-foreground">{round.matches.length} матч.</p>
                </div>
                {/* Matches */}
                <div className="flex flex-col gap-3">
                  {round.matches.map((match) => (
                    <BracketMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BracketMatchCard({ match }: { match: TournamentMatch }) {
  const isCompleted = match.status === 'COMPLETED'

  return (
    <div className={cn(
      'border rounded-lg p-3 bg-white text-sm',
      isCompleted ? 'border-slate-200' : 'border-dashed border-slate-300'
    )}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-xs text-muted-foreground">Матч #{match.match_number}</span>
        {match.court_name && <span className="text-xs text-muted-foreground">{match.court_name}</span>}
      </div>
      {/* Team 1 */}
      <TeamRow
        name={match.team1_info?.display_name ?? 'TBD'}
        score={match.score_team1}
        isWinner={match.winner === match.team1}
        isEmpty={!match.team1_info}
      />
      <div className="flex items-center gap-1 my-1">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs text-muted-foreground">vs</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>
      {/* Team 2 */}
      <TeamRow
        name={match.team2_info?.display_name ?? 'TBD'}
        score={match.score_team2}
        isWinner={match.winner === match.team2}
        isEmpty={!match.team2_info}
      />
      {match.scheduled_at && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {new Date(match.scheduled_at).toLocaleString('ru-RU', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      )}
    </div>
  )
}

function TeamRow({ name, score, isWinner, isEmpty }: { name: string; score: string; isWinner: boolean; isEmpty: boolean }) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2 rounded px-2 py-1',
      isWinner ? 'bg-green-50 font-semibold' : '',
      isEmpty ? 'opacity-40' : ''
    )}>
      <span className="truncate text-xs">{name}</span>
      {score && <span className="text-xs font-mono shrink-0">{score}</span>}
      {isWinner && <Trophy className="h-3 w-3 text-amber-500 shrink-0" />}
    </div>
  )
}

// ──────────────────────────────────────────────
// Match Edit Dialog
// ──────────────────────────────────────────────
const matchSchema = z.object({
  scheduled_at: z.string().optional(),
  court: z.coerce.number().optional().nullable(),
  score_team1: z.string().optional(),
  score_team2: z.string().optional(),
  winner: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
})

type MatchFormValues = z.infer<typeof matchSchema>

function MatchEditDialog({
  match,
  tournamentId,
  open,
  onClose,
}: {
  match: TournamentMatch | null
  tournamentId: number
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset } = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema),
  })

  useState(() => {
    if (match) {
      reset({
        scheduled_at: match.scheduled_at
          ? new Date(match.scheduled_at).toISOString().slice(0, 16)
          : '',
        court: match.court ?? null,
        score_team1: match.score_team1,
        score_team2: match.score_team2,
        winner: match.winner ?? null,
        notes: match.notes,
      })
    }
  })

  const mutation = useMutation({
    mutationFn: (values: MatchFormValues) => {
      const payload: Record<string, unknown> = {}
      if (values.scheduled_at) payload.scheduled_at = new Date(values.scheduled_at).toISOString()
      if (values.court) payload.court = values.court
      if (values.score_team1 !== undefined) payload.score_team1 = values.score_team1
      if (values.score_team2 !== undefined) payload.score_team2 = values.score_team2
      if (values.winner !== undefined && values.winner !== null) payload.winner = values.winner
      if (values.notes !== undefined) payload.notes = values.notes
      return updateMatch(tournamentId, match!.id, payload)
    },
    onSuccess: () => {
      toast.success('Матч обновлён')
      qc.invalidateQueries({ queryKey: ['tournament-matches', tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournament-bracket', tournamentId] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  if (!match) return null

  const team1Name = match.team1_info?.display_name ?? 'TBD'
  const team2Name = match.team2_info?.display_name ?? 'TBD'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Матч #{match.match_number} — {match.round_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Время матча</Label>
            <Input {...register('scheduled_at')} type="datetime-local" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Счёт — {team1Name}</Label>
              <Input {...register('score_team1')} placeholder="6-3, 6-4" />
            </div>
            <div className="space-y-1">
              <Label>Счёт — {team2Name}</Label>
              <Input {...register('score_team2')} placeholder="3-6, 4-6" />
            </div>
          </div>

          {match.team1_info && match.team2_info && (
            <div className="space-y-1">
              <Label>Победитель</Label>
              <Select
                value={watch('winner') ? String(watch('winner')) : ''}
                onValueChange={(v) => setValue('winner', v ? Number(v) : null)}
              >
                <SelectTrigger><SelectValue placeholder="Выбрать победителя" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(match.team1)}>{team1Name}</SelectItem>
                  <SelectItem value={String(match.team2)}>{team2Name}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Победитель автоматически перейдёт в следующий матч</p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Примечания</Label>
            <Input {...register('notes')} placeholder="Заметки..." />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────
// Matches Tab
// ──────────────────────────────────────────────
const MATCH_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Запланирован',
  IN_PROGRESS: 'Идёт',
  COMPLETED: 'Завершён',
  POSTPONED: 'Перенесён',
  WALKOVER: 'Тех. победа',
}

const MATCH_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  POSTPONED: 'bg-yellow-100 text-yellow-800',
  WALKOVER: 'bg-purple-100 text-purple-800',
}

function MatchesTab({ tournamentId, canEdit }: { tournamentId: number; canEdit: boolean }) {
  const [editMatch, setEditMatch] = useState<TournamentMatch | null>(null)

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['tournament-matches', tournamentId],
    queryFn: () => getTournamentMatches(tournamentId),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>

  const grouped = matches.reduce<Record<string, TournamentMatch[]>>((acc, m) => {
    const key = m.round_name
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Swords className="h-10 w-10 mx-auto mb-2 opacity-30" />
          Матчи ещё не созданы — сначала сгенерируйте сетку
        </div>
      ) : (
        Object.entries(grouped).map(([roundName, roundMatches]) => (
          <div key={roundName}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
              {roundName}
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Команды</TableHead>
                    <TableHead>Счёт</TableHead>
                    <TableHead>Корт</TableHead>
                    <TableHead>Время</TableHead>
                    <TableHead>Статус</TableHead>
                    {canEdit && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roundMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="text-muted-foreground text-xs">{match.match_number}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className={cn(match.winner === match.team1 ? 'font-semibold' : '')}>
                            {match.team1_info?.display_name ?? '—'}
                          </span>
                          <span className="text-muted-foreground mx-1.5">vs</span>
                          <span className={cn(match.winner === match.team2 ? 'font-semibold' : '')}>
                            {match.team2_info?.display_name ?? '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {match.score_team1 || match.score_team2
                          ? `${match.score_team1} / ${match.score_team2}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{match.court_name ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {match.scheduled_at
                          ? new Date(match.scheduled_at).toLocaleString('ru-RU', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', MATCH_STATUS_COLORS[match.status])}>
                          {MATCH_STATUS_LABELS[match.status] ?? match.status}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button
                            size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => setEditMatch(match)}
                          >
                            Ред.
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      )}

      <MatchEditDialog
        match={editMatch}
        tournamentId={tournamentId}
        open={!!editMatch}
        onClose={() => setEditMatch(null)}
      />
    </div>
  )
}

// ──────────────────────────────────────────────
// Report Tab
// ──────────────────────────────────────────────
function ReportTab({ tournamentId }: { tournamentId: number }) {
  const { data: report, isLoading } = useQuery({
    queryKey: ['tournament-report', tournamentId],
    queryFn: () => getTournamentReport(tournamentId),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
  if (!report) return null

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего команд', value: report.total_teams },
          { label: 'Оплатили', value: report.paid_teams },
          { label: 'Снялись', value: report.withdrawn_teams },
          { label: 'Выручка', value: formatMoney(report.revenue) },
        ].map((s) => (
          <div key={s.label} className="border rounded-lg p-4 bg-white">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Winner */}
      {report.winner && (
        <div className="border rounded-lg p-4 bg-amber-50 border-amber-200 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Победитель</p>
            <p className="font-bold text-lg">{report.winner.display_name}</p>
          </div>
        </div>
      )}

      {/* Teams ranking */}
      {report.teams.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Статистика команд</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">№</TableHead>
                  <TableHead>Команда</TableHead>
                  <TableHead>Матчей</TableHead>
                  <TableHead>Побед</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.teams.map((entry, idx) => (
                  <TableRow key={entry.team.id}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-sm">{entry.team.display_name}</TableCell>
                    <TableCell className="text-sm">{entry.matches_played}</TableCell>
                    <TableCell className="text-sm font-semibold text-emerald-600">{entry.won}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Main Detail Page
// ──────────────────────────────────────────────
type Tab = 'teams' | 'bracket' | 'matches' | 'report'

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: 'teams', label: 'Команды', icon: <Users className="h-4 w-4" /> },
  { value: 'bracket', label: 'Сетка', icon: <Swords className="h-4 w-4" /> },
  { value: 'matches', label: 'Матчи', icon: <ArrowRight className="h-4 w-4" /> },
  { value: 'report', label: 'Отчёт', icon: <BarChart3 className="h-4 w-4" /> },
]

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const tournamentId = Number(id)
  const [activeTab, setActiveTab] = useState<Tab>('teams')
  const [cancelConfirm, setCancelConfirm] = useState(false)

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => getTournament(tournamentId),
  })

  const statusMutation = useMutation({
    mutationFn: (status: TournamentStatus) => changeTournamentStatus(tournamentId, status),
    onSuccess: (res) => {
      toast.success(`Статус изменён: ${res.status_display}`)
      qc.invalidateQueries({ queryKey: ['tournament', tournamentId] })
      qc.invalidateQueries({ queryKey: ['tournaments'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!tournament) return null

  const nextStatus = STATUS_TRANSITIONS[tournament.status]
  const canEdit = tournament.status !== 'COMPLETED' && tournament.status !== 'CANCELED'
  const isAdmin = true // always true since page is admin-only

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate(ROUTES.TOURNAMENTS)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Все турниры
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{tournament.name}</h1>
              <Badge
                variant="outline"
                className={cn('text-sm', TOURNAMENT_STATUS_COLORS[tournament.status])}
              >
                {TOURNAMENT_STATUS_LABELS[tournament.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              <span>
                {new Date(tournament.start_date).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
              <span>·</span>
              <span>{tournament.format === 'DOUBLES' ? 'Парный' : 'Одиночный'}</span>
              {tournament.is_paid && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 font-medium">{formatMoney(tournament.entry_fee)} взнос</span>
                </>
              )}
              <span>·</span>
              <span>{tournament.teams_count}{tournament.max_teams ? `/${tournament.max_teams}` : ''} команд</span>
            </div>
            {tournament.prize_info && (
              <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                {tournament.prize_info}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {canEdit && tournament.status !== 'CANCELED' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setCancelConfirm(true)}
              >
                Отменить турнир
              </Button>
            )}
            {nextStatus && (
              <Button
                size="sm"
                onClick={() => statusMutation.mutate(nextStatus)}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {STATUS_TRANSITION_LABELS[tournament.status]}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'teams' && (
          <TeamsTab
            tournamentId={tournamentId}
            format={tournament.format}
            isPaid={tournament.is_paid}
            canEdit={canEdit}
          />
        )}
        {activeTab === 'bracket' && (
          <BracketTab tournamentId={tournamentId} isAdmin={isAdmin} />
        )}
        {activeTab === 'matches' && (
          <MatchesTab tournamentId={tournamentId} canEdit={canEdit} />
        )}
        {activeTab === 'report' && (
          <ReportTab tournamentId={tournamentId} />
        )}
      </div>

      <ConfirmDialog
        open={cancelConfirm}
        onOpenChange={(o) => !o && setCancelConfirm(false)}
        title="Отменить турнир?"
        description="Статус изменится на «Отменён». Это действие нельзя отменить."
        onConfirm={() => statusMutation.mutate('CANCELED')}
        isDestructive
      />
    </div>
  )
}
