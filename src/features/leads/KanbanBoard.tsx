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

/**
 * Kanban Board per spec:
 * - 280px columns (not Trello-style thick)
 * - 80-100px card height
 * - Counter + potential sum in header
 * - Drag-and-drop via @hello-pangea/dnd
 * - Drawer on card click
 */
export function KanbanBoard({ searchFilter = '' }: { searchFilter?: string }) {
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
                  'flex flex-col rounded-lg border border-border bg-card',
                  'min-w-[280px] w-[280px] shrink-0'
                )}
              >
                {/* Column header per spec */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
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
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Drop zone */}
                <Droppable droppableId={col.stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 px-2 pb-2 pt-2 space-y-2 min-h-[100px] transition-colors duration-150 rounded-b-lg',
                        snapshot.isDraggingOver && 'bg-foreground/[0.03]'
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
