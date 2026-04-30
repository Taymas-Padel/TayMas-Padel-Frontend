import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary: "border-transparent bg-muted text-muted-foreground",
        destructive: "border-transparent bg-red-50 text-red-700 border-red-200/60 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900/50",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20",
        warning:
          "border-transparent bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/20",
        info: "border-transparent bg-blue-500/10 text-blue-800 dark:text-blue-200 border-blue-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
