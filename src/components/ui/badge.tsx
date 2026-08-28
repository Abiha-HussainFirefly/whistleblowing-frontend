import { type ReactNode } from 'react';
import { cn } from '@lib/utils';

const VARIANT_CLASSES = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-100',
  success: 'bg-green-100 text-green-700 dark:bg-emerald-700/40 dark:text-emerald-100',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-700/40 dark:text-amber-100',
  danger: 'bg-red-100 text-red-700 dark:bg-red-700/40 dark:text-red-100',
  info: 'bg-blue-100 text-blue-700 dark:bg-brand-accent/35 dark:text-[#d7fbff]',
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        // eslint-disable-next-line security/detect-object-injection
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
