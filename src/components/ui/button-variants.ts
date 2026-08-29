import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Signal Violet is the digital action colour; Protected Plum carries brand
 * authority and dominant chrome (manual §07). Focus is a 2px+ Violet ring with
 * an offset so it is never clipped (manual §15).
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold',
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-55',
  ].join(' '),
  {
    variants: {
      variant: {
        /** The primary action on a surface. There should only be one. */
        default: 'bg-brand-accent text-white hover:bg-signal-strong',
        /** Brand-authority action — protected/institutional operations. */
        primary: 'bg-brand-primary text-white hover:bg-plum-soft',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-border bg-card text-foreground hover:border-signal/40 hover:bg-signal-tint hover:text-signal-strong',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        /** For dark (Confidential Ink) surfaces. */
        onDark: 'border border-white/15 bg-white/10 text-porcelain hover:bg-white/20',
        link: 'text-brand-accent underline-offset-4 hover:underline',
      },
      size: {
        /* Touch targets are sized for one-handed mobile use (manual §15). */
        default: 'h-11 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-[0.8125rem]',
        lg: 'h-12 rounded-lg px-6',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
