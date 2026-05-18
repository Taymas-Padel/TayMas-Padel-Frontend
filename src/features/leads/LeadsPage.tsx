import { useState } from 'react'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { Toolbar, ToolbarSearch, ToolbarViewSwitcher, ToolbarActions } from '@/components/ui/toolbar'
import { KanbanBoard } from './KanbanBoard'
import { LeadList } from './LeadList'

type View = 'kanban' | 'list'

/**
 * Leads Page per spec:
 * - Kanban / List toggle (segmented control)
 * - 280px columns, ~80-100px card height
 * - Counter in column header with potential sum
 * - Drawer on card click
 */
export function LeadsPage() {
  const [view, setView] = useState<View>('kanban')
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Воронка продаж"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Новый лид
          </Button>
        }
      />

      <Toolbar>
        <ToolbarSearch
          value={search}
          onChange={setSearch}
          placeholder="Поиск лидов..."
        />
        <ToolbarViewSwitcher
          value={view}
          onChange={(v) => setView(v as View)}
          options={[
            { value: 'kanban', label: 'Канбан', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
            { value: 'list', label: 'Список', icon: <List className="h-3.5 w-3.5" /> },
          ]}
        />
        <ToolbarActions>
          {/* Manager filter chips would go here */}
        </ToolbarActions>
      </Toolbar>

      {view === 'kanban' && <KanbanBoard searchFilter={search} />}
      {view === 'list' && <LeadList searchFilter={search} />}
    </div>
  )
}
