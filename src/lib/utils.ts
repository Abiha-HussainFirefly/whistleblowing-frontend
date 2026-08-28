import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, deduplicating conflicting utilities.
 * Used by shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Read a CSS custom property (design token) off `:root` at runtime.
 *
 * Brand colours (`--brand-primary`, `--brand-accent`) are white-labelled per
 * organisation by `lib/theme.ts`, so values that must reach JS — notably recharts
 * fills, which can't consume `var(--x)` through the `fill` prop — should be read
 * from the live token rather than hardcoded. Falls back to the supplied default
 * during SSR or before the stylesheet has applied.
 */
export function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}
