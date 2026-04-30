import { Card, CardContent } from '@/components/ui/card'
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

const variantStyles = {
  default: 'border-border bg-card/95',
  success: 'border-emerald-500/25 bg-emerald-500/[0.07]',
  warning: 'border-amber-500/25 bg-amber-500/[0.07]',
  danger: 'border-red-500/25 bg-red-500/[0.07]',
}

const iconStyles = {
  default: 'bg-primary/12 text-primary',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
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
      <Card className="border-border bg-card/95">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2.5 flex-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_24px_hsl(var(--foreground)/0.08)]',
        variantStyles[variant]
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="brand-label text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight truncate mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {icon && (
            <div className={cn('p-2.5 rounded-xl shrink-0', iconStyles[variant])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
