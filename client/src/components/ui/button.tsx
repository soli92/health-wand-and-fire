/**
 * Button — shadcn/ui registry component (local copy).
 * Variants: default, destructive, outline, secondary, ghost, link.
 */

import * as React from 'react'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize    = 'default' | 'sm' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  default:     'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  outline:     'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
  secondary:   'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
  ghost:       'hover:bg-accent hover:text-accent-foreground',
  link:        'text-primary underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2 text-sm',
  sm:      'h-8 rounded-md px-3 text-xs',
  lg:      'h-11 rounded-md px-8 text-base',
  icon:    'h-9 w-9',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const base = [
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',
      'ring-offset-background transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].join(' ')

    return <button ref={ref} className={base} {...props} />
  },
)
Button.displayName = 'Button'

export { Button }
