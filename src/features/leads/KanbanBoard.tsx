import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LeadCard } from './components/LeadCard'
import { LeadDetailModal } from './components/LeadDetailModal'
import { LeadForm } from './components/LeadForm'
import { getKanban, moveLead, createLead } from '@/api/leads'
import { LEAD_STAGES } from '@/constants/leads'
import { parseApiError } from '@/utils/error'
import type { KanbanColumn, LeadStage, CreateLeadData } from '@/types/lead'
import { useMutation } from '@tanstack/react-query'
import { cn } from '@/utils/cn'

export function KanbanBoard() {
  const qc = useQueryClient()
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStage, setCreateStage] = useState<LeadStage>('NEW')

  const { data: serverColumns = [], isLoading } = useQuery({
    queryKey: ['kanban'],
    queryFn: () => getKanban(),
  })
  const [columns, setColumns] = useState<KanbanColumn[]>([])

  function applyMove(
    sourceColumns: KanbanColumn[],
    source: DropResult['source'],
    destination: NonNullable<DropResult['destination']>,
    newStage: LeadStage
  ) {
    const next = sourceColumns.map((col) => ({ ...col, leads: [...col.leads] }))
    const srcCol = next.find((c) => c.stage === source.droppableId)
    const dstCol = next.find((c) => c.stage === destination.droppableId)
    if (!srcCol || !dstCol) return null
    const [moved] = srcCol.leads.splice(source.index, 1)
    if (!moved) return null
    dstCol.leads.splice(destination.index, 0, { ...moved, stage: newStage })
    srcCol.count = srcCol.leads.length
    dstCol.count = dstCol.leads.length
    return next
  }

  const moveMutation = useMutation({
    mutationFn: ({
      id,
      stage,
    }: {
      id: number
      stage: LeadStage
      sourceStage: LeadStage
      previousColumns: KanbanColumn[]
    }) => moveLead(id, stage),
    onError: (err, variables) => {
      toast.error(parseApiError(err))
      setColumns(variables.previousColumns)
      qc.setQueryData(['kanban'], variables.previousColumns)
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateLeadData) => createLead(data),
    onSuccess: () => {
      toast.success('Лид создан')
      setCreateOpen(false)
      qc.invalidateQueries({ queryKey: ['kanban'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  useEffect(() => {
    // Не перетираем optimistic-состояние доски пока move запрос в полёте.
    if (!moveMutation.isPending) {
      setColumns(serverColumns)
    }
  }, [serverColumns, moveMutation.isPending])

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const leadId = Number.parseInt(draggableId, 10)
    const sourceStage = source.droppableId as LeadStage
    const newStage = destination.droppableId as LeadStage
    const previousColumns = columns
    const next = applyMove(columns, source, destination, newStage)
    if (!next) return
    setColumns(next)
    qc.setQueryData(['kanban'], next)
    // Локальная перестановка в пределах одной колонки — без API,
    // иначе сервер вернет старый порядок и визуально откатит карточку.
    if (sourceStage === newStage) return

    moveMutation.mutate({ id: leadId, stage: newStage, sourceStage, previousColumns })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className="flex gap-3 overflow-x-auto pb-4 rounded-xl"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          {columns.map((col) => {
            const meta = LEAD_STAGES[col.stage]
            return (
              <div
                key={col.stage}
                className={cn(
                  'flex flex-col rounded-xl border border-border/70 bg-card',
                  'min-w-[286px] w-[286px] shrink-0',
                  meta.columnSurface,
                  'border-l-2',
                  meta.borderL
                )}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', meta.accentDot)} />
                    <span className={cn('text-[12px] font-medium', meta.accentText)}>
                      {meta.label}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-semibold px-1.5 py-0.5 rounded-md border leading-none',
                        meta.pillBgBorder,
                        'text-foreground/75'
                      )}
                    >
                      {col.count}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCreateStage(col.stage)
                      setCreateOpen(true)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={col.stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 px-2 pb-2 pt-2 space-y-2 min-h-[100px] transition-colors rounded-b-xl',
                        snapshot.isDraggingOver && 'bg-primary/5 dark:bg-primary/10'
                      )}
                    >
                      {col.leads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                          {(drag, snap) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              style={{
                                ...drag.draggableProps.style,
                                opacity: 1,
                                transitionDuration: snap.isDropAnimating ? '120ms' : undefined,
                              }}
                              className={cn(snap.isDragging && 'shadow-xl')}
                            >
                              <LeadCard lead={lead} onClick={() => setSelectedLeadId(lead.id)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      <LeadDetailModal
        leadId={selectedLeadId}
        open={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Новый лид</DialogTitle>
          </DialogHeader>
          <LeadForm
            defaultValues={{ stage: createStage }}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
