import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { parseApiError } from '@/utils/error'
import { ROUTES } from '@/constants/routes'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const schema = z.object({
  username: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const res = await login(data.username, data.password)
      setAuth({
        user: {
          userId: res.user_id,
          role: res.role,
          firstName: res.first_name,
          lastName: res.last_name,
        },
        accessToken: res.access,
        refreshToken: res.refresh,
      })
      navigate(ROUTES.DASHBOARD, { replace: true })
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-sm border-slate-200/60">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl">Вход в систему</CardTitle>
        <CardDescription>Введите ваши учётные данные для доступа</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Логин или телефон</Label>
            <Input
              id="username"
              placeholder="reception1"
              autoComplete="username"
              className="h-11"
              {...register('username')}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-11 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Войти
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
