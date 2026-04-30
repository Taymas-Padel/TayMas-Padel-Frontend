import type { LeadStage, LeadSource } from '@/types/lead'

export const LEAD_STAGES: Record<
  LeadStage,
  {
    label: string
    accentText: string
    accentDot: string
    columnSurface: string
    borderL: string
    pillBgBorder: string
  }
> = {
  NEW: {
    label: 'Новые обращения',
    accentText: 'text-foreground/85 dark:text-foreground/85',
    accentDot: 'bg-zinc-500 dark:bg-zinc-400',
    columnSurface: 'bg-muted/25 dark:bg-[#141922]',
    borderL: 'border-l-zinc-500/30 dark:border-l-zinc-400/25',
    pillBgBorder: 'bg-muted/45 border-border/70 dark:bg-white/[0.03] dark:border-white/10',
  },
  IN_PROGRESS: {
    label: 'В работе',
    accentText: 'text-foreground/85 dark:text-foreground/85',
    accentDot: 'bg-sky-600 dark:bg-sky-400',
    columnSurface: 'bg-muted/25 dark:bg-[#141922]',
    borderL: 'border-l-sky-700/30 dark:border-l-sky-400/25',
    pillBgBorder:
      'bg-muted/45 border-sky-700/25 dark:bg-sky-400/10 dark:border-sky-300/20',
  },
  NEGOTIATION: {
    label: 'Переговоры',
    accentText: 'text-foreground/85 dark:text-foreground/85',
    accentDot: 'bg-amber-600 dark:bg-amber-400',
    columnSurface: 'bg-muted/25 dark:bg-[#141922]',
    borderL: 'border-l-amber-700/30 dark:border-l-amber-400/25',
    pillBgBorder:
      'bg-muted/45 border-amber-700/25 dark:bg-amber-400/10 dark:border-amber-300/20',
  },
  SOLD: {
    label: 'Успешная продажа',
    accentText: 'text-foreground/85 dark:text-foreground/85',
    accentDot: 'bg-emerald-600 dark:bg-emerald-400',
    columnSurface: 'bg-muted/25 dark:bg-[#141922]',
    borderL: 'border-l-emerald-700/30 dark:border-l-emerald-400/25',
    pillBgBorder:
      'bg-muted/45 border-emerald-700/25 dark:bg-emerald-400/10 dark:border-emerald-300/20',
  },
  LOST: {
    label: 'Закрыто / потеря',
    accentText: 'text-foreground/85 dark:text-foreground/85',
    accentDot: 'bg-rose-600 dark:bg-rose-400',
    columnSurface: 'bg-muted/25 dark:bg-[#141922]',
    borderL: 'border-l-rose-700/30 dark:border-l-rose-400/25',
    pillBgBorder:
      'bg-muted/45 border-rose-700/25 dark:bg-rose-400/10 dark:border-rose-300/20',
  },
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
