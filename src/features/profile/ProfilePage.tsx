import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Shield, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/shared/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { setStaffPassword } from '@/api/staff'
import { parseApiError } from '@/utils/error'
import { getInitials } from '@/utils/format'
import { ROLE_LABELS } from '@/constants/roles'

const pwSchema = z.object({
  new_password: z.string().min(8, 'Минимум 8 символов'),
  new_password_confirm: z.string().min(1, 'Обязательное поле'),
}).refine((d) => d.new_password === d.new_password_confirm, {
  message: 'Пароли не совпадают',
  path: ['new_password_confirm'],
})

type PwValues = z.infer<typeof pwSchema>

export function ProfilePage() {
  const { user, role } = useAuth()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwValues>({
    resolver: zodResolver(pwSchema),
  })

  useEffect(() => { reset() }, [reset])

  const pwMutation = useMutation({
    mutationFn: (v: PwValues) =>
      setStaffPassword(user!.userId, {
        new_password: v.new_password,
        new_password_confirm: v.new_password_confirm,
      }),
    onSuccess: (res) => {
      toast.success(res.detail || 'Пароль изменён')
      reset()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  if (!user) return null

  const fullName = `${user.firstName} ${user.lastName}`
  const initials = getInitials(user.firstName, user.lastName)

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Мой профиль" description="Информация об аккаунте и настройки безопасности" />

      {/* User info card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Информация об аккаунте
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-xl font-semibold">{fullName}</p>
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {role ? ROLE_LABELS[role] : '—'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">ID: {user.userId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Изменить пароль
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((v) => pwMutation.mutate(v))} className="space-y-4 max-w-sm">
            <div className="space-y-1">
              <Label>Новый пароль *</Label>
              <Input {...register('new_password')} type="password" autoComplete="new-password" />
              {errors.new_password && (
                <p className="text-xs text-destructive">{errors.new_password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Повторите пароль *</Label>
              <Input {...register('new_password_confirm')} type="password" autoComplete="new-password" />
              {errors.new_password_confirm && (
                <p className="text-xs text-destructive">{errors.new_password_confirm.message}</p>
              )}
            </div>
            <Button type="submit" disabled={pwMutation.isPending}>
              {pwMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Сменить пароль
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
