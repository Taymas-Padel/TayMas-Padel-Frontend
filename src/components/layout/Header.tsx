import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
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
  '/manage/courts': 'Управление кортами',
  '/manage/services': 'Услуги и инвентарь',
  '/manage/marketing': 'Акции и промокоды',
  '/manage/news': 'Новости и объявления',
}

export function Header() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'CRM Padel'
  const initials = user ? getInitials(user.firstName, user.lastName) : 'U'
  const fullName = user ? `${user.firstName} ${user.lastName}` : ''

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
      <h1 className="text-lg font-semibold text-slate-900 flex-1">{pageTitle}</h1>

      <div className="flex items-center gap-2">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {role ? ROLE_LABELS[role] : ''}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
