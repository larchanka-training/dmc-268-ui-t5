import * as React from 'react'
import { cn } from '@/shared/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)}
      ref={ref}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn('p-6 pt-0', className)} ref={ref} {...props} />
))
CardContent.displayName = 'CardContent'

export { Card, CardContent }
