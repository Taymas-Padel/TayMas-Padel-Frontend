import { useState } from 'react'
import { LayoutGrid, List, Columns3, BarChart2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { KanbanBoard } from './KanbanBoard'
import { LeadList } from './LeadList'
import { LeadCards } from './LeadCards'
import { LeadStats } from './LeadStats'
import { cn } from '@/utils/cn'

type View = 'kanban' | 'list' | 'cards' | 'stats'

function getDefaultView(): View {
  if (typeof window === 'undefined') return 'kanban'
  return window.matchMedia('(max-width: 767px)').matches ? 'cards' : 'kanban'
}

const VIEW_OPTIONS: Array<{ value: View; label: string; icon: typeof LayoutGrid }> = [
  { value: 'cards', label: 'Карточки', icon: LayoutGrid },
  { value: 'kanban', label: 'Канбан', icon: Columns3 },
  { value: 'list', label: 'Список', icon: List },
  { value: 'stats', label: 'Статистика', icon: BarChart2 },
]

export function LeadsPage() {
  const [view, setView] = useState<View>(getDefaultView)

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        title="Воронка продаж"
        description="Управление лидами и отслеживание сделок"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Вид отображения
        </div>
        <div className="flex w-full sm:w-auto gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
          {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={cn(
                'inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-md px-3 py-2 sm:py-1.5 text-sm font-medium transition-colors min-h-10 sm:min-h-0 whitespace-nowrap',
                view === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'cards' && <LeadCards />}
      {view === 'kanban' && <KanbanBoard />}
      {view === 'list' && <LeadList />}
      {view === 'stats' && <LeadStats />}
    </div>
  )
}
