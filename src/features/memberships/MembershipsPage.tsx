import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { ViewModeToggle, type ViewMode } from '@/components/shared/ViewModeToggle'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { getAllMemberships } from '@/api/memberships'
import { formatDate } from '@/utils/date'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { EmptyState } from '@/components/shared/EmptyState'

function formatMembershipBalance(hoursRemaining: string | null, visitsRemaining: number | null) {
  if (hoursRemaining != null) {
    const hours = Number(hoursRemaining)
    return Number.isFinite(hours) && hours <= 0 ? 'Закончился' : `${hoursRemaining} ч`
  }
  if (visitsRemaining != null) {
    return visitsRemaining <= 0 ? 'Закончился' : `${visitsRemaining} виз.`
  }
  return '—'
}

export function MembershipsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState<'all' | 'PADEL_HOURS' | 'GYM' | 'TRAINING_HOURS' | 'VIP'>('all')
  const [frozenFilter, setFrozenFilter] = useState<'all' | 'frozen' | 'not_frozen'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['memberships', { activeFilter }],
    queryFn: () =>
      getAllMemberships({
        is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
      }),
  })

  const filteredMemberships = useMemo(() => {
    const q = search.trim().toLowerCase()
    return memberships.filter((m) => {
      if (serviceFilter !== 'all' && m.service_type !== serviceFilter) return false
      if (frozenFilter === 'frozen' && !m.is_frozen) return false
      if (frozenFilter === 'not_frozen' && m.is_frozen) return false
      if (!q) return true
      const haystack = `${m.user_name} ${m.membership_type_name} ${m.service_type_display}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [memberships, search, serviceFilter, frozenFilter])

  const stats = useMemo(() => {
    const now = new Date()
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return {
      total: filteredMemberships.length,
      active: filteredMemberships.filter((m) => m.is_active).length,
      frozen: filteredMemberships.filter((m) => m.is_frozen).length,
      expiringSoon: filteredMemberships.filter((m) => m.is_active && new Date(m.end_date) <= in7days).length,
    }
  }, [filteredMemberships])

  function resetFilters() {
    setSearch('')
    setServiceFilter('all')
    setFrozenFilter('all')
    setActiveFilter('all')
  }

  const hasCustomFilters =
    search.trim().length > 0 || serviceFilter !== 'all' || frozenFilter !== 'all' || activeFilter !== 'all'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Абонементы"
        description={`Показано ${filteredMemberships.length} из ${memberships.length}`}
        actions={
          <Button onClick={() => navigate(ROUTES.MEMBERSHIPS_ISSUE)}>
            Выдать абонемент
          </Button>
        }
      />

      <div className="surface-elevated rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="relative w-full sm:min-w-[220px] sm:flex-1 sm:max-w-sm min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
            placeholder="Поиск по клиенту или типу..."
          />
        </div>
        <Select
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}
        >
          <SelectTrigger className="w-full sm:w-[190px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все абонементы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="inactive">Неактивные</SelectItem>
          </SelectContent>
        </Select>

        <Select value={serviceFilter} onValueChange={(v) => setServiceFilter(v as typeof serviceFilter)}>
          <SelectTrigger className="w-full sm:w-[190px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все услуги</SelectItem>
            <SelectItem value="PADEL_HOURS">Padel</SelectItem>
            <SelectItem value="GYM">Фитнес</SelectItem>
            <SelectItem value="TRAINING_HOURS">Тренировки</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={frozenFilter} onValueChange={(v) => setFrozenFilter(v as typeof frozenFilter)}>
          <SelectTrigger className="w-full sm:w-[190px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любая заморозка</SelectItem>
            <SelectItem value="frozen">Только замороженные</SelectItem>
            <SelectItem value="not_frozen">Без заморозки</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-10 w-full sm:w-auto" onClick={resetFilters} disabled={!hasCustomFilters}>
          <RotateCcw className="h-4 w-4" />
          Сбросить
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">Всего: {stats.total}</Badge>
        <Badge variant="secondary">Активные: {stats.active}</Badge>
        <Badge variant="secondary">Заморожены: {stats.frozen}</Badge>
        <Badge variant={stats.expiringSoon > 0 ? 'warning' : 'outline'}>
          Истекают за 7 дней: {stats.expiringSoon}
        </Badge>
      </div>

      <ViewModeToggle value={viewMode} onChange={setViewMode} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMemberships.length === 0 ? (
        <EmptyState
          title="Абонементы не найдены"
          description="Скорректируйте фильтры или очистите поиск"
          className="py-16"
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredMemberships.map((m) => {
            const expiringSoon = m.is_active && new Date(m.end_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            return (
              <article
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(ROUTES.CLIENT_DETAIL(m.user))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(ROUTES.CLIENT_DETAIL(m.user))
                  }
                }}
                className={cn(
                  'flex flex-col rounded-xl border bg-card text-card-foreground p-4 shadow-sm cursor-pointer transition hover:bg-muted/30',
                  expiringSoon && 'border-amber-500/30 bg-amber-500/5'
                )}
              >
                <div className="space-y-2">
                  <h3 className="text-base font-semibold leading-tight break-words">
                    {m.membership_type_name}
                  </h3>
                  <p className="text-sm text-muted-foreground break-words">{m.user_name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">{m.service_type_display}</Badge>
                    <ActiveBadge isActive={m.is_active} />
                    {m.is_frozen && <Badge variant="info" className="text-xs">Заморожен</Badge>}
                  </div>
                </div>

                <p className="mt-4 text-lg font-bold tracking-tight">
                  {formatMembershipBalance(m.hours_remaining, m.visits_remaining)}
                </p>

                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>
                    Начало: <span className="text-foreground font-medium">{formatDate(m.start_date)}</span>
                  </p>
                  <p>
                    Конец:{' '}
                    <span className={cn('font-medium', expiringSoon ? 'text-amber-700 dark:text-amber-300' : 'text-foreground')}>
                      {formatDate(m.end_date)}
                    </span>
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="border rounded-xl overflow-x-auto bg-card surface-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Услуга</TableHead>
                <TableHead>Начало</TableHead>
                <TableHead>Конец</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemberships.map((m) => {
                const expiringSoon = m.is_active && new Date(m.end_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                return (
                <TableRow
                  key={m.id}
                  className={cn('cursor-pointer hover:bg-muted/35', expiringSoon && 'bg-amber-500/5')}
                  onClick={() => navigate(ROUTES.CLIENT_DETAIL(m.user))}
                >
                  <TableCell className="font-medium">{m.user_name}</TableCell>
                  <TableCell>{m.membership_type_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{m.service_type_display}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(m.start_date)}</TableCell>
                  <TableCell className="text-sm">
                    <span className={cn(expiringSoon && 'text-amber-700 dark:text-amber-300 font-medium')}>
                      {formatDate(m.end_date)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatMembershipBalance(m.hours_remaining, m.visits_remaining)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ActiveBadge isActive={m.is_active} />
                      {m.is_frozen && <Badge variant="info" className="text-xs">Заморожен</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
