interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="surface-elevated rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="brand-label mb-1">раздел crm</p>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5 break-words">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto sm:shrink-0 sm:self-start sm:pt-0.5 [&>*]:min-w-0 [&>button]:w-full sm:[&>button]:w-auto [&>a]:w-full sm:[&>a]:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
