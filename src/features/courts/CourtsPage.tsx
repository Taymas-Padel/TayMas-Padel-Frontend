import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Loader2, ImagePlus, X, LayoutGrid, List, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { getCourtsManage, createCourt, updateCourt, deleteCourt, addCourtGallery, deleteCourtGallery } from '@/api/courts'
import { formatMoney } from '@/utils/format'
import { parseApiError } from '@/utils/error'
import type { Court, CourtType, PlayFormat, CourtPriceSlot } from '@/types/court'
import { resolveMediaUrl } from '@/utils/media'
import { cn } from '@/utils/cn'

const COURT_TYPE_LABELS: Record<CourtType, string> = {
  INDOOR: 'Крытый',
  OUTDOOR: 'Открытый',
  PANORAMIC: 'Панорамный',
  SQUASH: 'Сквош',
  PING_PONG: 'Пинг-Понг',
}

const PLAY_FORMAT_LABELS: Record<PlayFormat, string> = {
  TWO_VS_TWO: '2 × 2 (Panoramic)',
  ONE_VS_ONE: '1 × 1 (Single)',
}

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  court_type: z.enum(['INDOOR', 'OUTDOOR', 'PANORAMIC', 'SQUASH', 'PING_PONG']),
  play_format: z.enum(['TWO_VS_TWO', 'ONE_VS_ONE']),
  price_per_hour: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type GalleryItem = Court['gallery'][number]

function extractGalleryImageUrl(item: GalleryItem | Record<string, unknown>): string | null {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>
    for (const key of ['image', 'image_url', 'url', 'file', 'photo'] as const) {
      const val = obj[key]
      if (typeof val === 'string' && val) return val
    }
  }
  return null
}

function getCourtImages(court: Court): string[] {
  const images: string[] = []
  if (court.image) {
    const url = resolveMediaUrl(court.image)
    if (url) images.push(url)
  }
  if (court.gallery?.length) {
    for (const item of court.gallery) {
      const raw = extractGalleryImageUrl(item)
      if (raw) {
        const url = resolveMediaUrl(raw)
        if (url && !images.includes(url)) images.push(url)
      }
    }
  }
  return images
}

function formatPriceSlot(s: CourtPriceSlot) {
  const end = s.end_time === '00:00:00' || s.end_time === '00:00' ? '00:00' : s.end_time.slice(0, 5)
  return (
    <p className="text-xs text-muted-foreground whitespace-nowrap">
      {s.start_time.slice(0, 5)}–{end}{' '}
      <span className="font-medium text-foreground">{formatMoney(s.price_per_hour)}</span>
    </p>
  )
}

interface CourtFormDialogProps {
  court: Court | null
  open: boolean
  onClose: () => void
}

