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
        icon: <LayoutDashboard className="h-4 w-4" />,
        module: 'dashboard_reception',
      },
      {
        to: ROUTES.DASHBOARD_DIRECTOR,
        label: 'Дашборд директора',
        icon: <BarChart3 className="h-4 w-4" />,
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
        icon: <Users className="h-4 w-4" />,
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
        icon: <Target className="h-4 w-4" />,
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
        icon: <Calendar className="h-4 w-4" />,
        module: 'bookings',
      },
      {
        to: ROUTES.BOOKINGS,
        label: 'Все брони',
        icon: <ListChecks className="h-4 w-4" />,
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
        icon: <CreditCard className="h-4 w-4" />,
        module: 'memberships',
      },
      {
        to: ROUTES.MEMBERSHIPS,
        label: 'Все абонементы',
        icon: <ListChecks className="h-4 w-4" />,
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
        icon: <DollarSign className="h-4 w-4" />,
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
        icon: <QrCode className="h-4 w-4" />,
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
        icon: <Trophy className="h-4 w-4" />,
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
        icon: <Building2 className="h-4 w-4" />,
        module: 'manage_courts',
      },
      {
        to: ROUTES.MANAGE_SERVICES,
        label: 'Услуги / Инвентарь',
        icon: <Wrench className="h-4 w-4" />,
        module: 'manage_services',
      },
      {
        to: ROUTES.MANAGE_MARKETING,
        label: 'Акции / Промокоды',
        icon: <Tag className="h-4 w-4" />,
        module: 'manage_marketing',
      },
      {
        to: ROUTES.MANAGE_NEWS,
        label: 'Новости',
        icon: <Newspaper className="h-4 w-4" />,
        module: 'manage_news',
      },
      {
        to: ROUTES.MANAGE_MEMBERSHIPS,
        label: 'Типы абонементов',
        icon: <BadgePercent className="h-4 w-4" />,
        module: 'manage_memberships',
      },
      {
        to: ROUTES.MANAGE_SETTINGS,
        label: 'Настройки клуба',
        icon: <Settings className="h-4 w-4" />,
        module: 'club_settings',
      },
      {
        to: ROUTES.MANAGE_STAFF,
        label: 'Сотрудники',
        icon: <UserCog className="h-4 w-4" />,
        module: 'manage_staff',
      },
    ],
  },
]

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { can } = usePermissions()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-slate-900 text-slate-100 flex flex-col transition-all duration-200 z-40',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo area */}
        <div className="flex items-center h-16 px-4 border-b border-slate-700">
          {sidebarOpen && (
            <span className="font-bold text-lg text-white truncate">CRM Padel</span>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              'p-1.5 rounded-md hover:bg-slate-700 transition-colors text-slate-400 hover:text-white',
              sidebarOpen ? 'ml-auto' : 'mx-auto'
            )}
            aria-label={sidebarOpen ? 'Свернуть' : 'Развернуть'}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => can(item.module))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="mb-4">
                {sidebarOpen && (
                  <p className="px-2 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.title}
                  </p>
                )}
                {visibleItems.map((item) => (
                  <SidebarNavItem key={item.to} item={item} sidebarOpen={sidebarOpen} />
                ))}
              </div>
            )
          })}
        </nav>
      </aside>
    </TooltipProvider>
  )
}

function SidebarNavItem({ item, sidebarOpen }: { item: NavItem; sidebarOpen: boolean }) {
  const content = (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center py-2 rounded-md text-sm transition-colors',
          sidebarOpen ? 'gap-3 px-2' : 'justify-center px-0',
          isActive
            ? 'bg-primary text-white'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        )
      }
    >
      <span className="shrink-0">{item.icon}</span>
      {sidebarOpen && <span className="truncate">{item.label}</span>}
    </NavLink>
  )

  if (!sidebarOpen) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}
