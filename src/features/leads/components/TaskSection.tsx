import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getLeadTasks, addLeadTask, updateLeadTask, deleteLeadTask } from '@/api/leads'
import { parseApiError } from '@/utils/error'
import { cn } from '@/utils/cn'

interface TaskSectionProps {
  leadId: number
}

export function TaskSection({ leadId }: TaskSectionProps) {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDatetime, setDueDatetime] = useState('')

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['lead-tasks', leadId],
    queryFn: () => getLeadTasks(leadId),
  })

  const addMutation = useMutation({
    mutationFn: () => addLeadTask(leadId, { title, due_datetime: dueDatetime }),
    onSuccess: () => {
      setTitle('')
      setDueDatetime('')
      setAddOpen(false)
      qc.invalidateQueries({ queryKey: ['lead-tasks', leadId] })
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ taskId, isDone }: { taskId: number; isDone: boolean }) =>
      updateLeadTask(leadId, taskId, { is_done: isDone }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-tasks', leadId] }),
    onError: (err) => toast.error(parseApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => deleteLeadTask(leadId, taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-tasks', leadId] }),
    onError: (err) => toast.error(parseApiError(err)),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Задачи</span>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(!addOpen)}>
          <Plus className="h-3 w-3" />
          Добавить
        </Button>
      </div>

      {addOpen && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="space-y-1">
            <Label className="text-xs">Название</Label>
            <Input
              placeholder="Позвонить клиенту..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Срок</Label>
            <Input
              type="datetime-local"
              value={dueDatetime}
              onChange={(e) => setDueDatetime(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={() => addMutation.mutate()}
              disabled={!title.trim() || !dueDatetime || addMutation.isPending}
            >
              {addMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">Нет задач</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-2 group">
              <button
                className="mt-0.5 shrink-0"
                onClick={() => toggleMutation.mutate({ taskId: t.id, isDone: !t.is_done })}
              >
                {t.is_done ? (
                  <CheckSquare className="h-4 w-4 text-green-600" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', t.is_done && 'line-through text-muted-foreground')}>
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground">{t.due_datetime_formatted}</p>
                {t.assigned_to_name && (
                  <p className="text-xs text-muted-foreground">{t.assigned_to_name}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                onClick={() => deleteMutation.mutate(t.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
