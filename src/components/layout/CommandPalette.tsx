import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
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
  Plus,
  Search,
  User,
  Calendar,
  FileText,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CommandItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  keywords?: string[]
}

interface CommandGroup {
  heading: string
  items: CommandItem[]
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const goTo = useCallback(
    (path: string) => {
      navigate(path)
      onOpenChange(false)
    },
    [navigate, onOpenChange]
  )

  // Mock client/booking data for demo
  const mockClients = [
    { id: 1, name: 'Иванов Алексей', phone: '+7 707 123 45 67' },
    { id: 2, name: 'Петрова Мария', phone: '+7 701 234 56 78' },
    { id: 3, name: 'Сидоров Константин', phone: '+7 702 345 67 89' },
  ]

  const mockBookings = [
    { id: 1, name: 'Корт 1 · 14:00', client: 'Иванов А.' },
    { id: 2, name: 'Корт 3 · 15:30', client: 'Петрова М.' },
  ]

  const groups: CommandGroup[] = [
    {
      heading: 'Навигация',
      items: [
        { id: 'nav-dashboard', label: 'Дашборд', icon: LayoutDashboard, action: () => goTo(ROUTES.DASHBOARD), keywords: ['главная', 'home'] },
        { id: 'nav-analytics', label: 'Аналитика', icon: BarChart3, action: () => goTo(ROUTES.DASHBOARD_DIRECTOR), keywords: ['директор', 'отчеты'] },
        { id: 'nav-schedule', label: 'Расписание', icon: CalendarRange, action: () => goTo(ROUTES.BOOKINGS_SCHEDULE), keywords: ['корты', 'время'] },
        { id: 'nav-bookings', label: 'Бронирования', icon: BookOpen, action: () => goTo(ROUTES.BOOKINGS), keywords: ['брони', 'список'] },
        { id: 'nav-clients', label: 'Клиенты', icon: Users, action: () => goTo(ROUTES.CLIENTS), keywords: ['база', 'контакты'] },
        { id: 'nav-leads', label: 'Лиды', icon: GitBranch, action: () => goTo(ROUTES.LEADS), keywords: ['воронка', 'продажи'] },
        { id: 'nav-memberships', label: 'Абонементы', icon: Ticket, action: () => goTo(ROUTES.MEMBERSHIPS), keywords: ['подписки'] },
        { id: 'nav-finance', label: 'Финансы', icon: Wallet, action: () => goTo(ROUTES.FINANCE), keywords: ['деньги', 'транзакции'] },
        { id: 'nav-qr', label: 'QR-сканер', icon: QrCode, action: () => goTo(ROUTES.QR_SCANNER), keywords: ['сканировать'] },
        { id: 'nav-tournaments', label: 'Турниры', icon: Trophy, action: () => goTo(ROUTES.TOURNAMENTS), keywords: ['соревнования'] },
        { id: 'nav-settings', label: 'Настройки', icon: Settings2, action: () => goTo(ROUTES.MANAGE_SETTINGS), keywords: ['управление'] },
      ],
    },
    {
      heading: 'Действия',
      items: [
        { id: 'action-new-booking', label: 'Создать бронь', icon: Plus, action: () => goTo(ROUTES.BOOKINGS_SCHEDULE), keywords: ['забронировать', 'новая'] },
        { id: 'action-new-client', label: 'Добавить клиента', icon: Plus, action: () => goTo(ROUTES.CLIENTS), keywords: ['новый клиент'] },
        { id: 'action-issue-membership', label: 'Выдать абонемент', icon: Plus, action: () => goTo(ROUTES.MEMBERSHIPS_ISSUE), keywords: ['новый абонемент'] },
      ],
    },
    {
      heading: 'Клиенты',
      items: mockClients.map((client) => ({
        id: `client-${client.id}`,
        label: client.name,
        icon: User,
        action: () => goTo(ROUTES.CLIENT_DETAIL(client.id)),
        keywords: [client.phone],
      })),
    },
    {
      heading: 'Бронирования',
      items: mockBookings.map((booking) => ({
        id: `booking-${booking.id}`,
        label: booking.name,
        icon: Calendar,
        action: () => goTo(ROUTES.BOOKINGS_SCHEDULE),
        keywords: [booking.client],
      })),
    },
  ]

  // Reset search on close
  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <Command
          className="rounded-lg border-0"
          filter={(value, search) => {
            // Custom filter to include keywords
            if (value.toLowerCase().includes(search.toLowerCase())) return 1
            return 0
          }}
        >
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Поиск команд, клиентов, броней..."
              className="flex-1 h-11 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </Command.Empty>

            {groups.map((group) => (
              <Command.Group
                key={group.heading}
                heading={group.heading}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.keywords?.join(' ') ?? ''}`}
                      onSelect={item.action}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer',
                        'text-sm text-foreground',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{item.label}</span>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">↑↓</kbd>
              навигация
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">↵</kbd>
              выбрать
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">Esc</kbd>
              закрыть
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
