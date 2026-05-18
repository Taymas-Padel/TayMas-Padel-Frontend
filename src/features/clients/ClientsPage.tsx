import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserPlus, UserX, RotateCcw } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { QrStatusBadge } from '@/components/shared/StatusBadge'
import { Toolbar, ToolbarSearch, ToolbarGroup, ToolbarActions } from '@/components/ui/toolbar'
import { Drawer, DrawerContent, DrawerSection } from '@/components/ui/drawer'
import { getClients, getClientDetail } from '@/api/clients'
import { useDebounce } from '@/hooks/useDebounce'
import { getInitials } from '@/utils/format'
import { formatDate } from '@/utils/date'
import { resolveMediaUrl } from '@/utils/media'
import { cn } from '@/utils/cn'
import type { ClientUser } from '@/types/client'

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Клиент',
  COACH_PADEL: 'Тренер Padel',
  COACH_FITNESS: 'Тренер Fitness',
}

/**
 * Clients Page per spec:
 * - Toolbar with search + filters
 * - Compact table (40px rows, 13px font)
 * - 28px avatars with initials
 * - Drawer opens on click (not navigation)
 */
export function ClientsPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string>('CLIENT')
  const [activeFilter, setActiveFilter] = useState<'_all' | 'active' | 'inactive'>('_all')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', { search: debouncedSearch, role }],
    queryFn: () => getClients({
      search: debouncedSearch || undefined,
      role: role === '_all' ? undefined : role || undefined,
    }),
    staleTime: 30 * 1000,
  })

  const { data: selectedClient, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: () => selectedClientId ? getClientDetail(selectedClientId) : null,
    enabled: !!selectedClientId,
  })

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (activeFilter === 'active' && client.is_active === false) return false
      if (activeFilter === 'inactive' && client.is_active !== false) return false
      return true
    })
  }, [clients, activeFilter])

  function resetFilters() {
    setActiveFilter('_all')
    setRole('CLIENT')
    setSearch('')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Клиенты"
        description={isLoading ? 'Загрузка...' : `${filteredClients.length} записей`}
        actions={
          <Button onClick={() => {/* TODO: open add client modal */}}>
            <UserPlus className="h-4 w-4" />
            Добавить
          </Button>
        }
      />

      <Toolbar>
        <ToolbarSearch
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени, телефону..."
        />
        <ToolbarGroup>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-36 h-9 text-[13px]">
              <SelectValue placeholder="Все роли" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLIENT">Клиенты</SelectItem>
              <SelectItem value="COACH_PADEL">Тренеры Padel</SelectItem>
              <SelectItem value="COACH_FITNESS">Тренеры Fitness</SelectItem>
              <SelectItem value="_all">Все</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
            <SelectTrigger className="w-40 h-9 text-[13px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Все</SelectItem>
              <SelectItem value="active">Активные</SelectItem>
              <SelectItem value="inactive">Деактивированные</SelectItem>
            </SelectContent>
          </Select>
        </ToolbarGroup>
        <ToolbarActions>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
            <RotateCcw className="h-4 w-4" />
            Сбросить
          </Button>
        </ToolbarActions>
      </Toolbar>

      <div className="surface overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <EmptyState
            icon={<UserX className="h-6 w-6" />}
            title="Клиенты не найдены"
            description="Попробуйте изменить фильтры поиска"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Клиент</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>QR</TableHead>
                <TableHead className="text-right">ELO</TableHead>
                <TableHead className="text-right">Регистрация</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className={cn(
                    'cursor-pointer',
                    selectedClientId === client.id && 'bg-muted'
                  )}
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={resolveMediaUrl(client.avatar)} alt="" className="object-cover" />
                        <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                          {getInitials(client.first_name, client.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {client.first_name} {client.last_name}
                        </p>
                        {!client.is_profile_complete && (
                          <p className="text-[11px] text-muted-foreground">Профиль не заполнен</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{client.phone_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px]">
                      {ROLE_LABELS[client.role] ?? client.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <QrStatusBadge isBlocked={client.is_qr_blocked} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{client.rating_elo}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(client.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Client Detail Drawer */}
      <Drawer
        open={!!selectedClientId}
        onOpenChange={(open) => !open && setSelectedClientId(null)}
        title={selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : 'Загрузка...'}
      >
        {isLoadingClient ? (
          <DrawerContent>
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </DrawerContent>
        ) : selectedClient ? (
          <ClientDetailContent client={selectedClient} />
        ) : null}
      </Drawer>
    </div>
  )
}

function ClientDetailContent({ client }: { client: ClientUser }) {
  return (
    <>
      <DrawerContent className="border-b border-border">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={resolveMediaUrl(client.avatar)} className="object-cover" />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {getInitials(client.first_name, client.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold">{client.first_name} {client.last_name}</h3>
            <p className="text-sm text-muted-foreground">{client.phone_number}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1">
            Позвонить
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            WhatsApp
          </Button>
        </div>
      </DrawerContent>

      <DrawerSection title="Статистика">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-background border border-border">
            <p className="text-caption">ELO</p>
            <p className="text-lg font-semibold tabular-nums">{client.rating_elo}</p>
          </div>
          <div className="p-3 rounded-md bg-background border border-border">
            <p className="text-caption">QR статус</p>
            <QrStatusBadge isBlocked={client.is_qr_blocked} />
          </div>
        </div>
      </DrawerSection>

      <DrawerSection title="Информация">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Роль</dt>
            <dd>{ROLE_LABELS[client.role] ?? client.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Регистрация</dt>
            <dd>{formatDate(client.created_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Профиль</dt>
            <dd>{client.is_profile_complete ? 'Заполнен' : 'Не заполнен'}</dd>
          </div>
        </dl>
      </DrawerSection>
    </>
  )
}
