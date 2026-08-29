import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Full-width primary action, used as the submit on every auth screen.
 *
 * Signal Violet (#6F56D9) is the platform's action colour and clears WCAG AA
 * against white at 5.24:1; hover deepens to #5B43C4. Protected Plum stays the
 * dominant chrome colour rather than the action colour.
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, type = 'button', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white',
        'bg-brand-accent hover:bg-signal-strong',
        'shadow-violet transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
PrimaryButton.displayName = 'PrimaryButton';
