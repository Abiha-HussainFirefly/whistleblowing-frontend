import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Styled native textarea — mirrors the Input component's visual treatment:
 * light gray fill, soft border, navy focus ring.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400',
          'focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/25',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
