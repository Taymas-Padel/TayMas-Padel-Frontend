import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, UserX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { QrStatusBadge } from '@/components/shared/StatusBadge'
import { getClients } from '@/api/clients'
import { useDebounce } from '@/hooks/useDebounce'
import { getInitials } from '@/utils/format'
import { formatDate } from '@/utils/date'
import { ROUTES } from '@/constants/routes'

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Клиент',
  COACH_PADEL: 'Тренер Padel',
  COACH_FITNESS: 'Тренер Fitness',
}

export function ClientsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string>('CLIENT')
  const debouncedSearch = useDebounce(search, 400)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', { search: debouncedSearch, role }],
    queryFn: () => getClients({
      search: debouncedSearch || undefined,
      role: role === '_all' ? undefined : role || undefined,
    }),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="База клиентов" description={`${clients.length} записей`} />

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все роли" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENT">Клиенты</SelectItem>
            <SelectItem value="COACH_PADEL">Тренеры Padel</SelectItem>
            <SelectItem value="COACH_FITNESS">Тренеры Fitness</SelectItem>
            <SelectItem value="_all">Все</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<UserX className="h-10 w-10" />}
              title="Клиенты не найдены"
              description="Попробуйте изменить фильтры поиска"
              className="py-16"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>QR</TableHead>
                  <TableHead>ELO</TableHead>
                  <TableHead>Регистрация</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => navigate(ROUTES.CLIENT_DETAIL(client.id))}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={client.avatar ?? undefined} alt="" className="object-cover" />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(client.first_name, client.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {client.first_name} {client.last_name}
                          </p>
                          {!client.is_profile_complete && (
                            <p className="text-xs text-amber-600">Профиль не заполнен</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{client.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[client.role] ?? client.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <QrStatusBadge isBlocked={client.is_qr_blocked} />
                    </TableCell>
                    <TableCell className="text-sm">{client.rating_elo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(client.created_at)}
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
