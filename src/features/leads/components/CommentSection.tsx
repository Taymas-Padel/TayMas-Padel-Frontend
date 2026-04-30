import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getLeadComments, addLeadComment, deleteLeadComment } from '@/api/leads'
import { parseApiError } from '@/utils/error'
import { getInitials } from '@/utils/format'

interface CommentSectionProps {
  leadId: number
}

export function CommentSection({ leadId }: CommentSectionProps) {
  const qc = useQueryClient()
  const [text, setText] = useState('')

  const invalidateLeadRelatedQueries = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['lead-comments', leadId] }),
      qc.invalidateQueries({ queryKey: ['lead-tasks', leadId] }),
      qc.invalidateQueries({ queryKey: ['lead', leadId] }),
      qc.invalidateQueries({ queryKey: ['kanban'] }),
      qc.invalidateQueries({ queryKey: ['leads'] }),
      qc.invalidateQueries({ queryKey: ['lead-stats'] }),
    ])

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['lead-comments', leadId],
    queryFn: () => getLeadComments(leadId),
  })

  const addMutation = useMutation({
    mutationFn: (t: string) => addLeadComment(leadId, t),
    onSuccess: async () => {
      setText('')
      await invalidateLeadRelatedQueries()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => deleteLeadComment(leadId, commentId),
    onSuccess: async () => {
      await invalidateLeadRelatedQueries()
    },
    onError: (err) => toast.error(parseApiError(err)),
  })

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    addMutation.mutate(trimmed)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Написать комментарий..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
          }}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={addMutation.isPending || !text.trim()}
          className="self-end"
        >
          {addMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Нет комментариев</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(c.author_name, '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author_name}</span>
                  <span className="text-xs text-muted-foreground">{c.created_at_formatted}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 ml-auto text-destructive"
                    onClick={() => deleteMutation.mutate(c.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
