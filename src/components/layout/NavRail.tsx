import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
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
  Sun,
  Moon,
  Pin,
  PinOff,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useThemeStore } from '@/store/themeStore'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { BRAND_MARK_GREEN } from '@/constants/brandAssets'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/utils/format'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  module: string
}

interface NavGroup {
  id: string
  items: NavItem[]
}

// Icons per spec: Lucide 20px, 1.5px stroke
const navGroups: NavGroup[] = [
  {
    id: 'main',
    items: [
      { to: ROUTES.DASHBOARD, label: 'Дашборд', icon: LayoutDashboard, module: 'dashboard_reception' },
      { to: ROUTES.DASHBOARD_DIRECTOR, label: 'Аналитика', icon: BarChart3, module: 'dashboard_director' },
      { to: ROUTES.BOOKINGS_SCHEDULE, label: 'Расписание', icon: CalendarRange, module: 'bookings' },
    ],
  },
  {
    id: 'daily',
    items: [
      { to: ROUTES.BOOKINGS, label: 'Бронирования', icon: BookOpen, module: 'bookings' },
      { to: ROUTES.CLIENTS, label: 'Клиенты', icon: Users, module: 'clients' },
      { to: ROUTES.LEADS, label: 'Лиды', icon: GitBranch, module: 'leads' },
      { to: ROUTES.MEMBERSHIPS, label: 'Абонементы', icon: Ticket, module: 'memberships' },
      { to: ROUTES.FINANCE, label: 'Финансы', icon: Wallet, module: 'finance' },
    ],
  },
  {
    id: 'tools',
    items: [
      { to: ROUTES.QR_SCANNER, label: 'QR-сканер', icon: QrCode, module: 'qr_scanner' },
      { to: ROUTES.TOURNAMENTS, label: 'Турниры', icon: Trophy, module: 'tournaments' },
      { to: ROUTES.MANAGE_SETTINGS, label: 'Управление', icon: Settings2, module: 'club_settings' },
    ],
  },
]

const RAIL_WIDTH = 56
const EXPANDED_WIDTH = 240
const HOVER_DELAY = 200

export function NavRail() {
  const [isHovered, setIsHovered] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { can } = usePermissions()
  const { user } = useAuth()
  const { theme, toggleTheme } = useThemeStore()
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen)

  const isExpanded = isPinned || isHovered

  // Filter nav items by permissions
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.module)),
    }))
    .filter((group) => group.items.length > 0)

  const handleMouseEnter = () => {
    if (isPinned) return
    hoverTimeout.current = setTimeout(() => setIsHovered(true), HOVER_DELAY)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
    if (!isPinned) setIsHovered(false)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    }
  }, [])

  const initials = user ? getInitials(user.firstName, user.lastName) : 'U'

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop Nav Rail */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ width: isExpanded ? EXPANDED_WIDTH : RAIL_WIDTH }}
        className={cn(
          'fixed left-0 top-0 h-full hidden md:flex flex-col z-40',
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
          'transition-[width] duration-200 ease-out'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-12 border-b border-sidebar-border shrink-0">
          <img
            src={BRAND_MARK_GREEN}
            alt="TAYMAS"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          {isExpanded && (
            <span className="ml-2.5 text-sm font-semibold text-sidebar-foreground tracking-tight">
              TAYMAS
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5">
          {visibleGroups.map((group, groupIdx) => (
            <div key={group.id}>
              {groupIdx > 0 && (
                <div className="my-2 mx-auto h-px w-8 bg-sidebar-border" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavRailItem
                    key={item.to}
                    item={item}
                    isExpanded={isExpanded}
                    onNavigate={() => setMobileSidebarOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: theme toggle, pin, profile */}
        <div className="border-t border-sidebar-border p-1.5 shrink-0 space-y-0.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center w-full text-sm transition-colors duration-150',
              'text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5',
              isExpanded ? 'gap-3 rounded-md px-3 py-2' : 'h-10 w-10 mx-auto justify-center rounded-md'
            )}
            aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {isExpanded && <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>}
          </button>

          {/* Pin toggle */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={cn(
              'flex items-center w-full text-sm transition-colors duration-150',
              'text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5',
              isPinned && 'text-nav-active',
              isExpanded ? 'gap-3 rounded-md px-3 py-2' : 'h-10 w-10 mx-auto justify-center rounded-md'
            )}
            aria-label={isPinned ? 'Открепить панель' : 'Закрепить панель'}
          >
            {isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
            {isExpanded && <span>{isPinned ? 'Открепить' : 'Закрепить'}</span>}
          </button>

          {/* Profile avatar */}
          <div
            className={cn(
              'flex items-center',
              isExpanded ? 'gap-3 rounded-md px-3 py-2' : 'h-10 w-10 mx-auto justify-center'
            )}
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] font-semibold bg-nav-active text-sidebar">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isExpanded && user && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}

function NavRailItem({
  item,
  isExpanded,
  onNavigate,
}: {
  item: NavItem
  isExpanded: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  const content = (
    <NavLink
      to={item.to}
      end={item.to === ROUTES.DASHBOARD}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center text-[13px] font-medium transition-colors duration-150',
          isExpanded ? 'gap-3 px-3 py-2 rounded-md' : 'h-10 w-10 mx-auto justify-center rounded-md',
          isActive
            ? 'bg-white/8 text-sidebar-foreground'
            : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-nav-active')} />
          {isExpanded && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )

  if (!isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}
