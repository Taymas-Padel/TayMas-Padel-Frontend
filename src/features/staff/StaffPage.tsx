import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Edit2, KeyRound, UserX, UserCheck, Trash2, Loader2, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { ViewModeToggle, type ViewMode } from '@/components/shared/ViewModeToggle'
import {
  getStaff, createStaff, updateStaff, setStaffPassword,
  activateStaff, deactivateStaff, deleteStaff,
} from '@/api/staff'
import { parseApiError } from '@/utils/error'
import { cn } from '@/utils/cn'
import { formatMoney, getInitials } from '@/utils/format'
import type { StaffMember, StaffRole } from '@/types/staff'
import { resolveMediaUrl } from '@/utils/media'

const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: 'Администратор',
  RECEPTIONIST: 'Ресепшн',
  SALES_MANAGER: 'Менеджер продаж',
  COACH_PADEL: 'Тренер (Падел)',
  COACH_FITNESS: 'Тренер (Фитнес)',
}

const ROLE_VARIANTS: Record<StaffRole, 'default' | 'info' | 'success' | 'warning' | 'secondary'> = {
  ADMIN: 'default',
  RECEPTIONIST: 'info',
  SALES_MANAGER: 'success',
  COACH_PADEL: 'warning',
  COACH_FITNESS: 'secondary',
}

const ROLE_FILTER_TABS: { value: StaffRole | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'ADMIN', label: 'Администраторы' },
  { value: 'RECEPTIONIST', label: 'Ресепшн' },
  { value: 'SALES_MANAGER', label: 'Менеджеры' },
  { value: 'COACH_PADEL', label: 'Тренеры (Падел)' },
  { value: 'COACH_FITNESS', label: 'Тренеры (Фитнес)' },
]

// ──────────────────────────────────────────────
// Create / Edit form
// ──────────────────────────────────────────────
const createSchema = z.object({
  username: z.string().min(2, 'Минимум 2 символа'),
  first_name: z.string().min(1, 'Обязательное поле'),
  last_name: z.string().min(1, 'Обязательное поле'),
  phone_number: z.string().min(10, 'Введите номер телефона'),
  email: z.string().email('Неверный формат').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'SALES_MANAGER', 'COACH_PADEL', 'COACH_FITNESS']),
  price_per_hour: z.coerce.number().min(0).optional(),
  coach_price_1_2: z.coerce.number().min(0).optional().nullable(),
  coach_price_3_4: z.coerce.number().min(0).optional().nullable(),
  password: z.string().min(8, 'Минимум 8 символов'),
  password_confirm: z.string().min(1, 'Обязательное поле'),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Пароли не совпадают',
  path: ['password_confirm'],
})

const editSchema = z.object({
  first_name: z.string().min(1, 'Обязательное поле'),
  last_name: z.string().min(1, 'Обязательное поле'),
  phone_number: z.string().min(10, 'Введите номер телефона'),
  email: z.string().email('Неверный формат').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'SALES_MANAGER', 'COACH_PADEL', 'COACH_FITNESS']),
  price_per_hour: z.coerce.number().min(0).optional(),
  coach_price_1_2: z.coerce.number().min(0).optional().nullable(),
  coach_price_3_4: z.coerce.number().min(0).optional().nullable(),
})

type CreateFormValues = z.infer<typeof createSchema>
type EditFormValues = z.infer<typeof editSchema>

