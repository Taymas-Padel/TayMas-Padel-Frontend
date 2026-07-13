import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ViewMode = 'cards' | 'list'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="text-sm text-muted-foreground">
        Вид отображения
      </div>

      <div className="flex w-full sm:w-auto gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => onChange('cards')}
          className={cn(
            'inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-md px-3 py-2 sm:py-1.5 text-sm font-medium transition-colors min-h-10 sm:min-h-0',
            value === 'cards'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Карточки
        </button>

        <button
          type="button"
          onClick={() => onChange('list')}
          className={cn(
            'inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-md px-3 py-2 sm:py-1.5 text-sm font-medium transition-colors min-h-10 sm:min-h-0',
            value === 'list'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <List className="h-4 w-4" />
          Список
        </button>
      </div>
    </div>
  )
}
