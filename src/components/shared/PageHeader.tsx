interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="surface-elevated rounded-xl px-5 py-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="brand-label mb-1">раздел crm</p>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 self-start pt-0.5">{actions}</div>}
    </div>
  )
}
