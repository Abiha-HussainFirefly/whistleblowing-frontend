import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@lib/utils';

export type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Full-width brand-green action button used as the primary submit on every
 * auth screen. Green (#007d89) is the platform's action accent; hover darkens
 * to #006a73. Brand blue stays the dominant chrome color.
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, type = 'button', children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white',
        'bg-brand-accent hover:bg-[#006a73]',
        'shadow-[0_6px_18px_-6px_rgba(0,125,137,0.5)] transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-accent/35',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
PrimaryButton.displayName = 'PrimaryButton';
