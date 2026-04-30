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
import { BRAND_LOGO_ON_DARK, BRAND_MARK_GREEN } from '@/constants/brandAssets'
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
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
          sidebarOpen ? 'w-[240px] lg:w-64 xl:w-72' : 'w-[68px]'
        )}
      >
        {/* Лого: полный lockup крупнее; свёрнут — зелёный знак из набора бренда */}
        <div
          className={cn(
            'flex flex-col justify-center gap-2 border-b border-sidebar-border shrink-0 py-3',
            sidebarOpen ? 'px-3' : 'px-2 items-center'
          )}
        >
          {sidebarOpen ? (
            <>
              <div className="flex min-h-[4.25rem] w-full items-center justify-center rounded-xl bg-white/[0.09] px-3 py-3">
                <img
                  src={BRAND_LOGO_ON_DARK}
                  alt="TAYMAS"
                  width={280}
                  height={72}
                  className="h-[2.85rem] sm:h-[3.15rem] w-auto max-w-[min(100%,17.5rem)] object-contain object-center"
                />
              </div>
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-muted">
                Управление клубом
              </p>
            </>
          ) : (
            <div className="flex h-[3rem] w-[3rem] items-center justify-center rounded-xl bg-white/[0.09] ring-1 ring-white/10">
              <img
                src={BRAND_MARK_GREEN}
                alt=""
                width={48}
                height={48}
                className="h-11 w-11 object-contain"
              />
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
                  <p className={cn('brand-label px-3 mb-1 text-sidebar-muted', idx > 0 && 'mt-4')}>
                    {section.title}
                  </p>
                )}
                {!sidebarOpen && idx > 0 && (
                  <div className="my-2 h-px w-8 bg-sidebar-border" />
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
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex items-center w-full text-sm transition-colors',
              'text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/6',
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
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex shrink-0 items-start gap-2 border-b border-sidebar-border px-4 py-3">
          <div className="flex min-h-[4rem] min-w-0 flex-1 items-center justify-center rounded-xl bg-white/[0.09] px-3 py-3">
            <img
              src={BRAND_LOGO_ON_DARK}
              alt="TAYMAS"
              width={280}
              height={72}
              className="h-[3rem] w-auto max-w-full object-contain object-center"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="mt-1 shrink-0 rounded-md p-2 text-sidebar-muted transition-colors hover:bg-white/6 hover:text-sidebar-foreground"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleSections.map((section, idx) => (
            <div key={section.title}>
              <p className={cn('brand-label px-3 mb-1 text-sidebar-muted', idx > 0 && 'mt-4')}>
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
            ? 'bg-emerald-500/12 text-sidebar-foreground shadow-[inset_3px_0_0_#00CA74]'
            : 'text-sidebar-muted hover:bg-white/6 hover:text-sidebar-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('shrink-0 transition-colors', isActive && 'text-emerald-400')}>
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
