import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { getAllMemberships } from '@/api/memberships'
import { formatDate } from '@/utils/date'

export function MembershipsPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['memberships', { activeFilter }],
    queryFn: () =>
      getAllMemberships({
        is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
      }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Абонементы"
        description="Все выданные абонементы клиентов"
      />

      <div className="flex gap-3 items-center">
        <Select
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все абонементы</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="inactive">Неактивные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : memberships.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Абонементы не найдены</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Начало</TableHead>
                <TableHead>Конец</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.user_name}</TableCell>
                  <TableCell>{m.membership_type_name}</TableCell>
                  <TableCell className="text-sm">{formatDate(m.start_date)}</TableCell>
                  <TableCell className="text-sm">{formatDate(m.end_date)}</TableCell>
                  <TableCell className="text-sm">
                    {m.hours_remaining != null
                      ? `${m.hours_remaining} ч`
                      : m.visits_remaining != null
                      ? `${m.visits_remaining} вис.`
                      : '—'}
                  </TableCell>
                  <TableCell><ActiveBadge isActive={m.is_active} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
