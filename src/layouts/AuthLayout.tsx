import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'
import {
  BRAND_LOGO_LIGHT,
  BRAND_LOGO_ON_DARK,
  BRAND_MARK_GREEN,
} from '@/constants/brandAssets'
import { useThemeStore } from '@/store/themeStore'

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const theme = useThemeStore((s) => s.theme)
  /** Мобильный блок над формой: светлая тема → цветной лого; тёмная → версия для тёмного фона */
  const mobileLogoSrc = theme === 'dark' ? BRAND_LOGO_ON_DARK : BRAND_LOGO_LIGHT

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — TAYMAS panel */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between p-10 text-[hsl(82_100%_95%)] relative overflow-hidden"
        style={{
          background:
            'linear-gradient(165deg, hsl(177 89% 11%) 0%, hsl(177 89% 8%) 45%, hsl(177 60% 14%) 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='2' cy='2' r='1' fill='%2300CA74'/%3E%3C/svg%3E")`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative z-[1] flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="shrink-0 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <img
                src={BRAND_MARK_GREEN}
                alt=""
                width={72}
                height={72}
                className="h-16 w-16 object-contain sm:h-[4.5rem] sm:w-[4.5rem]"
              />
            </div>
            <div className="min-w-0 flex-1 rounded-xl bg-white/[0.09] px-5 py-4">
              <img
                src={BRAND_LOGO_ON_DARK}
                alt="TAYMAS"
                width={320}
                height={84}
                className="block h-[3.75rem] w-auto max-w-full object-contain object-left sm:h-[4.35rem]"
              />
            </div>
          </div>
        </div>

        <div className="relative z-[1] space-y-4">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Система управления
            <br />
            падел-клубом
          </h2>
          <p className="text-[hsl(168_14%_62%)] text-base leading-relaxed max-w-sm">
            Бронирования, клиенты, абонементы, финансы и аналитика — всё в одном месте.
          </p>
        </div>

        <p className="relative z-[1] text-[hsl(168_14%_55%)] text-xs uppercase tracking-[0.18em]">
          © Grand Padel Taymas · 2026
        </p>
      </div>

      {/* Right — login */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-background">
        <div className="w-full max-w-[420px] min-w-0">
          <div className="lg:hidden mb-8 sm:mb-10 flex flex-col items-center gap-4 text-center">
            <img
              src={BRAND_MARK_GREEN}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 object-contain drop-shadow-sm"
            />
            <div
              className={`inline-flex max-w-[min(92vw,20rem)] justify-center rounded-xl px-6 py-4 ${
                theme === 'dark' ? 'bg-white/[0.09]' : 'bg-muted/70'
              }`}
            >
              <img
                src={mobileLogoSrc}
                alt="TAYMAS"
                width={300}
                height={80}
                className="mx-auto block h-11 w-auto max-w-full object-contain object-center sm:h-12"
              />
            </div>
            <p className="text-muted-foreground text-sm tracking-wide">Система управления клубом</p>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
