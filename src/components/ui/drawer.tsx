import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Drawer component per spec:
 * - 480px width, slide-in from right
 * - Radix Dialog with side="right"
 * - Overlay bg-ink/40 (no blur per spec)
 * - shadow-xl only on drawer itself
 * - Closes on Esc
 */

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function Drawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-foreground/40',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed right-0 top-0 z-50 h-full w-full max-w-[480px]',
            'bg-card border-l border-border shadow-xl',
            'flex flex-col overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            'duration-200',
            className
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border shrink-0">
              <div className="min-w-0">
                {title && (
                  <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="text-sm text-muted-foreground mt-0.5">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close
                className={cn(
                  'h-8 w-8 rounded-md flex items-center justify-center',
                  'text-muted-foreground hover:text-foreground hover:bg-muted',
                  'transition-colors duration-150'
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Закрыть</span>
              </DialogPrimitive.Close>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface DrawerHeaderProps {
  className?: string
  children: React.ReactNode
}

export function DrawerHeader({ className, children }: DrawerHeaderProps) {
  return (
    <div className={cn('px-5 py-4 border-b border-border', className)}>
      {children}
    </div>
  )
}

interface DrawerContentProps {
  className?: string
  children: React.ReactNode
}

export function DrawerContent({ className, children }: DrawerContentProps) {
  return (
    <div className={cn('p-5', className)}>
      {children}
    </div>
  )
}

interface DrawerFooterProps {
  className?: string
  children: React.ReactNode
}

export function DrawerFooter({ className, children }: DrawerFooterProps) {
  return (
    <div className={cn('px-5 py-4 border-t border-border mt-auto shrink-0', className)}>
      {children}
    </div>
  )
}

interface DrawerSectionProps {
  title?: string
  className?: string
  children: React.ReactNode
}

export function DrawerSection({ title, className, children }: DrawerSectionProps) {
  return (
    <div className={cn('py-4', className)}>
      {title && (
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-5">
          {title}
        </h3>
      )}
      <div className="px-5">
        {children}
      </div>
    </div>
  )
}
