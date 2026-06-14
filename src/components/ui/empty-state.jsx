import React from "react"
import { cn } from "@/lib/utils"

const EmptyState = React.forwardRef(({ className, icon: Icon, title, description, action, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
    {...props}
  >
    {Icon && (
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
    )}
    {title && (
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
    )}
    {description && (
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
    )}
    {action && (
      <div>
        {action}
      </div>
    )}
  </div>
))
EmptyState.displayName = "EmptyState"

export { EmptyState }