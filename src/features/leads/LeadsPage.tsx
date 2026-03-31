import { useState } from 'react'
import { LayoutGrid, List, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { KanbanBoard } from './KanbanBoard'
import { LeadList } from './LeadList'
import { LeadStats } from './LeadStats'

type View = 'kanban' | 'list' | 'stats'

export function LeadsPage() {
  const [view, setView] = useState<View>('kanban')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Воронка продаж"
        description="Управление лидами и отслеживание сделок"
        actions={
          <div className="flex items-center rounded-lg border p-0.5 gap-0.5">
            <Button
              variant={view === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
              Список
            </Button>
            <Button
              variant={view === 'stats' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('stats')}
            >
              <BarChart2 className="h-4 w-4" />
              Статистика
            </Button>
          </div>
        }
      />

      {view === 'kanban' && <KanbanBoard />}
      {view === 'list' && <LeadList />}
      {view === 'stats' && <LeadStats />}
    </div>
  )
}
