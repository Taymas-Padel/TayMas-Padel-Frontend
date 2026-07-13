import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { ViewModeToggle, type ViewMode } from '@/components/shared/ViewModeToggle'
import {
  getMembershipTypesManage,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
} from '@/api/memberships'
import { formatMoney } from '@/utils/format'
import { parseApiError } from '@/utils/error'
import type { MembershipType, MembershipServiceType } from '@/types/membership'

const SERVICE_TYPE_LABELS: Record<MembershipServiceType, string> = {
  PADEL_HOURS: 'Падел (Пакет часов)',
  GYM: 'Фитнес',
  TRAINING_HOURS: 'Тренировки с тренером',
  VIP: 'VIP',
}

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  service_type: z.enum(['PADEL_HOURS', 'GYM', 'TRAINING_HOURS', 'VIP']),
  price: z.string().min(1, 'Обязательное поле'),
  days_valid: z.coerce.number().min(1, 'Минимум 1 день'),
  description: z.string().optional(),
  total_hours: z.string().optional(),
  priority_time_start: z.string().optional(),
  priority_time_end: z.string().optional(),
  prime_time_surcharge: z.coerce.number().min(0).optional(),
  min_participants: z.coerce.number().min(1).optional(),
  max_participants: z.coerce.number().min(1).optional(),
  includes_coach: z.boolean().optional(),
  discount_on_court: z.coerce.number().min(0).max(100),
  max_quantity: z.coerce.number().min(0).optional().nullable(),
  is_active: z.boolean(),
}).superRefine((data, ctx) => {
  if ((data.service_type === 'PADEL_HOURS' || data.service_type === 'TRAINING_HOURS') &&
      (!data.total_hours || data.total_hours.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Укажите кол-во часов', path: ['total_hours'] })
  }
})

type FormValues = z.infer<typeof schema>

interface TypeFormDialogProps {
  type: MembershipType | null
  open: boolean
  onClose: () => void
}

function TypeFormDialog({ type, open, onClose }: TypeFormDialogProps) {
  const qc = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      service_type: 'PADEL_HOURS',
      price: '',
      days_valid: 30,
      description: '',
      total_hours: '',
      priority_time_start: '06:00',
      priority_time_end: '15:00',
      prime_time_surcharge: 0,
      min_participants: 1,
      max_participants: 4,
      includes_coach: false,
      discount_on_court: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: type?.name ?? '',
        service_type: type?.service_type ?? 'PADEL_HOURS',
        price: type?.price ?? '',
        days_valid: type?.days_valid ?? 30,
        description: type?.description ?? '',
        total_hours: type?.total_hours ?? '',
        priority_time_start: type?.priority_time_start?.slice(0, 5) ?? '06:00',
        priority_time_end: type?.priority_time_end?.slice(0, 5) ?? '15:00',
        prime_time_surcharge: Number(type?.prime_time_surcharge ?? 0),
        min_participants: type?.min_participants ?? 1,
        max_participants: type?.max_participants ?? 4,
        includes_coach: type?.includes_coach ?? false,
        discount_on_court: type?.discount_on_court ?? 0,
        max_quantity: type?.max_quantity ?? null,
        is_active: type?.is_active ?? true,
      })
    }
  }, [open, type, reset])

  const serviceType = watch('service_type')
  const hasHours = serviceType === 'PADEL_HOURS' || serviceType === 'TRAINING_HOURS'

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        service_type: values.service_type,
        price: values.price.trim().replace(/\s/g, '') || '0',
        days_valid: Number(values.days_valid),
        description: values.description?.trim() || null,
        discount_on_court: Number(values.discount_on_court),
        is_active: values.is_active,
        min_participants: Number(values.min_participants ?? 1),
        max_participants: Number(values.max_participants ?? 4),
        max_quantity: values.max_quantity ? Number(values.max_quantity) : null,
      }

      if (hasHours) {
        payload.total_hours = values.total_hours?.trim() || '0'
        payload.total_visits = 0
        payload.priority_time_start = values.priority_time_start || null
        payload.priority_time_end = values.priority_time_end || null
        payload.prime_time_surcharge = values.service_type === 'PADEL_HOURS'
          ? Number(values.prime_time_surcharge ?? 0)
          : 0
      }

      if (serviceType === 'PADEL_HOURS') {
        payload.prime_time_surcharge = Number(values.prime_time_surcharge ?? 0)
      }

      if (serviceType === 'TRAINING_HOURS') {
        payload.includes_coach = values.includes_coach ?? true
        payload.prime_time_surcharge = 0
      }

      if (serviceType === 'GYM' || serviceType === 'VIP') {
        payload.total_hours = '0'
        payload.total_visits = 0
        payload.priority_time_start = null
        payload.priority_time_end = null
        payload.prime_time_surcharge = '0'
        payload.includes_coach = false
      }

      return type
        ? updateMembershipType(type.id, payload as Partial<MembershipType>)
        : createMembershipType(payload as Omit<MembershipType, 'id'>)
    },
    onSuccess: () => {
      toast.success(type ? 'Тип обновлён' : 'Тип создан')
      qc.invalidateQueries({ queryKey: ['membership-types-manage'] })
      reset()
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{type ? 'Редактировать тип' : 'Новый тип абонемента'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Название *</Label>
            <Input {...register('name')} placeholder="Пакет 8 часов" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Тип услуги *</Label>
              <Select
                value={watch('service_type')}
                onValueChange={(v) => setValue('service_type', v as MembershipServiceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Цена *</Label>
              <Input {...register('price')} placeholder="128000" />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Дней действия *</Label>
              <Input {...register('days_valid')} type="number" placeholder="30" />
              {errors.days_valid && <p className="text-xs text-destructive">{errors.days_valid.message}</p>}
            </div>
            {hasHours && (
              <div className="space-y-1">
                <Label>Кол-во часов *</Label>
                <Input {...register('total_hours')} placeholder="8" />
                {errors.total_hours && <p className="text-xs text-destructive">{errors.total_hours.message}</p>}
              </div>
            )}
          </div>

          {hasHours && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Приоритетное время с</Label>
                <Input {...register('priority_time_start')} type="time" />
              </div>
              <div className="space-y-1">
                <Label>Приоритетное время до</Label>
                <Input {...register('priority_time_end')} type="time" />
              </div>
            </div>
          )}

          {serviceType === 'PADEL_HOURS' && (
            <div className="space-y-1">
              <Label>Доплата за прайм-тайм (₸/час)</Label>
              <Input {...register('prime_time_surcharge')} type="number" min="0" placeholder="4000" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Мин. участников</Label>
              <Input {...register('min_participants')} type="number" min="1" placeholder="1" />
            </div>
            <div className="space-y-1">
              <Label>Макс. участников</Label>
              <Input {...register('max_participants')} type="number" min="1" placeholder="4" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Скидка на корт (%)</Label>
              <Input {...register('discount_on_court')} type="number" min="0" max="100" placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Лимит продаж (необяз.)</Label>
              <Input {...register('max_quantity')} type="number" min="1" placeholder="Без лимита" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Описание</Label>
            <Input {...register('description')} placeholder="Описание тарифа" />
          </div>

          {serviceType === 'TRAINING_HOURS' && (
            <div className="flex items-center gap-3">
              <Switch
                checked={watch('includes_coach') ?? false}
                onCheckedChange={(v) => setValue('includes_coach', v)}
              />
              <Label>Тренер включён в пакет</Label>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch
              checked={watch('is_active')}
              onCheckedChange={(v) => setValue('is_active', v)}
            />
            <Label>Активен</Label>
          </div>

          <div className="flex gap-2 justify-end pt-2 flex-col-reverse sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Отмена</Button>
            <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MembershipTypesPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editType, setEditType] = useState<MembershipType | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['membership-types-manage'],
    queryFn: getMembershipTypesManage,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteMembershipType(id),
    onSuccess: () => {
      toast.success('Тип абонемента удалён')
      qc.invalidateQueries({ queryKey: ['membership-types-manage'] })
      setDeleteId(null)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Типы абонементов"
          description="Управление тарифами и типами абонементов"
          actions={
            <Button onClick={() => { setEditType(null); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Добавить тип
            </Button>
          }
        />

        <ViewModeToggle value={viewMode} onChange={setViewMode} />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'cards' ? (
          types.length === 0 ? (
            <div className="rounded-lg border py-8 text-center text-sm text-muted-foreground">
              Нет типов абонементов
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {types.map((t) => {
                const volume =
                  t.total_hours && Number(t.total_hours) > 0
                    ? `${t.total_hours} ч`
                    : t.total_visits > 0
                      ? `${t.total_visits} вис.`
                      : '—'

                return (
                  <article
                    key={t.id}
                    className="flex flex-col rounded-xl border bg-card text-card-foreground p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <h3 className="text-base font-semibold leading-tight break-words">
                          {t.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {t.service_type_display || SERVICE_TYPE_LABELS[t.service_type]}
                          </Badge>
                          {t.includes_coach && (
                            <Badge variant="secondary" className="text-xs">Тренер</Badge>
                          )}
                          <ActiveBadge isActive={t.is_active} />
                        </div>
                      </div>
                    </div>

                    <p className="mt-4 text-xl font-bold tracking-tight">{formatMoney(t.price)}</p>

                    <div className="mt-3 space-y-1.5 text-sm">
                      <p className="text-muted-foreground">
                        Срок: <span className="text-foreground font-medium">{t.days_valid} д.</span>
                      </p>
                      <p className="text-muted-foreground">
                        Объём: <span className="text-foreground font-medium">{volume}</span>
                      </p>
                      {t.description && (
                        <p className="text-muted-foreground line-clamp-2">{t.description}</p>
                      )}
                      {t.max_quantity != null && (
                        <p className="text-muted-foreground">
                          Лимит:{' '}
                          <span className={t.remaining_quantity === 0 ? 'text-destructive font-medium' : 'text-foreground font-medium'}>
                            {t.remaining_quantity ?? t.max_quantity - t.issued_count}/{t.max_quantity}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-end gap-2 border-t pt-3 mt-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 sm:h-8 sm:w-8"
                        onClick={() => { setEditType(t); setFormOpen(true) }}
                      >
                        <Edit2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 sm:h-8 sm:w-8 text-destructive"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип услуги</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Дней</TableHead>
                  <TableHead>Объём</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Лимит</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <div>
                        {t.name}
                        {t.includes_coach && (
                          <Badge variant="secondary" className="ml-2 text-xs">Тренер</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.service_type_display || SERVICE_TYPE_LABELS[t.service_type]}</Badge>
                    </TableCell>
                    <TableCell>{formatMoney(t.price)}</TableCell>
                    <TableCell>{t.days_valid} д.</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.total_hours && Number(t.total_hours) > 0
                        ? `${t.total_hours} ч`
                        : t.total_visits > 0
                        ? `${t.total_visits} вис.`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.priority_time_start && t.priority_time_end
                        ? `${t.priority_time_start.slice(0, 5)}–${t.priority_time_end.slice(0, 5)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.max_quantity != null
                        ? <span className={t.remaining_quantity === 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {t.remaining_quantity ?? t.max_quantity - t.issued_count}/{t.max_quantity}
                          </span>
                        : <span className="text-muted-foreground">∞</span>}
                    </TableCell>
                    <TableCell><ActiveBadge isActive={t.is_active} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditType(t); setFormOpen(true) }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <TypeFormDialog
        type={editType}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить тип абонемента?"
        description="Это действие нельзя отменить. Убедитесь, что нет активных абонементов этого типа."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDestructive
      />
    </>
  )
}
