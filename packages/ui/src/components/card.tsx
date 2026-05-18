import { cn } from '../lib/utils'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'

// Collapsible Card Component - renders title and toggle on same row
interface CollapsibleCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  streamingIndicator?: React.ReactNode
  defaultExpanded?: boolean
  cardClassName?: string
}

const CollapsibleCard = React.forwardRef<HTMLDivElement, CollapsibleCardProps>(
  ({ title, icon, badge, streamingIndicator, defaultExpanded = false, cardClassName, children, ...props }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card text-card-foreground shadow max-w-[500px] relative pb-3',
          cardClassName,
        )}
        {...props}
      >
        {streamingIndicator && (
          <div className="absolute top-4 right-4">
            {streamingIndicator}
          </div>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full p-6 pb-2 text-left"
        >
          <div className="flex items-center gap-2 text-sm font-semibold leading-none tracking-tight">
            {icon}
            {title}
            {badge}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-2',
              isExpanded ? 'rotate-180' : '',
            )}
          />
        </button>
        {isExpanded && (
          <div className="p-6 pt-2 pb-3">
            {children}
          </div>
        )}
      </div>
    )
  },
)
CollapsibleCard.displayName = 'CollapsibleCard'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow max-w-[500px]',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  toggle?: boolean
  defaultExpanded?: boolean
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, toggle = false, defaultExpanded, children, ...props }, ref) => {
    // When toggle is true: defaultExpanded ?? false (collapsed by default)
    // When toggle is false: always expanded (no toggle UI)
    const [isExpanded, setIsExpanded] = React.useState(
      toggle ? (defaultExpanded ?? false) : true
    )

    if (toggle) {
      return (
        <div ref={ref} className={cn('pt-0', className)} {...props}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-end gap-1 w-full px-6 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{isExpanded ? 'Hide' : 'Show'}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded ? 'rotate-180' : '',
              )}
            />
          </button>
          {isExpanded && <div className="p-6 pt-0">{children}</div>}
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
        {children}
      </div>
    )
  },
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CollapsibleCard }
