import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, Edit2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  getSettings,
  updateSetting,
  getClosedDays,
  createClosedDay,
  deleteClosedDay,
} from '@/api/core'
import { formatDate } from '@/utils/date'
import { parseApiError } from '@/utils/error'
import type { ClubSetting } from '@/api/core'
import { AxiosError } from 'axios'

// ─── Club Settings ───────────────────────────────────────────────────────────

function SettingRow({ setting }: { setting: ClubSetting }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(setting.value)

  const mutation = useMutation({
    mutationFn: () => updateSetting(setting.key, value),
    onSuccess: () => {
      toast.success('Настройка сохранена')
      qc.invalidateQueries({ queryKey: ['club-settings'] })
      setEditing(false)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <TableRow>
      <TableCell>
        <p className="font-mono text-sm text-muted-foreground">{setting.key}</p>
        {setting.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
        )}
      </TableCell>
      <TableCell>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => { setValue(setting.value); setEditing(false) }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{setting.value}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
              onClick={() => setEditing(true)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </TableCell>
      {!editing && (
        <TableCell className="w-10">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}

// ─── Closed Day Form Dialog ───────────────────────────────────────────────────

const closedDaySchema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  reason: z.string().min(1, 'Укажите причину'),
})

type ClosedDayForm = z.infer<typeof closedDaySchema>

interface AddClosedDayDialogProps {
  open: boolean
  onClose: () => void
}

function AddClosedDayDialog({ open, onClose }: AddClosedDayDialogProps) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClosedDayForm>({
    resolver: zodResolver(closedDaySchema),
  })

  const mutation = useMutation({
    mutationFn: (values: ClosedDayForm) => createClosedDay(values),
    onSuccess: () => {
      toast.success('Выходной день добавлен')
      qc.invalidateQueries({ queryKey: ['closed-days'] })
      reset()
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Добавить выходной день</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Дата *</Label>
            <Input {...register('date')} type="date" />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Причина *</Label>
            <Input {...register('reason')} placeholder="Государственный праздник" />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Добавить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CoreSettingsPage() {
  const qc = useQueryClient()
  const [addDayOpen, setAddDayOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['club-settings'],
    queryFn: getSettings,
  })

  const { data: closedDays = [], isLoading: daysLoading } = useQuery({
    queryKey: ['closed-days'],
    queryFn: getClosedDays,
  })

  const deleteDayMutation = useMutation({
    mutationFn: (id: number) => deleteClosedDay(id),
    onSuccess: () => {
      toast.success('День удалён')
      qc.invalidateQueries({ queryKey: ['closed-days'] })
      setDeleteId(null)
    },
    onError: (err) => {
      if (err instanceof AxiosError && err.response?.status === 404) {
        toast.error('Удаление выходного дня не поддерживается на сервере (404 endpoint).')
        return
      }
      toast.error(parseApiError(err))
    },
  })

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Настройки клуба"
          description="Режим работы, выходные дни и системные параметры"
        />

        {/* Club Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Системные параметры</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {settingsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : settings.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Параметры не найдены</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Параметр</TableHead>
                    <TableHead>Значение</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((s) => (
                    <SettingRow key={s.key} setting={s} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Closed Days */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base">Выходные и праздничные дни</CardTitle>
            <Button size="sm" onClick={() => setAddDayOpen(true)}>
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {daysLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : closedDays.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                Нет добавленных выходных дней
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Причина</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedDays
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((day) => (
                      <TableRow key={day.id}>
                        <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                        <TableCell className="text-sm">{day.reason}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(day.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AddClosedDayDialog open={addDayOpen} onClose={() => setAddDayOpen(false)} />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить выходной день?"
        description="Клуб будет считаться работающим в этот день."
        onConfirm={() => deleteId && deleteDayMutation.mutate(deleteId)}
        isDestructive
      />
    </>
  )
}
