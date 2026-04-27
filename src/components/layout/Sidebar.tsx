import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Target,
  Calendar,
  ListChecks,
  CreditCard,
  DollarSign,
  QrCode,
  Building2,
  Wrench,
  Tag,
  Newspaper,
  BadgePercent,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Trophy,
  UserCog,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  module: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Главная',
    items: [
      {
        to: ROUTES.DASHBOARD,
        label: 'Дашборд ресепшн',
        icon: <LayoutDashboard className="h-5 w-5" />,
        module: 'dashboard_reception',
      },
      {
        to: ROUTES.DASHBOARD_DIRECTOR,
        label: 'Дашборд директора',
        icon: <BarChart3 className="h-5 w-5" />,
        module: 'dashboard_director',
      },
    ],
  },
  {
    title: 'Клиенты',
    items: [
      {
        to: ROUTES.CLIENTS,
        label: 'База клиентов',
        icon: <Users className="h-5 w-5" />,
        module: 'clients',
      },
    ],
  },
  {
    title: 'Лиды',
    items: [
      {
        to: ROUTES.LEADS,
        label: 'Воронка продаж',
        icon: <Target className="h-5 w-5" />,
        module: 'leads',
      },
    ],
  },
  {
    title: 'Бронирования',
    items: [
      {
        to: ROUTES.BOOKINGS_SCHEDULE,
        label: 'Расписание',
        icon: <Calendar className="h-5 w-5" />,
        module: 'bookings',
      },
      {
        to: ROUTES.BOOKINGS,
        label: 'Все брони',
        icon: <ListChecks className="h-5 w-5" />,
        module: 'bookings',
      },
    ],
  },
  {
    title: 'Абонементы',
    items: [
      {
        to: ROUTES.MEMBERSHIPS_ISSUE,
        label: 'Выдать абонемент',
        icon: <CreditCard className="h-5 w-5" />,
        module: 'memberships',
      },
      {
        to: ROUTES.MEMBERSHIPS,
        label: 'Все абонементы',
        icon: <ListChecks className="h-5 w-5" />,
        module: 'memberships',
      },
    ],
  },
  {
    title: 'Финансы',
    items: [
      {
        to: ROUTES.FINANCE,
        label: 'Транзакции и сводка',
        icon: <DollarSign className="h-5 w-5" />,
        module: 'finance',
      },
    ],
  },
  {
    title: 'QR-сканер',
    items: [
      {
        to: ROUTES.QR_SCANNER,
        label: 'QR-сканер',
        icon: <QrCode className="h-5 w-5" />,
        module: 'qr_scanner',
      },
    ],
  },
  {
    title: 'Турниры',
    items: [
      {
        to: ROUTES.TOURNAMENTS,
        label: 'Турниры',
        icon: <Trophy className="h-5 w-5" />,
        module: 'tournaments',
      },
    ],
  },
  {
    title: 'Управление',
    items: [
      {
        to: ROUTES.MANAGE_COURTS,
        label: 'Корты',
        icon: <Building2 className="h-5 w-5" />,
        module: 'manage_courts',
      },
      {
        to: ROUTES.MANAGE_SERVICES,
        label: 'Услуги / Инвентарь',
        icon: <Wrench className="h-5 w-5" />,
        module: 'manage_services',
      },
      {
        to: ROUTES.MANAGE_MARKETING,
        label: 'Акции / Промокоды',
        icon: <Tag className="h-5 w-5" />,
        module: 'manage_marketing',
      },
      {
        to: ROUTES.MANAGE_NEWS,
        label: 'Новости',
        icon: <Newspaper className="h-5 w-5" />,
        module: 'manage_news',
      },
      {
        to: ROUTES.MANAGE_MEMBERSHIPS,
        label: 'Типы абонементов',
        icon: <BadgePercent className="h-5 w-5" />,
        module: 'manage_memberships',
      },
      {
        to: ROUTES.MANAGE_SETTINGS,
        label: 'Настройки клуба',
        icon: <Settings className="h-5 w-5" />,
        module: 'club_settings',
      },
      {
        to: ROUTES.MANAGE_STAFF,
        label: 'Сотрудники',
        icon: <UserCog className="h-5 w-5" />,
        module: 'manage_staff',
      },
    ],
  },
]

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen)
  const { can } = usePermissions()
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => can(item.module)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full hidden md:flex flex-col transition-all duration-300 z-40',
          'bg-slate-900 text-slate-100 border-r border-slate-800',
          sidebarOpen ? 'w-[240px] lg:w-64 xl:w-72' : 'w-[68px]'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 border-b border-slate-800 shrink-0',
          sidebarOpen ? 'px-5' : 'px-3'
        )}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">P</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate">CRM Padel</p>
                <p className="text-[10px] text-slate-400 truncate">Управление клубом</p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <span className="text-sm font-bold text-white">P</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            'flex-1 overflow-y-auto py-3 space-y-1',
            sidebarOpen
              ? 'px-2 lg:px-3'
              : 'px-0 overflow-x-hidden [scrollbar-gutter:stable] flex flex-col items-center'
          )}
        >
          {visibleSections.map((section, idx) => {
            return (
              <div
                key={section.title}
                className={cn('mb-1', !sidebarOpen && 'w-full flex flex-col items-center')}
              >
                {sidebarOpen && (
                  <p className={cn('px-3 mb-1 text-[11px] font-medium text-slate-500 uppercase tracking-widest', idx > 0 && 'mt-4')}>
                    {section.title}
                  </p>
                )}
                {!sidebarOpen && idx > 0 && (
                  <div className="my-2 h-px w-8 bg-slate-700/50" />
                )}
                <div className={cn('space-y-0.5', !sidebarOpen && 'w-full flex flex-col items-center')}>
                  {section.items.map((item) => (
                    <SidebarNavItem key={item.to} item={item} sidebarOpen={sidebarOpen} />
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-slate-800 p-3 shrink-0">
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex items-center w-full text-sm transition-colors',
              'text-slate-400 hover:text-white hover:bg-slate-800',
              sidebarOpen ? 'gap-3 rounded-lg px-3 py-2' : 'mx-auto h-10 w-10 justify-center rounded-xl'
            )}
            aria-label={sidebarOpen ? 'Свернуть' : 'Развернуть'}
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Свернуть</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-[min(20rem,calc(100vw-0.75rem))] md:hidden flex flex-col z-40',
          'bg-slate-900 text-slate-100 border-r border-slate-800 transition-transform duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">CRM Padel</p>
              <p className="text-[10px] text-slate-400 truncate">Управление клубом</p>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Закрыть меню"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleSections.map((section, idx) => (
            <div key={section.title}>
              <p className={cn('px-3 mb-1 text-[11px] font-medium text-slate-500 uppercase tracking-widest', idx > 0 && 'mt-4')}>
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.to}
                    item={item}
                    sidebarOpen
                    onNavigate={() => setMobileSidebarOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  )
}

function SidebarNavItem({
  item,
  sidebarOpen,
  onNavigate,
}: {
  item: NavItem
  sidebarOpen: boolean
  onNavigate?: () => void
}) {
  const content = (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center text-sm font-medium transition-colors duration-150',
          sidebarOpen ? 'gap-3 px-3 py-2 rounded-lg' : 'h-10 w-10 justify-center rounded-xl',
          isActive
            ? 'bg-primary/15 text-white'
            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('shrink-0 transition-colors', isActive && 'text-primary')}>
            {item.icon}
          </span>
          {sidebarOpen && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )

  if (!sidebarOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}
