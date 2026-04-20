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
  default: 'border-slate-200/80',
  success: 'border-emerald-200/80 bg-emerald-50/50',
  warning: 'border-amber-200/80 bg-amber-50/50',
  danger: 'border-red-200/80 bg-red-50/50',
}

const iconStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
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
      <Card className="border-slate-200/80">
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
    <Card className={cn('transition-shadow hover:shadow-sm', variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
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
