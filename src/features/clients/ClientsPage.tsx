import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, UserX, RotateCcw, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/PageHeader'
import { ViewModeToggle, type ViewMode } from '@/components/shared/ViewModeToggle'
import { EmptyState } from '@/components/shared/EmptyState'
import { QrStatusBadge, ActiveBadge } from '@/components/shared/StatusBadge'
import { getClientDetail, getClients, mobileLogin, searchByPhone, sendMobileCode, userAction } from '@/api/clients'
import { useDebounce } from '@/hooks/useDebounce'
import { getInitials } from '@/utils/format'
import { formatDate } from '@/utils/date'
import { ROUTES } from '@/constants/routes'
import { resolveMediaUrl } from '@/utils/media'
import { parseApiError } from '@/utils/error'

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Клиент',
  COACH_PADEL: 'Тренер Padel',
  COACH_FITNESS: 'Тренер Fitness',
}

export function ClientsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string>('CLIENT')
  const [activeFilter, setActiveFilter] = useState<'_all' | 'active' | 'inactive'>('_all')
  const [qrFilter, setQrFilter] = useState<'_all' | 'blocked' | 'unblocked'>('_all')
  const [profileFilter, setProfileFilter] = useState<'_all' | 'complete' | 'incomplete'>('_all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [normalizedPhone, setNormalizedPhone] = useState('')
  const [showCodeStep, setShowCodeStep] = useState(false)
  const [showNameStep, setShowNameStep] = useState(false)
  const [code, setCode] = useState('')
  const [newUserId, setNewUserId] = useState<number | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const debouncedSearch = useDebounce(search, 400)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', { search: debouncedSearch, role }],
    queryFn: () => getClients({
      search: debouncedSearch || undefined,
      role: role === '_all' ? undefined : role || undefined,
    }),
  })

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (activeFilter === 'active' && client.is_active === false) return false
      if (activeFilter === 'inactive' && client.is_active !== false) return false

      if (qrFilter === 'blocked' && !client.is_qr_blocked) return false
      if (qrFilter === 'unblocked' && client.is_qr_blocked) return false

      if (profileFilter === 'complete' && !client.is_profile_complete) return false
      if (profileFilter === 'incomplete' && client.is_profile_complete) return false

      return true
    })
  }, [clients, activeFilter, qrFilter, profileFilter])

  const counters = useMemo(() => {
    return {
      active: filteredClients.filter((c) => c.is_active !== false).length,
      inactive: filteredClients.filter((c) => c.is_active === false).length,
      blockedQr: filteredClients.filter((c) => c.is_qr_blocked).length,
      incompleteProfiles: filteredClients.filter((c) => !c.is_profile_complete).length,
    }
  }, [filteredClients])

  function resetFilters() {
    setActiveFilter('_all')
    setQrFilter('_all')
    setProfileFilter('_all')
  }

  function resetAddClientFlow() {
    setPhoneInput('')
    setNormalizedPhone('')
    setShowCodeStep(false)
    setShowNameStep(false)
    setCode('')
    setNewUserId(null)
    setFirstName('')
    setLastName('')
  }

  function normalizePhone(value: string): string | null {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`
    if (digits.length === 10) return `+7${digits}`
    if (digits.length === 12 && digits.startsWith('77')) return `+${digits.slice(1)}`
    return null
  }

  const findByPhoneMutation = useMutation({
    mutationFn: async (rawPhone: string) => {
      const phone = normalizePhone(rawPhone)
      if (!phone) throw new Error('Введите номер в формате +7700...')
      const existing = await searchByPhone(phone)
      return { existing, phone }
    },
    onSuccess: ({ existing, phone }) => {
      if (existing.length > 0) {
        const existingId = existing[0].id
        toast.success('Клиент уже существует. Открываю карточку.')
        setIsAddOpen(false)
        resetAddClientFlow()
        navigate(ROUTES.CLIENT_DETAIL(existingId))
        return
      }
      setNormalizedPhone(phone)
      sendCodeMutation.mutate(phone)
    },
    onError: (error) => toast.error(parseApiError(error)),
  })

  const sendCodeMutation = useMutation({
    mutationFn: (phone: string) => sendMobileCode(phone),
    onSuccess: () => {
      setShowCodeStep(true)
      toast.success('Код отправлен по SMS')
    },
    onError: (error: unknown) => {
      const fallback = parseApiError(error)
      const message = String(fallback).includes('429')
        ? 'Слишком много попыток, попробуйте позже'
        : fallback
      toast.error(message)
    },
  })

  const verifyCodeMutation = useMutation({
    mutationFn: () =>
      mobileLogin({
        phone_number: normalizedPhone,
        code,
        device_id: 'crm-reception-web-v1',
      }),
    onSuccess: async (data) => {
      setNewUserId(data.user_id)
      if (data.is_profile_complete) {
        toast.success('Клиент добавлен')
        setIsAddOpen(false)
        resetAddClientFlow()
        await qc.invalidateQueries({ queryKey: ['clients'] })
        navigate(ROUTES.CLIENT_DETAIL(data.user_id))
        return
      }
      setShowNameStep(true)
      toast.success('Код подтвержден. Заполните имя и фамилию')
    },
    onError: (error: unknown) => {
      const fallback = parseApiError(error)
      const message = String(fallback).includes('429')
        ? 'Слишком много попыток, попробуйте позже'
        : fallback
      toast.error(message)
    },
  })

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!newUserId) throw new Error('Не удалось определить клиента')
      await userAction(newUserId, 'update_info', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      return getClientDetail(newUserId)
    },
    onSuccess: async (client) => {
      await qc.invalidateQueries({ queryKey: ['clients'] })
      await qc.invalidateQueries({ queryKey: ['client', client.id] })
      toast.success('Клиент добавлен')
      setIsAddOpen(false)
      resetAddClientFlow()
      navigate(ROUTES.CLIENT_DETAIL(client.id))
    },
    onError: (error) => toast.error(parseApiError(error)),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="База клиентов"
        description={isLoading ? 'Загрузка...' : `${filteredClients.length} из ${clients.length} записей`}
        actions={(
          <Button
            type="button"
            onClick={() => setIsAddOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Добавить клиента
          </Button>
        )}
      />

      <div className="surface-elevated rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-sm min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full sm:w-44 h-10">
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
          <SelectTrigger className="w-full sm:w-44 h-10">
            <SelectValue placeholder="Статус аккаунта" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Все аккаунты</SelectItem>
            <SelectItem value="active">Только активные</SelectItem>
            <SelectItem value="inactive">Только деактивированные</SelectItem>
          </SelectContent>
        </Select>
        <Select value={qrFilter} onValueChange={(v) => setQrFilter(v as typeof qrFilter)}>
          <SelectTrigger className="w-full sm:w-40 h-10">
            <SelectValue placeholder="QR статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Любой QR</SelectItem>
            <SelectItem value="unblocked">QR активен</SelectItem>
            <SelectItem value="blocked">QR заблокирован</SelectItem>
          </SelectContent>
        </Select>
        <Select value={profileFilter} onValueChange={(v) => setProfileFilter(v as typeof profileFilter)}>
          <SelectTrigger className="w-full sm:w-44 h-10">
            <SelectValue placeholder="Профиль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Любой профиль</SelectItem>
            <SelectItem value="complete">Профиль заполнен</SelectItem>
            <SelectItem value="incomplete">Профиль не заполнен</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" className="h-10 w-full sm:w-auto" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          Сбросить
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary">Активные: {counters.active}</Badge>
        <Badge variant="secondary">Деактивированы: {counters.inactive}</Badge>
        <Badge variant="secondary">QR заблокирован: {counters.blockedQr}</Badge>
        <Badge variant="secondary">Незаполненный профиль: {counters.incompleteProfiles}</Badge>
      </div>

      <ViewModeToggle value={viewMode} onChange={setViewMode} />

      {isLoading ? (
        <div className="p-6 space-y-3 surface-elevated rounded-xl">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={<UserX className="h-10 w-10" />}
          title="Клиенты не найдены"
          description="Попробуйте изменить фильтры поиска"
          className="py-16"
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredClients.map((client) => (
            <article
              key={client.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(ROUTES.CLIENT_DETAIL(client.id))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(ROUTES.CLIENT_DETAIL(client.id))
                }
              }}
              className="flex flex-col rounded-xl border bg-card text-card-foreground p-4 shadow-sm cursor-pointer transition hover:bg-muted/30"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={resolveMediaUrl(client.avatar)} alt="" className="object-cover" />
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {getInitials(client.first_name, client.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="text-base font-semibold leading-tight break-words">
                    {client.first_name} {client.last_name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[client.role] ?? client.role}
                    </Badge>
                    <ActiveBadge isActive={client.is_active !== false} />
                    <QrStatusBadge isBlocked={client.is_qr_blocked} />
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <p className="text-muted-foreground break-all">
                  Тел.: <span className="text-foreground font-medium tabular-nums">{client.phone_number}</span>
                </p>
                <p className="text-muted-foreground">
                  ELO: <span className="text-foreground font-medium tabular-nums">{client.rating_elo}</span>
                </p>
                <p className="text-muted-foreground">
                  Регистрация:{' '}
                  <span className="text-foreground font-medium">{formatDate(client.created_at)}</span>
                </p>
                {!client.is_profile_complete && (
                  <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                    Профиль не заполнен
                  </p>
                )}
              </div>

              <div className="mt-auto pt-3 mt-4 border-t">
                <span className="text-sm font-medium text-foreground">Открыть карточку</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Card className="surface-elevated rounded-xl overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
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
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => navigate(ROUTES.CLIENT_DETAIL(client.id))}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={resolveMediaUrl(client.avatar)} alt="" className="object-cover" />
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {getInitials(client.first_name, client.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {client.first_name} {client.last_name}
                          </p>
                          {!client.is_profile_complete && (
                            <p className="text-[11px] text-amber-600">Профиль не заполнен</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{client.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[client.role] ?? client.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <QrStatusBadge isBlocked={client.is_qr_blocked} />
                    </TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">{client.rating_elo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(client.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={isAddOpen}
        onOpenChange={(next) => {
          setIsAddOpen(next)
          if (!next) resetAddClientFlow()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить клиента по номеру</DialogTitle>
            <DialogDescription>
              Поиск по номеру, SMS-подтверждение и заполнение имени/фамилии.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-client-phone">Номер телефона</Label>
              <Input
                id="new-client-phone"
                placeholder="+77001234567"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                disabled={findByPhoneMutation.isPending || sendCodeMutation.isPending || showCodeStep}
              />
            </div>

            {!showCodeStep && (
              <Button
                type="button"
                onClick={() => findByPhoneMutation.mutate(phoneInput)}
                disabled={findByPhoneMutation.isPending || sendCodeMutation.isPending || !phoneInput.trim()}
              >
                {(findByPhoneMutation.isPending || sendCodeMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                Найти / отправить код
              </Button>
            )}

            {showCodeStep && (
              <div className="space-y-2">
                <Label htmlFor="new-client-code">Код из SMS</Label>
                <Input
                  id="new-client-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                {!showNameStep && (
                  <Button
                    type="button"
                    onClick={() => verifyCodeMutation.mutate()}
                    disabled={verifyCodeMutation.isPending || code.length < 4}
                  >
                    {verifyCodeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Подтвердить код
                  </Button>
                )}
              </div>
            )}

            {showNameStep && (
              <div className="space-y-3 border rounded-lg p-3">
                <p className="text-sm font-medium">Заполните данные клиента</p>
                <div className="space-y-2">
                  <Label htmlFor="new-client-first-name">Имя</Label>
                  <Input
                    id="new-client-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Имя"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-client-last-name">Фамилия</Label>
                  <Input
                    id="new-client-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Фамилия"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsAddOpen(false)}>
              Отмена
            </Button>
            {showNameStep && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending || !firstName.trim() || !lastName.trim()}
              >
                {saveProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Создать клиента
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