function StaffFormDialog({
  staff,
  open,
  onClose,
}: {
  staff: StaffMember | null
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!staff

  const {
    register: regCreate, handleSubmit: handleCreate, setValue: setCreate,
    watch: watchCreate, reset: resetCreate, formState: { errors: errCreate },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'RECEPTIONIST', price_per_hour: 0 },
  })

  const {
    register: regEdit, handleSubmit: handleEdit, setValue: setEdit,
    watch: watchEdit, reset: resetEdit, formState: { errors: errEdit },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { role: 'RECEPTIONIST', price_per_hour: 0 },
  })

  useEffect(() => {
    if (open) {
      if (staff) {
        resetEdit({
          first_name: staff.first_name,
          last_name: staff.last_name,
          phone_number: staff.phone_number,
          email: staff.email ?? '',
          role: staff.role,
          price_per_hour: Number(staff.price_per_hour),
          coach_price_1_2: staff.coach_price_1_2,
          coach_price_3_4: staff.coach_price_3_4,
        })
      } else {
        resetCreate({ role: 'RECEPTIONIST', price_per_hour: 0, coach_price_1_2: null, coach_price_3_4: null, username: '', first_name: '', last_name: '', phone_number: '', email: '', password: '', password_confirm: '' })
      }
    }
  }, [open, staff, resetCreate, resetEdit])

  const createMutation = useMutation({
    mutationFn: (v: CreateFormValues) =>
      createStaff({
        username: v.username.trim(),
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        phone_number: v.phone_number.trim(),
        email: v.email?.trim() || undefined,
        role: v.role,
        price_per_hour: v.price_per_hour ?? 0,
        coach_price_1_2: v.coach_price_1_2 ?? null,
        coach_price_3_4: v.coach_price_3_4 ?? null,
        password: v.password,
        password_confirm: v.password_confirm,
      }),
    onSuccess: () => {
      toast.success('Сотрудник создан')
      qc.invalidateQueries({ queryKey: ['staff'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const editMutation = useMutation({
    mutationFn: (v: EditFormValues) =>
      updateStaff(staff!.id, {
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        phone_number: v.phone_number.trim(),
        email: v.email?.trim() || undefined,
        role: v.role,
        price_per_hour: String(v.price_per_hour ?? 0),
        coach_price_1_2: v.coach_price_1_2 ?? null,
        coach_price_3_4: v.coach_price_3_4 ?? null,
      }),
    onSuccess: () => {
      toast.success('Данные обновлены')
      qc.invalidateQueries({ queryKey: ['staff'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const roleVal = isEdit ? watchEdit('role') : watchCreate('role')
  const isCoach = roleVal === 'COACH_PADEL' || roleVal === 'COACH_FITNESS'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать сотрудника' : 'Новый сотрудник'}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <form onSubmit={handleEdit((v) => editMutation.mutate(v))} className="space-y-4">
            <FormFields
              register={regEdit} errors={errEdit}
              setValue={setEdit} roleVal={roleVal} isCoach={isCoach}
              showPassword={false}
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Сохранить
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreate((v) => createMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label>Логин (username) *</Label>
              <Input {...regCreate('username')} placeholder="dana_r" autoComplete="off" />
              {errCreate.username && <p className="text-xs text-destructive">{errCreate.username.message}</p>}
            </div>
            <FormFields
              register={regCreate} errors={errCreate}
              setValue={setCreate} roleVal={roleVal} isCoach={isCoach}
              showPassword
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Пароль *</Label>
                <Input {...regCreate('password')} type="password" autoComplete="new-password" />
                {errCreate.password && <p className="text-xs text-destructive">{errCreate.password.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Повторите пароль *</Label>
                <Input {...regCreate('password_confirm')} type="password" autoComplete="new-password" />
                {errCreate.password_confirm && <p className="text-xs text-destructive">{errCreate.password_confirm.message}</p>}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Создать
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Shared form fields (name, phone, email, role, price)
function FormFields({
  register, errors, setValue, roleVal, isCoach, showPassword: _,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  errors: Record<string, { message?: string } | undefined>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any
  roleVal: StaffRole
  isCoach: boolean
  showPassword: boolean
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Имя *</Label>
          <Input {...register('first_name')} placeholder="Дана" />
          {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Фамилия *</Label>
          <Input {...register('last_name')} placeholder="Рахимова" />
          {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Телефон *</Label>
        <Input {...register('phone_number')} placeholder="+77055001122" />
        {errors.phone_number && <p className="text-xs text-destructive">{errors.phone_number.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Email</Label>
        <Input {...register('email')} placeholder="dana@club.kz" type="email" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Роль *</Label>
          <Select value={roleVal} onValueChange={(v) => setValue('role', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isCoach && (
          <div className="space-y-1">
            <Label>Ставка (₸/час)</Label>
            <Input {...register('price_per_hour')} type="number" min="0" placeholder="8000" />
          </div>
        )}
      </div>

      {isCoach && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Цена 1–2 игрока (₸/час)</Label>
            <Input {...register('coach_price_1_2')} type="number" min="0" placeholder="24000" />
          </div>
          <div className="space-y-1">
            <Label>Цена 3–4 игрока (₸/час)</Label>
            <Input {...register('coach_price_3_4')} type="number" min="0" placeholder="36000" />
          </div>
        </div>
      )}
    </>
  )
}

// ──────────────────────────────────────────────
// Change Password Dialog
// ──────────────────────────────────────────────
const pwSchema = z.object({
  new_password: z.string().min(8, 'Минимум 8 символов'),
  new_password_confirm: z.string().min(1, 'Обязательное поле'),
}).refine((d) => d.new_password === d.new_password_confirm, {
  message: 'Пароли не совпадают',
  path: ['new_password_confirm'],
})

function ChangePasswordDialog({
  staff,
  open,
  onClose,
}: {
  staff: StaffMember | null
  open: boolean
  onClose: () => void
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof pwSchema>>({
    resolver: zodResolver(pwSchema),
  })

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: (v: z.infer<typeof pwSchema>) =>
      setStaffPassword(staff!.id, {
        new_password: v.new_password,
        new_password_confirm: v.new_password_confirm,
      }),
    onSuccess: (res) => {
      toast.success(res.detail)
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Сменить пароль — {staff?.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1">
            <Label>Новый пароль *</Label>
            <Input {...register('new_password')} type="password" autoComplete="new-password" />
            {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Повторите пароль *</Label>
            <Input {...register('new_password_confirm')} type="password" autoComplete="new-password" />
            {errors.new_password_confirm && <p className="text-xs text-destructive">{errors.new_password_confirm.message}</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Сменить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
export function StaffPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'ALL'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null)
  const [pwStaff, setPwStaff] = useState<StaffMember | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => getStaff(),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? deactivateStaff(id) : activateStaff(id),
    onSuccess: (res) => {
      toast.success(res.detail)
      qc.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStaff(id),
    onSuccess: () => {
      toast.success('Сотрудник удалён')
      qc.invalidateQueries({ queryKey: ['staff'] })
      setDeleteId(null)
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const filtered = staff.filter((s) => {
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || [s.full_name, s.username, s.phone_number, s.email ?? '']
      .some((v) => v.toLowerCase().includes(q))
    return matchesRole && matchesSearch
  })

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Сотрудники"
          description="Управление аккаунтами персонала клуба"
          actions={
            <Button onClick={() => { setEditStaff(null); setFormOpen(true) }}>
              <Plus className="h-4 w-4" />
              Добавить сотрудника
            </Button>
          }
        />

        {/* Role filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {ROLE_FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRoleFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                roleFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.value !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {staff.filter((s) => s.role === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск по имени, логину, телефону..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ViewModeToggle value={viewMode} onChange={setViewMode} />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border py-8 text-center text-sm text-muted-foreground">
            Сотрудники не найдены
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((member) => (
              <article
                key={member.id}
                className={cn(
                  'flex flex-col rounded-xl border bg-card text-card-foreground p-4 shadow-sm',
                  !member.is_active && 'opacity-70'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={resolveMediaUrl(member.avatar)} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.first_name, member.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-2 flex-1">
                    <h3 className="text-base font-semibold leading-tight break-words">
                      {member.full_name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={ROLE_VARIANTS[member.role]} className="text-xs">
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      <ActiveBadge isActive={member.is_active} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <p className="text-muted-foreground break-all">
                    Тел.: <span className="text-foreground font-medium">{member.phone_number}</span>
                  </p>
                  {member.email && (
                    <p className="text-muted-foreground break-all">
                      Email: <span className="text-foreground font-medium">{member.email}</span>
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    Логин: <span className="text-foreground font-mono font-medium">{member.username}</span>
                  </p>
                  {(member.role === 'COACH_PADEL' || member.role === 'COACH_FITNESS') && Number(member.price_per_hour) > 0 && (
                    <p className="pt-1 text-base font-bold tracking-tight">
                      {member.coach_price_1_2 && member.coach_price_3_4
                        ? `${formatMoney(member.coach_price_1_2)} / ${formatMoney(member.coach_price_3_4)}`
                        : `${formatMoney(member.price_per_hour)}/ч`}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-end gap-1 border-t pt-3 mt-4">
                  <Button
                    variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8"
                    title="Редактировать"
                    onClick={() => { setEditStaff(member); setFormOpen(true) }}
                  >
                    <Edit2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8"
                    title="Сменить пароль"
                    onClick={() => setPwStaff(member)}
                  >
                    <KeyRound className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className={cn(
                      'h-10 w-10 sm:h-8 sm:w-8',
                      member.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                    )}
                    title={member.is_active ? 'Деактивировать' : 'Активировать'}
                    onClick={() => toggleActiveMutation.mutate({ id: member.id, active: member.is_active })}
                    disabled={toggleActiveMutation.isPending}
                  >
                    {member.is_active
                      ? <UserX className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      : <UserCheck className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-destructive"
                    title="Удалить"
                    onClick={() => setDeleteId(member.id)}
                  >
                    <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border rounded-xl overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Логин</TableHead>
                  <TableHead>Ставка</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => (
                    <TableRow key={member.id} className={cn(!member.is_active && 'opacity-60')}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={resolveMediaUrl(member.avatar)} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.first_name, member.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{member.full_name}</p>
                            {member.email && (
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANTS[member.role]} className="text-xs">
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{member.phone_number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{member.username}</TableCell>
                      <TableCell className="text-sm">
                        {(member.role === 'COACH_PADEL' || member.role === 'COACH_FITNESS') && Number(member.price_per_hour) > 0 ? (
                          <div className="space-y-0.5">
                            {member.coach_price_1_2 && member.coach_price_3_4 ? (
                              <>
                                <div>{formatMoney(member.coach_price_1_2)}/ч <span className="text-xs text-muted-foreground">(1–2)</span></div>
                                <div>{formatMoney(member.coach_price_3_4)}/ч <span className="text-xs text-muted-foreground">(3–4)</span></div>
                              </>
                            ) : (
                              <div>{formatMoney(member.price_per_hour)}/ч</div>
                            )}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <ActiveBadge isActive={member.is_active} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            title="Редактировать"
                            onClick={() => { setEditStaff(member); setFormOpen(true) }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            title="Сменить пароль"
                            onClick={() => setPwStaff(member)}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className={cn('h-8 w-8', member.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700')}
                            title={member.is_active ? 'Деактивировать' : 'Активировать'}
                            onClick={() => toggleActiveMutation.mutate({ id: member.id, active: member.is_active })}
                            disabled={toggleActiveMutation.isPending}
                          >
                            {member.is_active
                              ? <UserX className="h-3.5 w-3.5" />
                              : <UserCheck className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            title="Удалить"
                            onClick={() => setDeleteId(member.id)}
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

      <StaffFormDialog
        staff={editStaff}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />

      <ChangePasswordDialog
        staff={pwStaff}
        open={!!pwStaff}
        onClose={() => setPwStaff(null)}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить сотрудника?"
        description="Это действие нельзя отменить. Рекомендуется деактивация вместо удаления."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDestructive
      />
    </>
  )
}
