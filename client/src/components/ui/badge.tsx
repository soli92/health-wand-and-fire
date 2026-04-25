/**
 * Badge — shadcn/ui registry component.
 * Styled with SoliDS semantic tokens.
 */

import * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:     'border-transparent bg-primary text-primary-foreground',
  secondary:   'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  outline:     'text-foreground border-border',
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5',
        'text-xs font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    />
  )
}
