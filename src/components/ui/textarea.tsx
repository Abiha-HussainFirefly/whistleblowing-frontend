import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Mirrors the Input treatment. Sized for narrative answers, not one-liners. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[96px] w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70',
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
Textarea.displayName = 'Textarea';
