import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/constants/roles'
import { getInitials } from '@/utils/format'
import { ROUTES } from '@/constants/routes'
import { NotificationDropdown } from '@/features/notifications/NotificationDropdown'
import { useUiStore } from '@/store/uiStore'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Дашборд ресепшн',
  '/dashboard/director': 'Дашборд директора',
  '/clients': 'Клиенты',
  '/leads': 'Воронка продаж',
  '/bookings/schedule': 'Расписание кортов',
  '/bookings': 'Все бронирования',
  '/memberships': 'Абонементы',
  '/memberships/issue': 'Выдать абонемент',
  '/finance': 'Финансы',
  '/qr-scanner': 'QR-сканер',
  '/tournaments': 'Турниры',
  '/manage/courts': 'Управление кортами',
  '/manage/services': 'Услуги и инвентарь',
  '/manage/marketing': 'Акции и промокоды',
  '/manage/news': 'Новости и объявления',
  '/manage/memberships': 'Типы абонементов',
  '/manage/settings': 'Настройки клуба',
  '/manage/staff': 'Сотрудники',
  '/profile': 'Профиль',
}

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/clients/')) return 'Карточка клиента'
  if (pathname.startsWith('/tournaments/')) return 'Турнир'
  return 'CRM Padel'
}

export function Header() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar)

  const pageTitle = resolveTitle(location.pathname)
  const initials = user ? getInitials(user.firstName, user.lastName) : 'U'
  const fullName = user ? `${user.firstName} ${user.lastName}` : ''

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center px-4 md:px-6 gap-3 md:gap-4 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9"
        onClick={toggleMobileSidebar}
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold text-slate-800 flex-1 truncate">{pageTitle}</h1>

      <div className="flex items-center gap-1">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 h-10 px-2 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{fullName}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {role ? ROLE_LABELS[role] : ''}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {role ? ROLE_LABELS[role] : ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(ROUTES.PROFILE)}>
              <User className="h-4 w-4" />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
