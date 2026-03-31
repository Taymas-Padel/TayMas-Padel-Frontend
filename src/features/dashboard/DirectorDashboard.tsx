import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  TrendingUp,
  CalendarCheck,
  Clock,
  Users,
  UserPlus,
  BarChart3,
  Activity,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/KpiCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDirectorDashboard } from '@/api/analytics'
import { formatMoney } from '@/utils/format'

export function DirectorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['director-dashboard'],
    queryFn: getDirectorDashboard,
    refetchInterval: 5 * 60 * 1000,
  })

  const kpi = data?.kpi

  return (
    <div className="space-y-6">
      <PageHeader
        title="Дашборд директора"
        description={data?.period.month}
      />

      {/* Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Выручка сегодня"
          value={kpi ? formatMoney(kpi.today_revenue) : '—'}
          icon={<DollarSign className="h-5 w-5" />}
          variant="success"
          isLoading={isLoading}
        />
        <KpiCard
          title="Выручка за неделю"
          value={kpi ? formatMoney(kpi.week_revenue) : '—'}
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Выручка за месяц"
          value={kpi ? formatMoney(kpi.month_revenue) : '—'}
          icon={<BarChart3 className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Общая выручка"
          value={kpi ? formatMoney(kpi.total_revenue) : '—'}
          icon={<Activity className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Загрузка сегодня"
          value={kpi?.occupancy_rate_today ?? '—'}
          icon={<Activity className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Броней сегодня"
          value={kpi?.bookings_today ?? 0}
          icon={<CalendarCheck className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Всего клиентов"
          value={kpi?.total_clients ?? 0}
          icon={<Users className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KpiCard
          title="Новых за месяц"
          value={kpi?.new_clients_this_month ?? 0}
          icon={<UserPlus className="h-5 w-5" />}
          variant="success"
          isLoading={isLoading}
        />
      </div>

      {/* Revenue structure */}
      {data?.revenue_structure && (
        <Card>
          <CardHeader>
            <CardTitle>Структура выручки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.revenue_structure.map((item) => {
                const total = data.revenue_structure.reduce((s, i) => s + i.amount, 0)
                const percent = total > 0 ? Math.round((item.amount / total) * 100) : 0
                return (
                  <div key={item.type} className="flex items-center gap-4">
                    <div className="w-40 text-sm text-muted-foreground shrink-0">{item.label}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="w-32 text-sm font-medium text-right shrink-0">
                      {formatMoney(item.amount)}
                    </div>
                    <div className="w-10 text-xs text-muted-foreground shrink-0 text-right">
                      {percent}%
                    </div>
                  </div>
                )
              })}
            </div>
            {data.work_hours && (
              <p className="text-xs text-muted-foreground mt-4">
                Часы работы клуба: {data.work_hours}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          title="Ожидают оплаты"
          value={kpi?.pending_payments ?? 0}
          icon={<Clock className="h-5 w-5" />}
          variant={kpi && kpi.pending_payments > 0 ? 'warning' : 'default'}
          isLoading={isLoading}
        />
        <KpiCard
          title="Броней за неделю"
          value={kpi?.week_bookings ?? 0}
          icon={<CalendarCheck className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
