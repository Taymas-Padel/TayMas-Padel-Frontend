import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  isLoading?: boolean
}

// Per spec: no heavy shadows, use border-line, subtle background tints
const variantStyles = {
  default: 'border-border bg-card',
  success: 'border-border bg-card',
  warning: 'border-border bg-card',
  danger: 'border-border bg-card',
}

const iconStyles = {
  default: 'text-muted-foreground',
  success: 'text-tm-accent',
  warning: 'text-muted-foreground',
  danger: 'text-muted-foreground',
}

const valueStyles = {
  default: 'text-foreground',
  success: 'text-foreground',
  warning: 'text-foreground',
  danger: 'text-foreground',
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  isLoading,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          {icon && <Skeleton className="h-5 w-5 rounded" />}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('surface p-4', variantStyles[variant])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-caption truncate">{title}</p>
          <p className={cn('text-lg font-semibold tabular-nums mt-0.5 truncate', valueStyles[variant])}>
            {value}
          </p>
          {subtitle && <p className="text-caption mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('shrink-0', iconStyles[variant])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
