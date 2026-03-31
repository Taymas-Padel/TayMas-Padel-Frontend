import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getLeadStats } from '@/api/leads'
import { LEAD_STAGES } from '@/constants/leads'

export function LeadStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: getLeadStats,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего лидов</p>
                <p className="text-3xl font-bold mt-1">{data.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Продаж</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{data.sold_count}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Конверсия</p>
                <p className="text-3xl font-bold mt-1 text-primary">
                  {data.conversion_rate.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение по стадиям</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.stages.map((s) => {
            const meta = LEAD_STAGES[s.stage]
            return (
              <div key={s.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                  <span className="text-muted-foreground">
                    {s.count} ({s.percent.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={s.percent} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
