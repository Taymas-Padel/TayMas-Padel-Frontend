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
      className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-tight">{lead.name}</p>
        {(lead.open_tasks_count ?? 0) > 0 && (
          <Badge variant="destructive" className="text-xs shrink-0">
            {lead.open_tasks_count}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Phone className="h-3 w-3" />
        <span>{lead.phone}</span>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {LEAD_SOURCES[lead.source] ?? lead.source}
        </Badge>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(lead.comments_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {lead.comments_count}
            </span>
          )}
          {(lead.tasks_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5">
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
