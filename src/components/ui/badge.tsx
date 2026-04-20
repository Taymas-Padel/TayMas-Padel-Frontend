import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary: "border-transparent bg-slate-100 text-slate-600",
        destructive: "border-transparent bg-red-50 text-red-700 border-red-200/60",
        outline: "text-foreground border-slate-200",
        success: "border-transparent bg-emerald-50 text-emerald-700 border-emerald-200/60",
        warning: "border-transparent bg-amber-50 text-amber-700 border-amber-200/60",
        info: "border-transparent bg-blue-50 text-blue-700 border-blue-200/60",
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
