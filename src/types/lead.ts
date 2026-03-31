export type LeadStage = 'NEW' | 'IN_PROGRESS' | 'NEGOTIATION' | 'SOLD' | 'LOST'
export type LeadSource = 'PHONE_CALL' | 'INSTAGRAM' | 'WEBSITE' | 'WALK_IN' | 'REFERRAL' | 'WHATSAPP' | 'OTHER'

export interface LeadComment {
  id: number
  text: string
  author: number
  author_name: string
  created_at: string
  created_at_formatted: string
}

export interface LeadTask {
  id: number
  title: string
  due_datetime: string
  due_datetime_formatted: string
  assigned_to: number | null
  assigned_to_name: string | null
  is_done: boolean
  created_at: string
}

export interface Lead {
  id: number
  name: string
  phone: string
  email: string | null
  source: LeadSource
  source_label: string
  stage: LeadStage
  stage_label: string
  assigned_to: number | null
  assigned_to_name: string | null
  last_contact: string | null
  last_contact_formatted: string | null
  created_at: string
  created_at_formatted: string
  comments_count?: number
  tasks_count?: number
  open_tasks_count?: number
  comments?: LeadComment[]
  tasks?: LeadTask[]
  notes?: string
}

export interface KanbanColumn {
  stage: LeadStage
  label: string
  count: number
  leads: Lead[]
}

export interface LeadStats {
  total: number
  sold_count: number
  conversion_rate: number
  stages: Array<{
    stage: LeadStage
    label: string
    count: number
    percent: number
  }>
}

export interface CreateLeadData {
  name: string
  phone: string
  email?: string
  source?: LeadSource
  stage?: LeadStage
  notes?: string
  assigned_to?: number | null
  last_contact?: string | null
}
