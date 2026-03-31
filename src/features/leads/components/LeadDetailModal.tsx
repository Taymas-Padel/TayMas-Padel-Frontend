import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, Mail, User, Edit2, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CommentSection } from './CommentSection'
import { TaskSection } from './TaskSection'
import { LeadForm } from './LeadForm'
import { getLeadDetail, updateLead, deleteLead } from '@/api/leads'
import { LEAD_STAGES, LEAD_SOURCES } from '@/constants/leads'
import { parseApiError } from '@/utils/error'
import type { CreateLeadData } from '@/types/lead'

interface LeadDetailModalProps {
  leadId: number | null
  open: boolean
  onClose: () => void
}

export function LeadDetailModal({ leadId, open, onClose }: LeadDetailModalProps) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => getLeadDetail(leadId!),
    enabled: !!leadId,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateLeadData>) => updateLead(leadId!, data),
    onSuccess: () => {
      toast.success('Лид обновлён')
      setEditing(false)
      qc.invalidateQueries({ queryKey: ['lead', leadId] })
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(leadId!),
    onSuccess: () => {
      toast.success('Лид удалён')
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      onClose()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const stageMutation = useMutation({
    mutationFn: (stage: string) => updateLead(leadId!, { stage: stage as CreateLeadData['stage'] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] })
      qc.invalidateQueries({ queryKey: ['kanban'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{lead?.name ?? 'Лид'}</span>
              {lead && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : lead && !editing ? (
            <div className="space-y-6">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                  {lead.assigned_to_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.assigned_to_name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Источник:</span>
                    <Badge variant="outline" className="text-xs">
                      {LEAD_SOURCES[lead.source] ?? lead.source}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Создан:</span>
                    <span className="text-sm">{lead.created_at_formatted}</span>
                  </div>
                  {lead.last_contact_formatted && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Контакт:</span>
                      <span className="text-sm">{lead.last_contact_formatted}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stage selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium shrink-0">Стадия:</span>
                <Select
                  value={lead.stage}
                  onValueChange={(v) => stageMutation.mutate(v)}
                  disabled={stageMutation.isPending}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_STAGES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium mb-1">Заметки</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="comments">
                <TabsList>
                  <TabsTrigger value="comments">
                    Комментарии
                  </TabsTrigger>
                  <TabsTrigger value="tasks">Задачи</TabsTrigger>
                </TabsList>
                <TabsContent value="comments" className="mt-4">
                  <CommentSection leadId={lead.id} />
                </TabsContent>
                <TabsContent value="tasks" className="mt-4">
                  <TaskSection leadId={lead.id} />
                </TabsContent>
              </Tabs>
            </div>
          ) : lead && editing ? (
            <LeadForm
              defaultValues={lead}
              onSubmit={(data) => updateMutation.mutate(data)}
              isPending={updateMutation.isPending}
              onCancel={() => setEditing(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Удалить лид?"
        description="Это действие нельзя отменить. Лид и все связанные данные будут удалены."
        onConfirm={() => deleteMutation.mutate()}
        isDestructive
      />
    </>
  )
}
