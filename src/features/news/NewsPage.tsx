import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Loader2, Pin } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { getNews, createNews, updateNews, deleteNews } from '@/api/news'
import { parseApiError } from '@/utils/error'
import type { NewsItem } from '@/types/court'

type NewsCategory = 'NEWS' | 'EVENT' | 'PROMO' | 'ANNOUNCEMENT'

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  NEWS: 'Новость',
  EVENT: 'Мероприятие',
  PROMO: 'Акция',
  ANNOUNCEMENT: 'Объявление',
}

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  NEWS: 'bg-blue-100 text-blue-700',
  EVENT: 'bg-purple-100 text-purple-700',
  PROMO: 'bg-green-100 text-green-700',
  ANNOUNCEMENT: 'bg-orange-100 text-orange-700',
}

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  content: z.string().min(1, 'Обязательное поле'),
  category: z.enum(['NEWS', 'EVENT', 'PROMO', 'ANNOUNCEMENT']),
  is_pinned: z.boolean(),
  image_url: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface NewsFormDialogProps {
  news: NewsItem | null
  open: boolean
  onClose: () => void
}

function NewsFormDialog({ news, open, onClose }: NewsFormDialogProps) {
  const qc = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '', category: 'NEWS', is_pinned: false, image_url: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: news?.title ?? '',
        content: news?.content ?? '',
        category: news?.category ?? 'NEWS',
        is_pinned: news?.is_pinned ?? false,
        image_url: news?.image_url ?? '',
      })
    }
  }, [open, news, reset])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, image_url: values.image_url || null }
      return news ? updateNews(news.id, payload) : createNews(payload)
    },
    onSuccess: () => {
      toast.success(news ? 'Новость обновлена' : 'Новость создана')
      qc.invalidateQueries({ queryKey: ['news'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{news ? 'Редактировать новость' : 'Новая публикация'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Заголовок *</Label>
            <Input {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Категория *</Label>
            <Select
              value={watch('category')}
              onValueChange={(v) => setValue('category', v as NewsCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Контент *</Label>
            <Textarea
              {...register('content')}
              className="resize-none"
              rows={5}
              placeholder="Текст публикации..."
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>URL изображения</Label>
            <Input {...register('image_url')} placeholder="https://..." />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={watch('is_pinned')}
              onCheckedChange={(v) => setValue('is_pinned', v)}
            />
            <Label>Закреплено</Label>
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

export function NewsPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editNews, setEditNews] = useState<NewsItem | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: newsList = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: getNews,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNews(id),
    onSuccess: () => {
      toast.success('Новость удалена')
      qc.invalidateQueries({ queryKey: ['news'] })
      setDeleteId(null)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Новости"
          description="Публикации и объявления"
          actions={
            <Button onClick={() => { setEditNews(null); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Новая публикация
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
                  <TableHead>Категория</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Закреплено</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsList.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {n.is_pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="font-medium">{n.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[n.category]}`}>
                        {CATEGORY_LABELS[n.category]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {n.created_at_formatted}
                    </TableCell>
                    <TableCell>
                      {n.is_pinned ? (
                        <Badge variant="outline" className="text-xs">Да</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditNews(n); setFormOpen(true) }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(n.id)}
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

      <NewsFormDialog news={editNews} open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить новость?"
        description="Это действие нельзя отменить."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDestructive
      />
    </>
  )
}
