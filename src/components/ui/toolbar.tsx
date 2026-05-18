import * as React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

/**
 * Toolbar component per spec:
 * - Sticky top, 44px height
 * - Search + filters + view-switcher + create button
 * - Surface with border, compact
 */

interface ToolbarProps {
  className?: string
  children: React.ReactNode
}

export function Toolbar({ className, children }: ToolbarProps) {
  return (
    <div
      className={cn(
        'surface flex items-center gap-3 p-3 flex-wrap',
        className
      )}
    >
      {children}
    </div>
  )
}

interface ToolbarSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function ToolbarSearch({ value, onChange, placeholder = 'Поиск...', className }: ToolbarSearchProps) {
  return (
    <div className={cn('relative flex-1 max-w-sm min-w-[200px]', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 h-9 text-[13px]"
      />
    </div>
  )
}

interface ToolbarGroupProps {
  className?: string
  children: React.ReactNode
}

export function ToolbarGroup({ className, children }: ToolbarGroupProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  )
}

interface ToolbarDividerProps {
  className?: string
}

export function ToolbarDivider({ className }: ToolbarDividerProps) {
  return <div className={cn('w-px h-5 bg-border', className)} />
}

interface ToolbarActionsProps {
  className?: string
  children: React.ReactNode
}

export function ToolbarActions({ className, children }: ToolbarActionsProps) {
  return (
    <div className={cn('flex items-center gap-2 ml-auto', className)}>
      {children}
    </div>
  )
}

/**
 * View switcher (e.g., Kanban / List)
 */
interface ViewSwitcherOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface ToolbarViewSwitcherProps {
  value: string
  onChange: (value: string) => void
  options: ViewSwitcherOption[]
  className?: string
}

export function ToolbarViewSwitcher({ value, onChange, options, className }: ToolbarViewSwitcherProps) {
  return (
    <div className={cn('flex items-center rounded-md border border-border p-0.5 bg-muted/50', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded text-[13px] font-medium transition-colors duration-150',
            value === option.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Bulk action bar (slides up when items selected)
 */
interface BulkActionBarProps {
  selectedCount: number
  onClear: () => void
  className?: string
  children: React.ReactNode
}

export function BulkActionBar({ selectedCount, onClear, className, children }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-40',
        'surface-elevated flex items-center gap-3 px-4 py-3 rounded-lg',
        'animate-in slide-in-from-bottom-4 duration-200',
        className
      )}
    >
      <span className="text-sm font-medium text-foreground">
        {selectedCount} выбрано
      </span>
      <div className="w-px h-5 bg-border" />
      {children}
      <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
        Снять
      </Button>
    </div>
  )
}
