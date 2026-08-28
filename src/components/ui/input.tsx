import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input styled to match the auth screen designs:
 * light gray fill, soft border, navy focus ring, comfortable height.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400',
          'focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/25',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
