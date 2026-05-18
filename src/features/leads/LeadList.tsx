import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LeadDetailModal } from './components/LeadDetailModal'
import { LeadForm } from './components/LeadForm'
import { getLeads, createLead } from '@/api/leads'
import { LEAD_STAGES, LEAD_SOURCES } from '@/constants/leads'
import { useDebounce } from '@/hooks/useDebounce'
import { parseApiError } from '@/utils/error'
import type { LeadStage, CreateLeadData } from '@/types/lead'

export function LeadList({ searchFilter = '' }: { searchFilter?: string }) {
  const qc = useQueryClient()
  const [stage, setStage] = useState<LeadStage | ''>('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const debouncedSearch = useDebounce(searchFilter, 300)

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', { stage, search: debouncedSearch }],
    queryFn: () => getLeads({
      stage: stage || undefined,
      search: debouncedSearch || undefined,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateLeadData) => createLead(data),
    onSuccess: () => {
      toast.success('Лид создан')
      setCreateOpen(false)
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-3 items-center">
          <Select
            value={stage || '_all'}
            onValueChange={(v) => setStage(v === '_all' ? '' : v as LeadStage)}
          >
            <SelectTrigger className="w-[180px] h-9 text-[13px]">
              <SelectValue placeholder="Все стадии" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Все стадии</SelectItem>
              {Object.entries(LEAD_STAGES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">Лиды не найдены</p>
        ) : (
          <div className="surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Стадия</TableHead>
                  <TableHead>Менеджер</TableHead>
                  <TableHead>Создан</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const stageMeta = LEAD_STAGES[lead.stage]
                  return (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedId(lead.id)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-sm">{lead.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {LEAD_SOURCES[lead.source] ?? lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${stageMeta.pillBgBorder} ${stageMeta.accentText}`}
                        >
                          {stageMeta.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{lead.assigned_to_name ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.created_at_formatted}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LeadDetailModal
        leadId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Новый лид</DialogTitle>
          </DialogHeader>
          <LeadForm
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
