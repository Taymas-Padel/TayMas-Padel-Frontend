import type { LeadStage, LeadSource } from '@/types/lead'

export const LEAD_STAGES: Record<LeadStage, { label: string; color: string; bgColor: string }> = {
  NEW: { label: 'Новые обращения', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'В работе', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  NEGOTIATION: { label: 'Переговоры', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  SOLD: { label: 'Успешная продажа', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  LOST: { label: 'Закрыто / потеря', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
}

export const LEAD_SOURCES: Record<LeadSource, string> = {
  PHONE_CALL: 'Звонок',
  INSTAGRAM: 'Instagram',
  WEBSITE: 'Сайт',
  WALK_IN: 'Пришёл сам',
  REFERRAL: 'Рекомендация',
  WHATSAPP: 'WhatsApp',
  OTHER: 'Другое',
}
