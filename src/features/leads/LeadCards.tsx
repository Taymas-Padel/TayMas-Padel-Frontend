import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Loader2, Phone, Mail, User, MessageSquare, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LeadDetailModal } from './components/LeadDetailModal'
import { LeadForm } from './components/LeadForm'
import { getLeads, createLead } from '@/api/leads'
import { LEAD_STAGES, LEAD_SOURCES } from '@/constants/leads'
import { useDebounce } from '@/hooks/useDebounce'
import { parseApiError } from '@/utils/error'
import { cn } from '@/utils/cn'
import type { LeadStage, CreateLeadData } from '@/types/lead'

export function LeadCards() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<LeadStage | ''>('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

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
      qc.invalidateQueries({ queryKey: ['kanban'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <>
      <div className="space-y-4">
        <div className="surface-elevated rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px] min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, телефону..."
              className="pl-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Новый лид
          </Button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setStage('')}
            className={cn(
              'shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-10',
              stage === ''
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            Все
          </button>
          {Object.entries(LEAD_STAGES).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStage(key as LeadStage)}
              className={cn(
                'shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-10 whitespace-nowrap',
                stage === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {meta.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground text-sm">Лиды не найдены</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {leads.map((lead) => {
              const stageMeta = LEAD_STAGES[lead.stage]
              return (
                <article
                  key={lead.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(lead.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedId(lead.id)
                    }
                  }}
                  className="flex flex-col rounded-xl border bg-card text-card-foreground p-4 shadow-sm cursor-pointer transition hover:bg-muted/30"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      LEAD #{lead.id}
                    </p>
                    <h3 className="text-base font-semibold leading-tight break-words">
                      {lead.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full border',
                          stageMeta.pillBgBorder,
                          stageMeta.accentText
                        )}
                      >
                        {stageMeta.label}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {LEAD_SOURCES[lead.source] ?? lead.source}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm">
                    <p className="flex items-center gap-1.5 text-muted-foreground break-all">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-foreground font-medium">{lead.phone}</span>
                    </p>
                    {lead.email && (
                      <p className="flex items-center gap-1.5 text-muted-foreground break-all">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground font-medium">{lead.email}</span>
                      </p>
                    )}
                    {lead.assigned_to_name && (
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground font-medium truncate">{lead.assigned_to_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>
                      Создан:{' '}
                      <span className="text-foreground font-medium">{lead.created_at_formatted}</span>
                    </p>
                    {lead.last_contact_formatted && (
                      <p>
                        Контакт:{' '}
                        <span className="text-foreground font-medium">{lead.last_contact_formatted}</span>
                      </p>
                    )}
                    {lead.notes && (
                      <p className="line-clamp-2">{lead.notes}</p>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-3 mt-4 border-t text-xs text-muted-foreground">
                    {(lead.comments_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {lead.comments_count}
                      </span>
                    )}
                    {(lead.tasks_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {lead.tasks_count}
                        {(lead.open_tasks_count ?? 0) > 0 && (
                          <span className="text-foreground font-medium">({lead.open_tasks_count})</span>
                        )}
                      </span>
                    )}
                    <span className="ml-auto text-sm font-medium text-foreground">Открыть</span>
                  </div>
                </article>
              )
            })}
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
