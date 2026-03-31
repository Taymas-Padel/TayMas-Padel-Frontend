import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Loader2, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { getServicesManage, createService, updateService, deleteService } from '@/api/services'
import { formatMoney } from '@/utils/format'
import { parseApiError } from '@/utils/error'
import { cn } from '@/utils/cn'
import type { Service, ServiceGroup, ServiceCategory } from '@/types/court'

const GROUP_LABELS: Record<ServiceGroup, string> = {
  PADEL: 'Падел',
  GYM: 'Фитнес',
  RECOVERY: 'Recovery',
  SPORT_BAR: 'Спорт-бар',
  OTHER: 'Прочее',
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  INVENTORY: 'Инвентарь',
  SERVICE: 'Услуга',
  FOOD: 'Еда',
  DRINK: 'Напиток',
  EVENT: 'Мероприятие',
}

const GROUP_FILTER_TABS: { value: ServiceGroup | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'PADEL', label: 'Падел' },
  { value: 'GYM', label: 'Фитнес' },
  { value: 'RECOVERY', label: 'Recovery' },
  { value: 'SPORT_BAR', label: 'Спорт-бар' },
  { value: 'OTHER', label: 'Прочее' },
]

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  price: z.string().min(1, 'Обязательное поле'),
  group: z.enum(['PADEL', 'GYM', 'RECOVERY', 'SPORT_BAR', 'OTHER']),
  category: z.enum(['INVENTORY', 'SERVICE', 'FOOD', 'DRINK', 'EVENT']),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface ServiceFormDialogProps {
  service: Service | null
  open: boolean
  onClose: () => void
}

function ServiceFormDialog({ service, open, onClose }: ServiceFormDialogProps) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', price: '', group: 'PADEL', category: 'INVENTORY', is_active: true },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: service?.name ?? '',
        description: service?.description ?? '',
        price: service?.price ?? '',
        group: service?.group ?? 'PADEL',
        category: service?.category ?? 'INVENTORY',
        is_active: service?.is_active ?? true,
      })
      setImageFile(null)
      setImagePreview(service?.image ?? null)
    }
  }, [open, service, reset])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const fd = new FormData()
      fd.append('name', values.name.trim())
      fd.append('price', values.price.trim())
      fd.append('group', values.group)
      fd.append('category', values.category)
      fd.append('description', values.description?.trim() ?? '')
      fd.append('is_active', String(values.is_active))
      if (imageFile) fd.append('image', imageFile)
      // When editing and image was cleared (preview null, no new file)
      if (service && !imageFile && !imagePreview) fd.append('image', '')
      return service ? updateService(service.id, fd) : createService(fd)
    },
    onSuccess: () => {
      toast.success(service ? 'Услуга обновлена' : 'Услуга создана')
      qc.invalidateQueries({ queryKey: ['services-manage'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? 'Редактировать услугу' : 'Новая услуга'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Название *</Label>
            <Input {...register('name')} placeholder="Ракетка, Массаж..." />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Группа *</Label>
              <Select
                value={watch('group')}
                onValueChange={(v) => setValue('group', v as ServiceGroup)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUP_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Категория *</Label>
              <Select
                value={watch('category')}
                onValueChange={(v) => setValue('category', v as ServiceCategory)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Цена *</Label>
            <Input {...register('price')} placeholder="1500" />
            {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Описание</Label>
            <Input {...register('description')} placeholder="Краткое описание позиции" />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Фото (необязательно)</Label>
            {imagePreview ? (
              <div className="relative w-full h-36 rounded-lg overflow-hidden border bg-muted">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-1.5 right-1.5 bg-background/80 rounded-full p-0.5 hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Нажмите чтобы загрузить</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
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

export function ServicesPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [groupFilter, setGroupFilter] = useState<ServiceGroup | 'ALL'>('ALL')

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-manage'],
    queryFn: getServicesManage,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => {
      toast.success('Услуга удалена')
      qc.invalidateQueries({ queryKey: ['services-manage'] })
      setDeleteId(null)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const filtered = groupFilter === 'ALL' ? services : services.filter((s) => s.group === groupFilter)

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Услуги и инвентарь"
          description="Инвентарь, услуги, меню спорт-бара"
          actions={
            <Button onClick={() => { setEditService(null); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          }
        />

        {/* Group filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {GROUP_FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setGroupFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                groupFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.value !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {services.filter((s) => s.group === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Группа</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      Нет услуг в этой категории
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {s.image ? (
                            <img src={s.image} alt={s.name} className="h-10 w-10 rounded-md object-cover flex-shrink-0 border" />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted flex-shrink-0 border" />
                          )}
                          <div>
                            <p className="font-medium">{s.name}</p>
                            {s.description && (
                              <p className="text-xs text-muted-foreground">{s.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{GROUP_LABELS[s.group]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[s.category]}</Badge>
                      </TableCell>
                      <TableCell>{formatMoney(s.price)}</TableCell>
                      <TableCell><ActiveBadge isActive={s.is_active} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => { setEditService(s); setFormOpen(true) }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(s.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ServiceFormDialog service={editService} open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить услугу?"
        description="Это действие нельзя отменить."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDestructive
      />
    </>
  )
}