function CourtFormDialog({ court, open, onClose }: CourtFormDialogProps) {
  const qc = useQueryClient()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(court?.image ?? null)
  const [gallery, setGallery] = useState<Array<{ id: number; image: string }>>(court?.gallery ?? [])
  const [priceSlots, setPriceSlots] = useState<CourtPriceSlot[]>(court?.price_slots ?? [])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: court?.name ?? '',
      court_type: court?.court_type ?? 'INDOOR',
      play_format: court?.play_format ?? 'TWO_VS_TWO',
      price_per_hour: court?.price_per_hour ?? '',
      description: court?.description ?? '',
      is_active: court?.is_active ?? true,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: court?.name ?? '',
        court_type: court?.court_type ?? 'INDOOR',
        play_format: court?.play_format ?? 'TWO_VS_TWO',
        price_per_hour: court?.price_per_hour ?? '',
        description: court?.description ?? '',
        is_active: court?.is_active ?? true,
      })
      setImageFile(null)
      setImagePreview(resolveMediaUrl(court?.image ?? null) ?? null)
      setGallery(court?.gallery ?? [])
      setPriceSlots(court?.price_slots ?? [])
    }
  }, [open, court, reset])

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let savedCourt: Court

      if (imageFile) {
        const fd = new FormData()
        fd.append('name', values.name)
        fd.append('court_type', values.court_type)
        fd.append('play_format', values.play_format)
        fd.append('price_per_hour', values.price_per_hour.replace(/\s/g, ''))
        fd.append('description', values.description ?? '')
        fd.append('is_active', String(values.is_active))
        fd.append('image', imageFile)
        savedCourt = court ? await updateCourt(court.id, fd) : await createCourt(fd)
      } else {
        const payload = {
          ...values,
          price_per_hour: values.price_per_hour.replace(/\s/g, ''),
        }
        savedCourt = court ? await updateCourt(court.id, payload) : await createCourt(payload)
      }

      // Ценовые слоты всегда обновляем отдельным PATCH (JSON)
      await updateCourt(savedCourt.id, { price_slots: priceSlots })

      return savedCourt
    },
    onSuccess: () => {
      toast.success(court ? 'Корт обновлён' : 'Корт создан')
      qc.invalidateQueries({ queryKey: ['courts-manage'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const addGalleryMutation = useMutation({
    mutationFn: (file: File) => addCourtGallery(court!.id, file),
    onSuccess: (item) => {
      setGallery((prev) => [...prev, item])
      qc.invalidateQueries({ queryKey: ['courts-manage'] })
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        toast.error('Добавление фото недоступно: маршрут не найден на сервере')
      } else {
        toast.error(parseApiError(err))
      }
    },
  })

  const deleteGalleryMutation = useMutation({
    mutationFn: (galleryId: number) => deleteCourtGallery(court!.id, galleryId),
    onSuccess: (_, galleryId) => {
      setGallery((prev) => prev.filter((g) => g.id !== galleryId))
      qc.invalidateQueries({ queryKey: ['courts-manage'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleGalleryAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !court) return
    addGalleryMutation.mutate(file)
    e.target.value = ''
  }

  function addSlot() {
    setPriceSlots((prev) => [...prev, { start_time: '06:00', end_time: '00:00', price_per_hour: '' }])
  }

  function removeSlot(idx: number) {
    setPriceSlots((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateSlot(idx: number, field: keyof CourtPriceSlot, value: string) {
    setPriceSlots((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{court ? 'Редактировать корт' : 'Новый корт'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Название *</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Тип корта *</Label>
              <Select
                value={watch('court_type')}
                onValueChange={(v) => setValue('court_type', v as CourtType)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(COURT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Формат игры *</Label>
              <Select
                value={watch('play_format')}
                onValueChange={(v) => setValue('play_format', v as PlayFormat)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAY_FORMAT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>
              Базовая цена/час *{' '}
              <span className="text-xs text-muted-foreground font-normal">
                (резервная, если нет слотов)
              </span>
            </Label>
            <Input {...register('price_per_hour')} placeholder="18000" />
            {errors.price_per_hour && (
              <p className="text-xs text-destructive">{errors.price_per_hour.message}</p>
            )}
          </div>

          {/* Price slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ценовые слоты по времени</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                <Plus className="h-3.5 w-3.5" />
                Добавить слот
              </Button>
            </div>
            {priceSlots.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center border rounded-md bg-muted/30">
                Нет слотов — используется базовая цена
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 px-1">
                  <span className="text-xs text-muted-foreground">С</span>
                  <span className="text-xs text-muted-foreground">До <span className="opacity-60">(00:00=полночь)</span></span>
                  <span className="text-xs text-muted-foreground">₸/час</span>
                  <span />
                </div>
                {priceSlots.map((slot, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_28px] gap-2 items-center">
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(idx, 'end_time', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={slot.price_per_hour}
                      onChange={(e) => updateSlot(idx, 'price_per_hour', e.target.value)}
                      placeholder="10000"
                      className="h-8 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Описание</Label>
            <Input {...register('description')} />
          </div>

          {/* Main image */}
          <div className="space-y-2">
            <Label>Главное фото</Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-0.5"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="h-6 w-6 mb-1" />
                <span className="text-xs">Выбрать фото</span>
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {imagePreview && !imageFile && (
              <Button type="button" variant="ghost" size="sm" className="text-xs"
                onClick={() => imageInputRef.current?.click()}>
                Заменить фото
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} />
            <Label>Активен</Label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>

        {/* Gallery — only when editing */}
        {court && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Галерея</Label>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={addGalleryMutation.isPending}>
                  {addGalleryMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ImagePlus className="h-3.5 w-3.5" />}
                  Добавить фото
                </Button>
                <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryAdd} />
              </div>
              {gallery.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Галерея пуста</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((g) => (
                    <div key={g.id} className="relative group aspect-square rounded-md overflow-hidden border">
                      <img src={resolveMediaUrl(g.image)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteGalleryMutation.mutate(g.id)}
                        disabled={deleteGalleryMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function CourtsPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editCourt, setEditCourt] = useState<Court | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [courtImageIndex, setCourtImageIndex] = useState<Record<string, number>>({})

  function navigateCourtImage(courtId: number, direction: 'prev' | 'next', total: number) {
    setCourtImageIndex((prev) => {
      const key = String(courtId)
      const current = prev[key] ?? 0
      const next = direction === 'next'
        ? (current + 1) % total
        : (current - 1 + total) % total
      return { ...prev, [key]: next }
    })
  }

  const { data: courts = [], isLoading } = useQuery({
    queryKey: ['courts-manage'],
    queryFn: getCourtsManage,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCourt(id),
    onSuccess: () => {
      toast.success('Корт удалён')
      qc.invalidateQueries({ queryKey: ['courts-manage'] })
      setDeleteId(null)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Корты"
          description="Управление кортами"
          actions={
            <Button onClick={() => { setEditCourt(null); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Добавить корт
            </Button>
          }
        />

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Вид отображения
          </div>

          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'cards'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Карточки
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
              Список
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'cards' ? (
          courts.length === 0 ? (
            <div className="rounded-lg border py-8 text-center text-sm text-muted-foreground">
              Нет кортов
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {courts.map((c) => {
                const images = getCourtImages(c)
                const activeIndex = courtImageIndex[String(c.id)] ?? 0
                const safeIndex = images.length > 0 ? activeIndex % images.length : 0

                return (
                  <article
                    key={c.id}
                    className="flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden border-b bg-muted">
                      {images.length > 0 ? (
                        <>
                          {images.map((src, idx) => (
                            <img
                              key={idx}
                              src={src}
                              alt={c.name}
                              className={cn(
                                'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                                idx === safeIndex ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          ))}

                          {images.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigateCourtImage(c.id, 'prev', images.length)}
                                className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
                                aria-label="Предыдущее фото"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => navigateCourtImage(c.id, 'next', images.length)}
                                className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
                                aria-label="Следующее фото"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>

                              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                                {images.map((_, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setCourtImageIndex((prev) => ({ ...prev, [String(c.id)]: idx }))}
                                    className={cn(
                                      'h-1.5 rounded-full transition-all duration-300',
                                      idx === safeIndex
                                        ? 'w-4 bg-background'
                                        : 'w-1.5 bg-background/50 hover:bg-background/80'
                                    )}
                                    aria-label={`Фото ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
                          <ImageIcon className="h-8 w-8 opacity-60" />
                          Нет изображения
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-base font-semibold leading-tight text-foreground">
                            {c.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {COURT_TYPE_LABELS[c.court_type]}
                          </p>
                        </div>

                        <Badge variant="outline" className="text-xs">
                          {PLAY_FORMAT_LABELS[c.play_format] ?? c.play_format}
                        </Badge>

                        <div>
                          {c.price_slots?.length > 0 ? (
                            <div className="space-y-0.5">
                              {c.price_slots.map((s, i) => (
                                <div key={i}>{formatPriceSlot(s)}</div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-foreground">
                              {formatMoney(c.price_per_hour)}
                            </p>
                          )}
                        </div>

                        <ActiveBadge isActive={c.is_active} />
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-1 border-t pt-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditCourt(c); setFormOpen(true) }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )
        ) : (
          <div className="border rounded-xl overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Формат</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Фото</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {courts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.image ? (
                        <img src={resolveMediaUrl(c.image)} alt="" className="h-9 w-12 object-cover rounded" />
                      ) : (
                        <div className="h-9 w-12 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{COURT_TYPE_LABELS[c.court_type]}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {PLAY_FORMAT_LABELS[c.play_format] ?? c.play_format}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.price_slots?.length > 0 ? (
                        <div className="space-y-0.5">
                          {c.price_slots.map((s, i) => (
                            <div key={i}>{formatPriceSlot(s)}</div>
                          ))}
                        </div>
                      ) : (
                        formatMoney(c.price_per_hour)
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.gallery?.length > 0 ? `${c.gallery.length} фото` : '—'}
                    </TableCell>
                    <TableCell><ActiveBadge isActive={c.is_active} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditCourt(c); setFormOpen(true) }}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(c.id)}>
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

      <CourtFormDialog
        court={editCourt}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить корт?"
        description="Это действие нельзя отменить."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDestructive
      />
    </>
  )
}
