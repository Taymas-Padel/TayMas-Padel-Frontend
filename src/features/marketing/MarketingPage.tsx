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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { getPromos, createPromo, updatePromo, deletePromo } from '@/api/marketing'
import { formatDate } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { parseApiError } from '@/utils/error'
import type { MarketingPromo } from '@/types/court'

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  promo_code: z.string().optional(),
  discount_type: z.enum(['PERCENT', 'FIXED']),
  discount_value: z.string().min(1, 'Обязательное поле'),
  start_date: z.string().min(1, 'Обязательное поле'),
  end_date: z.string().min(1, 'Обязательное поле'),
  priority: z.number().min(0),
  is_active: z.boolean(),
  image_url: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface PromoFormDialogProps {
  promo: MarketingPromo | null
  open: boolean
  onClose: () => void
}

function PromoFormDialog({ promo, open, onClose }: PromoFormDialogProps) {
  const qc = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', promo_code: '', discount_type: 'PERCENT', discount_value: '', start_date: '', end_date: '', priority: 0, is_active: true, image_url: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: promo?.title ?? '',
        description: promo?.description ?? '',
        promo_code: promo?.promo_code ?? '',
        discount_type: promo?.discount_type ?? 'PERCENT',
        discount_value: promo?.discount_value ?? '',
        start_date: promo?.start_date ?? '',
        end_date: promo?.end_date ?? '',
        priority: promo?.priority ?? 0,
        is_active: promo?.is_active ?? true,
        image_url: promo?.image_url ?? '',
      })
    }
  }, [open, promo, reset])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        description: values.description || null,
        promo_code: values.promo_code || null,
        image_url: values.image_url || null,
      }
      return promo ? updatePromo(promo.id, payload) : createPromo(payload)
    },
    onSuccess: () => {
      toast.success(promo ? 'Акция обновлена' : 'Акция создана')
      qc.invalidateQueries({ queryKey: ['promos'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{promo ? 'Редактировать акцию' : 'Новая акция'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Заголовок *</Label>
            <Input {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Описание</Label>
            <Textarea {...register('description')} className="resize-none" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Тип скидки *</Label>
              <Select
                value={watch('discount_type')}
                onValueChange={(v) => setValue('discount_type', v as 'PERCENT' | 'FIXED')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Процент (%)</SelectItem>
                  <SelectItem value="FIXED">Фиксированная (₸)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Размер скидки *</Label>
              <Input {...register('discount_value')} placeholder="10" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Промокод</Label>
            <Input {...register('promo_code')} placeholder="SUMMER2025" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Начало *</Label>
              <Input type="date" {...register('start_date')} />
            </div>
            <div className="space-y-1">
              <Label>Конец *</Label>
              <Input type="date" {...register('end_date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Приоритет</Label>
              <Input
                type="number"
                min={0}
                {...register('priority', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label>URL изображения</Label>
              <Input {...register('image_url')} placeholder="https://..." />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={watch('is_active')}
              onCheckedChange={(v) => setValue('is_active', v)}
            />
            <Label>Активна</Label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
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

export function MarketingPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editPromo, setEditPromo] = useState<MarketingPromo | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['promos'],
    queryFn: getPromos,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePromo(id),
    onSuccess: () => {
      toast.success('Акция удалена')
      qc.invalidateQueries({ queryKey: ['promos'] })
      setDeleteId(null)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Маркетинг"
          description="Акции и промокоды"
          actions={
            <Button onClick={() => { setEditPromo(null); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Новая акция
            </Button>
          }
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заголовок</TableHead>
                  <TableHead>Скидка</TableHead>
                  <TableHead>Промокод</TableHead>
                  <TableHead>Период</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {p.discount_type === 'PERCENT'
                          ? `${p.discount_value}%`
                          : formatMoney(p.discount_value)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {p.promo_code ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(p.start_date)} — {formatDate(p.end_date)}
                    </TableCell>
                    <TableCell><ActiveBadge isActive={p.is_active} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditPromo(p); setFormOpen(true) }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(p.id)}
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

      <PromoFormDialog promo={editPromo} open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить акцию?"
        description="Это действие нельзя отменить."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDestructive
      />
    </>
  )
}
