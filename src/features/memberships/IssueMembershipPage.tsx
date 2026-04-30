import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/shared/PageHeader'
import { ClientSearch } from '@/components/shared/ClientSearch'
import { PaymentMethodSelect } from '@/components/shared/PaymentMethodSelect'
import { getMembershipTypes, issueMembership } from '@/api/memberships'
import { formatMoney } from '@/utils/format'
import { formatDate } from '@/utils/date'
import { parseApiError } from '@/utils/error'
import { ROUTES } from '@/constants/routes'
import type { ClientUser } from '@/types/client'
import type { MembershipType } from '@/types/membership'

export function IssueMembershipPage() {
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientUser | null>(null)
  const [selectedType, setSelectedType] = useState<MembershipType | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [typeSearch, setTypeSearch] = useState('')

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['membership-types'],
    queryFn: getMembershipTypes,
  })

  const mutation = useMutation({
    mutationFn: () =>
      issueMembership({
        client_id: client!.id,
        membership_type_id: selectedType!.id,
        payment_method: paymentMethod as 'KASPI' | 'CARD' | 'CASH',
      }),
    onSuccess: (data) => {
      toast.success(
        `Абонемент выдан клиенту ${data.membership.user_name} до ${formatDate(data.membership.end_date)}`
      )
      navigate(ROUTES.MEMBERSHIPS)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const isSoldOut = (type: MembershipType) =>
    type.remaining_quantity !== null && type.remaining_quantity !== undefined && type.remaining_quantity === 0

  const canSubmit = !!client && !!selectedType && !!paymentMethod && !isSoldOut(selectedType)

  const activeTypes = useMemo(() => types.filter((t) => t.is_active), [types])
  const visibleTypes = useMemo(() => {
    const q = typeSearch.trim().toLowerCase()
    if (!q) return activeTypes
    return activeTypes.filter((t) => {
      const hay = [
        t.name,
        t.description ?? '',
        t.service_type_display || t.service_type,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [activeTypes, typeSearch])

  const submitHint = useMemo(() => {
    if (!client) return 'Сначала выберите клиента'
    if (!selectedType) return 'Выберите тип абонемента'
    if (selectedType && isSoldOut(selectedType)) return 'Выбранный абонемент закончился'
    return ''
  }, [client, selectedType])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Выдать абонемент"
        description="Поиск клиента, выбор типа и способа оплаты"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          {/* Step 1: Find client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Выберите клиента</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientSearch
                onSelect={setClient}
                selectedClient={client}
                onClear={() => setClient(null)}
              />
            </CardContent>
          </Card>

          {/* Step 2: Choose type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Выберите тип абонемента</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  placeholder="Поиск по названию или описанию типа..."
                  className="pl-9 h-10"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary">Активных типов: {activeTypes.length}</Badge>
                <Badge variant="secondary">Показано: {visibleTypes.length}</Badge>
              </div>

              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : visibleTypes.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  По вашему поиску типы абонементов не найдены.
                </div>
              ) : (
                <div className="grid gap-3">
                  {visibleTypes.map((type) => {
                    const soldOut = isSoldOut(type)
                    return (
                    <div
                      key={type.id}
                      onClick={() => !soldOut && setSelectedType(type)}
                      className={`border rounded-lg p-4 transition-all ${
                        soldOut
                          ? 'opacity-50 cursor-not-allowed bg-muted/20'
                          : selectedType?.id === type.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary cursor-pointer'
                          : 'hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{type.name}</p>
                            {type.includes_coach && (
                              <Badge variant="secondary" className="text-xs">Тренер включён</Badge>
                            )}
                            {soldOut && (
                              <Badge variant="destructive" className="text-xs">Распродано</Badge>
                            )}
                            {!soldOut && type.max_quantity != null && (
                              <Badge variant="outline" className="text-xs">
                                Осталось {type.remaining_quantity ?? type.max_quantity - type.issued_count} из {type.max_quantity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {type.service_type_display || type.service_type}
                            {type.total_hours && Number(type.total_hours) > 0 && ` · ${type.total_hours} ч`}
                            {` · ${type.days_valid} дней`}
                            {type.min_participants > 1 || type.max_participants > 1
                              ? ` · ${type.min_participants}–${type.max_participants} чел.`
                              : ''}
                          </p>
                          {type.priority_time_start && type.priority_time_end && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Приоритет: {type.priority_time_start.slice(0, 5)}–{type.priority_time_end.slice(0, 5)}
                              {Number(type.prime_time_surcharge) > 0 && (
                                <span className="text-amber-600 ml-1">
                                  · прайм-тайм +{formatMoney(type.prime_time_surcharge)}/ч
                                </span>
                              )}
                            </p>
                          )}
                          {type.description && (
                            <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg">{formatMoney(type.price)}</p>
                          {type.discount_on_court > 0 && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              −{type.discount_on_court}% на корт
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Оплата и проверка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <PaymentMethodSelect value={paymentMethod} onChange={setPaymentMethod} />
              </div>

              <div className="surface-elevated rounded-lg p-3 space-y-2">
                <p className="brand-label">перед выдачей</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p className="text-muted-foreground">
                    Клиент:{' '}
                    <span className="text-foreground font-medium">
                      {client ? `${client.first_name} ${client.last_name}` : 'не выбран'}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Тип:{' '}
                    <span className="text-foreground font-medium">{selectedType?.name ?? 'не выбран'}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Сумма:{' '}
                    <span className="text-foreground font-medium">
                      {selectedType ? formatMoney(selectedType.price) : '—'}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Срок действия:{' '}
                    <span className="text-foreground font-medium">
                      {selectedType ? `${selectedType.days_valid} дней` : '—'}
                    </span>
                  </p>
                </div>
                {submitHint && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {submitHint}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Отмена
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Выдать абонемент
            </Button>
          </div>
        </div>

        <div className="xl:sticky xl:top-20 space-y-4">
          <Card className="surface-elevated rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Сводка выдачи</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Клиент</span>
                <span className="font-medium text-right">
                  {client ? `${client.first_name} ${client.last_name}` : 'Не выбран'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Тариф</span>
                <span className="font-medium text-right">{selectedType?.name ?? 'Не выбран'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">К оплате</span>
                <span className="font-semibold">{selectedType ? formatMoney(selectedType.price) : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Срок</span>
                <span className="font-medium">{selectedType ? `${selectedType.days_valid} дней` : '—'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Подсказка ресепшну</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>1) Проверьте имя и телефон клиента перед выдачей.</p>
              <p>2) Убедитесь, что выбран правильный тип и срок действия.</p>
              <p>3) После успешной выдачи клиент появится в списке абонементов.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
