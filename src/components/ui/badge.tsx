import { type ReactNode } from 'react';
import { cn } from '@lib/utils';

/**
 * Generic label chip.
 *
 * For whistleblowing case state use `StatusPill` / `SeverityMeter` instead —
 * those encode the workflow/action/operational distinction the brand manual
 * requires. This component is for neutral metadata: categories, counts, tags.
 */
const VARIANT_CLASSES = {
  default: 'bg-muted text-muted-foreground border-border',
  neutral: 'bg-muted text-muted-foreground border-border',
  info: 'bg-signal-tint text-signal-strong border-signal/20',
  brand: 'bg-plum-tint text-plum border-plum/20',
  success: 'bg-moss-tint text-moss border-moss/25',
  warning: 'bg-courage-tint text-courage-strong border-courage/30',
  danger: 'bg-state-priority-surface text-state-priority-text border-state-priority-text/20',
} as const;

type BadgeVariant = keyof typeof VARIANT_CLASSES;

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
