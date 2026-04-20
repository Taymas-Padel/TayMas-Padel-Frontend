import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-slate-900 text-white flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-white">P</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">CRM Padel</span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Система управления<br />падел-клубом
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Бронирования, клиенты, абонементы, финансы и аналитика — всё в одном месте.
          </p>
        </div>

        <p className="text-slate-500 text-sm">&copy; 2025 CRM Padel. Все права защищены.</p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-white">P</span>
              </div>
              <span className="text-xl font-semibold text-slate-900 tracking-tight">CRM Padel</span>
            </div>
            <p className="text-slate-500 text-sm">Система управления клубом</p>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
