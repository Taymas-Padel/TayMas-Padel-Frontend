import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn } from '@/utils/cn'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Дашборд',
  '/dashboard/director': 'Аналитика',
  '/clients': 'Клиенты',
  '/leads': 'Воронка продаж',
  '/bookings/schedule': 'Расписание',
  '/bookings': 'Бронирования',
  '/memberships': 'Абонементы',
  '/memberships/issue': 'Выдать абонемент',
  '/finance': 'Финансы',
  '/qr-scanner': 'QR-сканер',
  '/tournaments': 'Турниры',
  '/manage/courts': 'Корты',
  '/manage/services': 'Услуги',
  '/manage/marketing': 'Промо',
  '/manage/news': 'Новости',
  '/manage/memberships': 'Типы абонементов',
  '/manage/settings': 'Настройки',
  '/manage/staff': 'Сотрудники',
  '/profile': 'Профиль',
}

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/clients/')) return 'Карточка клиента'
  if (pathname.startsWith('/tournaments/')) return 'Турнир'
  return 'TAYMAS CRM'
}

interface TopBarProps {
  onOpenCommandPalette?: () => void
}

export function TopBar({ onOpenCommandPalette }: TopBarProps) {
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
    <header className="h-12 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8"
        onClick={toggleMobileSidebar}
        aria-label="Открыть меню"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Page title (left) */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-[15px] font-medium text-foreground truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Command Palette trigger (center) */}
      <button
        onClick={onOpenCommandPalette}
        className={cn(
          'hidden sm:flex items-center gap-2 h-8 px-3 mx-auto',
          'bg-background border border-border rounded-md',
          'text-sm text-muted-foreground',
          'hover:border-foreground/20 transition-colors duration-150',
          'max-w-md flex-1'
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Поиск...</span>
        <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Right side: notifications + profile */}
      <div className="flex items-center gap-1 ml-auto">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-2 gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">{user?.firstName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-muted-foreground">
                {role ? ROLE_LABELS[role] : ''}
              </p>
            </div>
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
