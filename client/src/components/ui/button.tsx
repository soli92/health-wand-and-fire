/**
 * Button — shadcn/ui registry component.
 * Styled with SoliDS semantic Tailwind tokens.
 */

import * as React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:     'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline:     'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost:       'hover:bg-accent hover:text-accent-foreground',
  link:        'text-primary underline-offset-4 hover:underline',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-10 px-4 py-2 text-sm rounded-md',
  lg: 'h-12 px-8 text-base rounded-lg',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
          'ring-offset-background transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
