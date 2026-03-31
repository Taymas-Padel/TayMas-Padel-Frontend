import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Выдать абонемент"
        description="Поиск клиента, выбор типа и способа оплаты"
      />

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
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="grid gap-3">
              {types.filter((t) => t.is_active).map((type) => {
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
          <CardTitle className="text-base">3. Способ оплаты</CardTitle>
        </CardHeader>
        <CardContent className="max-w-xs">
          <PaymentMethodSelect value={paymentMethod} onChange={setPaymentMethod} />
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
  )
}
