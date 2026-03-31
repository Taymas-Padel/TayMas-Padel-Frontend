import { useState } from 'react'
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

export function KanbanBoard() {
  const qc = useQueryClient()
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStage, setCreateStage] = useState<LeadStage>('NEW')

  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['kanban'],
    queryFn: () => getKanban(),
  })

  const moveMutation = useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: LeadStage }) => moveLead(id, stage),
    onError: (err) => {
      toast.error(parseApiError(err))
      qc.invalidateQueries({ queryKey: ['kanban'] })
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

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const leadId = parseInt(draggableId)
    const newStage = destination.droppableId as LeadStage

    // Optimistic update
    qc.setQueryData<KanbanColumn[]>(['kanban'], (old) => {
      if (!old) return old
      const next = old.map((col) => ({ ...col, leads: [...col.leads] }))
      const srcCol = next.find((c) => c.stage === source.droppableId)
      const dstCol = next.find((c) => c.stage === destination.droppableId)
      if (!srcCol || !dstCol) return old
      const [moved] = srcCol.leads.splice(source.index, 1)
      dstCol.leads.splice(destination.index, 0, { ...moved, stage: newStage })
      srcCol.count = srcCol.leads.length
      dstCol.count = dstCol.leads.length
      return next
    })

    moveMutation.mutate({ id: leadId, stage: newStage })
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
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {columns.map((col) => {
            const meta = LEAD_STAGES[col.stage]
            return (
              <div key={col.stage} className={`flex flex-col rounded-xl border-2 ${meta.bgColor} min-w-[260px] w-[260px] shrink-0`}>
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/70 ${meta.color}`}>
                      {col.count}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
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
                      className={`flex-1 px-2 pb-2 space-y-2 min-h-[100px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-black/5 rounded-b-xl' : ''
                      }`}
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
                                opacity: snap.isDragging ? 0.8 : 1,
                              }}
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
