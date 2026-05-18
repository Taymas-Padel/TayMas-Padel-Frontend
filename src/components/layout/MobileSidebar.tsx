import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import {
  LayoutDashboard,
  BarChart3,
  Users,
  GitBranch,
  CalendarRange,
  BookOpen,
  Wallet,
  QrCode,
  Trophy,
  Settings2,
  Ticket,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { BRAND_LOGO_ON_DARK } from '@/constants/brandAssets'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  module: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Главная',
    items: [
      { to: ROUTES.DASHBOARD, label: 'Дашборд', icon: LayoutDashboard, module: 'dashboard_reception' },
      { to: ROUTES.DASHBOARD_DIRECTOR, label: 'Аналитика', icon: BarChart3, module: 'dashboard_director' },
      { to: ROUTES.BOOKINGS_SCHEDULE, label: 'Расписание', icon: CalendarRange, module: 'bookings' },
    ],
  },
  {
    title: 'Ежедневная работа',
    items: [
      { to: ROUTES.BOOKINGS, label: 'Бронирования', icon: BookOpen, module: 'bookings' },
      { to: ROUTES.CLIENTS, label: 'Клиенты', icon: Users, module: 'clients' },
      { to: ROUTES.LEADS, label: 'Лиды', icon: GitBranch, module: 'leads' },
      { to: ROUTES.MEMBERSHIPS, label: 'Абонементы', icon: Ticket, module: 'memberships' },
      { to: ROUTES.FINANCE, label: 'Финансы', icon: Wallet, module: 'finance' },
    ],
  },
  {
    title: 'Инструменты',
    items: [
      { to: ROUTES.QR_SCANNER, label: 'QR-сканер', icon: QrCode, module: 'qr_scanner' },
      { to: ROUTES.TOURNAMENTS, label: 'Турниры', icon: Trophy, module: 'tournaments' },
      { to: ROUTES.MANAGE_SETTINGS, label: 'Управление', icon: Settings2, module: 'club_settings' },
    ],
  },
]

export function MobileSidebar() {
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen)
  const { can } = usePermissions()

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.module)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full w-72 md:hidden flex flex-col z-40',
        'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
        'transition-transform duration-200 ease-out',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header with logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={BRAND_LOGO_ON_DARK}
            alt="TAYMAS"
            width={120}
            height={32}
            className="h-7 w-auto object-contain"
          />
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="p-2 text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          aria-label="Закрыть меню"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {visibleGroups.map((group, idx) => (
          <div key={group.title} className={cn(idx > 0 && 'mt-4')}>
            <p className="brand-label px-3 mb-1.5 text-sidebar-muted">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === ROUTES.DASHBOARD}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md',
                        'text-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'bg-white/8 text-sidebar-foreground'
                          : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-nav-active')} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
