import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, QrCode, Edit2, UserCheck, UserX, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { QrStatusBadge, BookingStatusBadge, PaymentBadge, ActiveBadge } from '@/components/shared/StatusBadge'
import { getClientDetail, userAction } from '@/api/clients'
import { getAllBookings } from '@/api/bookings'
import { getAllMemberships } from '@/api/memberships'
import { getTransactions } from '@/api/finance'
import { getInitials, formatMoney, fullName } from '@/utils/format'
import { formatDate, formatDatetime } from '@/utils/date'
import { parseApiError } from '@/utils/error'
import { usePermissions } from '@/hooks/usePermissions'
import type { ClientUser } from '@/types/client'
import { resolveMediaUrl } from '@/utils/media'

function formatMembershipBalance(hoursRemaining: string | null, visitsRemaining: number | null) {
  if (hoursRemaining != null) {
    const hours = Number(hoursRemaining)
    return Number.isFinite(hours) && hours <= 0 ? 'Закончился' : `${hoursRemaining} ч`
  }
  if (visitsRemaining != null) {
    return visitsRemaining <= 0 ? 'Закончился' : `${visitsRemaining} пос.`
  }
  return '—'
}

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasRole } = usePermissions()
  const canEdit = hasRole('ADMIN', 'RECEPTIONIST')

  const clientId = parseInt(id!)

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClientDetail(clientId),
    enabled: !!clientId,
  })

  // Detail endpoint may not return avatar — fall back to cached list data
  const cachedAvatar = qc
    .getQueriesData<ClientUser[]>({ queryKey: ['clients'] })
    .flatMap(([, data]) => data ?? [])
    .find((c) => c.id === clientId)?.avatar

  const avatarSrc = client?.avatar ?? cachedAvatar

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', { client_id: clientId }],
    queryFn: () => getAllBookings({ client_id: clientId }),
    enabled: !!clientId,
  })

  const { data: memberships = [] } = useQuery({
    queryKey: ['memberships', { client_id: clientId }],
    queryFn: () => getAllMemberships({ client_id: clientId }),
    enabled: !!clientId,
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', { user_id: clientId }],
    queryFn: () => getTransactions({ user_id: clientId }),
    enabled: !!clientId,
  })

  const actionMutation = useMutation({
    mutationFn: (params: { action: string; extra?: Record<string, string> }) =>
      userAction(clientId, params.action, params.extra),
    onSuccess: (_, vars) => {
      const messages: Record<string, string> = {
        unblock_qr: 'QR-код разблокирован',
        deactivate: 'Аккаунт деактивирован',
        activate: 'Аккаунт активирован',
        update_info: 'Данные обновлены',
      }
      toast.success(messages[vars.action] ?? 'Действие выполнено')
      if (vars.action === 'deactivate' || vars.action === 'activate') {
        const newActive = vars.action === 'activate'
        qc.setQueryData<ClientUser>(['client', clientId], (prev) =>
          prev ? { ...prev, is_active: newActive } : prev
        )
      } else {
        qc.invalidateQueries({ queryKey: ['client', clientId] })
      }
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  // Edit info dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editFirst, setEditFirst] = useState('')
  const [editLast, setEditLast] = useState('')

  function openEdit() {
    setEditFirst(client?.first_name ?? '')
    setEditLast(client?.last_name ?? '')
    setEditOpen(true)
  }

  function handleUpdateInfo() {
    actionMutation.mutate({
      action: 'update_info',
      extra: { first_name: editFirst, last_name: editLast },
    })
    setEditOpen(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!client) {
    return <div className="text-center py-12 text-muted-foreground">Клиент не найден</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">{fullName(client.first_name, client.last_name)}</h2>
      </div>

      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={resolveMediaUrl(avatarSrc)} alt="" className="object-cover" />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(client.first_name, client.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-semibold">
                  {fullName(client.first_name, client.last_name)}
                </h3>
                <Badge variant="outline">{client.role}</Badge>
                {client.is_active === false && (
                  <Badge variant="secondary" className="bg-destructive/15 text-destructive border-destructive/30">
                    Деактивирован
                  </Badge>
                )}
                <QrStatusBadge isBlocked={client.is_qr_blocked} />
              </div>
              <p className="text-muted-foreground">{client.phone_number}</p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>ELO: <strong className="text-foreground">{client.rating_elo}</strong></span>
                <span>С нами с: <strong className="text-foreground">{formatDate(client.created_at)}</strong></span>
              </div>
            </div>

            {canEdit && (
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Edit2 className="h-4 w-4" />
                  Редактировать
                </Button>
                {client.is_qr_blocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actionMutation.mutate({ action: 'unblock_qr' })}
                    disabled={actionMutation.isPending}
                  >
                    <QrCode className="h-4 w-4" />
                    Разблокировать QR
                  </Button>
                )}
                {client.role === 'CLIENT' && (
                  client.is_active === false ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => actionMutation.mutate({ action: 'activate' })}
                      disabled={actionMutation.isPending}
                    >
                      <UserCheck className="h-4 w-4" />
                      Активировать
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => actionMutation.mutate({ action: 'deactivate' })}
                      disabled={actionMutation.isPending}
                    >
                      <UserX className="h-4 w-4" />
                      Деактивировать
                    </Button>
                  )
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Брони ({bookings.length})</TabsTrigger>
          <TabsTrigger value="memberships">Абонементы ({memberships.length})</TabsTrigger>
          <TabsTrigger value="transactions">Транзакции ({transactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardContent className="p-0">
              {bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет бронирований</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Корт</TableHead>
                      <TableHead>Время</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Оплата</TableHead>
                      <TableHead>Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.court_name}</TableCell>
                        <TableCell className="text-sm">
                          {formatDatetime(b.start_time)}
                        </TableCell>
                        <TableCell><BookingStatusBadge status={b.status} /></TableCell>
                        <TableCell><PaymentBadge isPaid={b.is_paid} membershipUsed={b.membership_used} price={b.price} /></TableCell>
                        <TableCell>{formatMoney(b.price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memberships">
          <Card>
            <CardContent className="p-0">
              {memberships.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет абонементов</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тип</TableHead>
                      <TableHead>Начало</TableHead>
                      <TableHead>Конец</TableHead>
                      <TableHead>Остаток</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((m) => {
                      const balance = formatMembershipBalance(m.hours_remaining, m.visits_remaining)
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.membership_type_name}</TableCell>
                          <TableCell className="text-sm">{formatDate(m.start_date)}</TableCell>
                          <TableCell className="text-sm">{formatDate(m.end_date)}</TableCell>
                          <TableCell className="text-sm font-medium">{balance}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              <ActiveBadge isActive={m.is_active} />
                              {m.is_frozen && (
                                <Badge variant="info" className="text-xs">
                                  Заморожен
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет транзакций</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Способ оплаты</TableHead>
                      <TableHead>Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{t.created_at_formatted}</TableCell>
                        <TableCell>{t.transaction_type_label}</TableCell>
                        <TableCell>{t.payment_method_label}</TableCell>
                        <TableCell className="font-medium">{formatMoney(t.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать данные</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Фамилия</Label>
              <Input value={editLast} onChange={(e) => setEditLast(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Отмена</Button>
            <Button onClick={handleUpdateInfo} disabled={actionMutation.isPending}>
              {actionMutation.isPending && <Loader2 className="animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
