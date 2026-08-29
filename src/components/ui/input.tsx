import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input. Calm porcelain fill, hairline border, and a 2px Violet focus ring
 * that is never clipped — a reporter may be completing this form on a phone,
 * one-handed, under stress (manual §15).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-border bg-muted/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/70',
          'transition-colors focus:border-signal focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring',
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive/25',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
