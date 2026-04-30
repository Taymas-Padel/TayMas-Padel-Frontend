import { Phone, User, MessageSquare, CheckSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LEAD_SOURCES } from '@/constants/leads'
import type { Lead } from '@/types/lead'

interface LeadCardProps {
  lead: Lead
  onClick: () => void
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  return (
    <div
      className="bg-card border border-border/80 rounded-lg p-3 cursor-pointer transition-all hover:border-border hover:bg-background/80 hover:shadow-[0_10px_24px_hsl(var(--foreground)/0.08)] space-y-2"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-tabular-brand">
            LEAD #{lead.id}
          </p>
          <p className="font-medium text-sm leading-tight">{lead.name}</p>
        </div>
        {(lead.open_tasks_count ?? 0) > 0 && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {lead.open_tasks_count}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground border-t border-border/60 pt-2">
        <Phone className="h-3 w-3" />
        <span>{lead.phone}</span>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {LEAD_SOURCES[lead.source] ?? lead.source}
        </Badge>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-tabular-brand">
          {(lead.comments_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 rounded-md border border-border/70 px-1.5 py-0.5">
              <MessageSquare className="h-3 w-3" />
              {lead.comments_count}
            </span>
          )}
          {(lead.tasks_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 rounded-md border border-border/70 px-1.5 py-0.5">
              <CheckSquare className="h-3 w-3" />
              {lead.tasks_count}
            </span>
          )}
        </div>
      </div>

      {lead.assigned_to_name && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{lead.assigned_to_name}</span>
        </div>
      )}
    </div>
  )
}
