import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { ViewModeToggle, type ViewMode } from '@/components/shared/ViewModeToggle'
import { getTransactions, getFinanceSummary } from '@/api/finance'
import { formatMoney } from '@/utils/format'
import { Badge } from '@/components/ui/badge'

type Period = 'today' | 'month' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Сегодня',
  month: 'Месяц',
  all: 'Всё время',
}

function TransactionTable() {
  const [date, setDate] = useState('')
  const [type, setType] = useState('_all')
  const [method, setMethod] = useState('_all')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['transactions', { date }],
    queryFn: () => getTransactions({ date: date || undefined }),
  })

  // Build filter options dynamically from actual backend values
  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const t of allTransactions) {
      if (!seen.has(t.transaction_type)) {
        seen.set(t.transaction_type, t.transaction_type_label)
      }
    }
    return [
      { value: '_all', label: 'Все типы' },
      ...Array.from(seen.entries()).map(([value, label]) => ({ value, label })),
    ]
  }, [allTransactions])

  const methodOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const t of allTransactions) {
      if (!seen.has(t.payment_method)) {
        seen.set(t.payment_method, t.payment_method_label)
      }
    }
    return [
      { value: '_all', label: 'Все способы' },
      ...Array.from(seen.entries()).map(([value, label]) => ({ value, label })),
    ]
  }, [allTransactions])

  const transactions = allTransactions.filter((t) => {
    const matchType = type === '_all' || t.transaction_type === type
    const matchMethod = method === '_all' || t.payment_method === method
    return matchType && matchMethod
  })

  return (
    <div className="space-y-4">
      <div className="surface-elevated rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full sm:w-[160px]"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Все типы" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Все способы" />
          </SelectTrigger>
          <SelectContent>
            {methodOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(date || type !== '_all' || method !== '_all') && (
          <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => { setDate(''); setType('_all'); setMethod('_all') }}>
            Сбросить
          </Button>
        )}
      </div>

      <ViewModeToggle value={viewMode} onChange={setViewMode} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground text-sm">Транзакции не найдены</p>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {transactions.map((t) => (
            <article
              key={t.id}
              className="flex flex-col rounded-xl border bg-card text-card-foreground p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <h3 className="text-base font-semibold leading-tight break-words">
                    {t.transaction_type_label}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t.created_at_formatted}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  #{t.id}
                </Badge>
              </div>

              <p className="mt-4 text-xl font-bold tracking-tight">{formatMoney(t.amount)}</p>

              <div className="mt-3 space-y-1.5 text-sm">
                <p className="text-muted-foreground">
                  Оплата: <span className="text-foreground font-medium">{t.payment_method_label}</span>
                </p>
                {t.description && (
                  <p className="text-muted-foreground line-clamp-3" title={t.description}>
                    {t.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface-elevated rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Способ оплаты</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{t.created_at_formatted}</TableCell>
                  <TableCell>{t.transaction_type_label}</TableCell>
                  <TableCell>{t.payment_method_label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[260px]">
                    <span title={t.description ?? ''} className="line-clamp-2 cursor-default">
                      {t.description}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function SummaryTab() {
  const [period, setPeriod] = useState<Period>('today')

  const { data, isLoading } = useQuery({
    queryKey: ['finance-summary', period],
    queryFn: () => getFinanceSummary(period),
  })

  return (
    <div className="space-y-6">
      <div className="surface-elevated rounded-xl p-2 inline-flex gap-2">
        {(['today', 'month', 'all'] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          <Card className="surface-elevated rounded-xl">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Итого</p>
              <p className="text-4xl font-bold mt-1">{formatMoney(data.total.toString())}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="surface-elevated rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  По способу оплаты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(data.by_payment_method).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span>{key}</span>
                    <span className="font-medium">{formatMoney(value.toString())}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="surface-elevated rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  По типу операции
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(data.by_type).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span>{key}</span>
                    <span className="font-medium">{formatMoney(value.toString())}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Финансы" description="Транзакции и финансовая сводка" />

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
          <TabsTrigger value="summary">Сводка</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-6">
          <TransactionTable />
        </TabsContent>
        <TabsContent value="summary" className="mt-6">
          <SummaryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
