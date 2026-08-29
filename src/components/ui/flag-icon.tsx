import { type ReactElement } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@lib/utils';

interface FlagIconProps {
  /** ISO 3166-1 alpha-2 code (or 'EU'); 'GLOBAL'/empty/unknown → a globe icon. */
  code?: string | undefined;
  /**
   * Render a 1:1 circular flag (square `fis` variant clipped to a circle) instead
   * of the default rectangle — used for avatar-style navbar controls.
   */
  circle?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Small country flag rendered via the `flag-icons` CSS package (real SVGs, not
 * emoji — emoji flags don't render on Windows). Works for any ISO 3166-1 alpha-2
 * code; 'GLOBAL', empty, or an unrecognized code falls back to a globe icon.
 *
 * Size is controlled by font-size (flag-icons sizes the box in `em`), so the
 * default is a tidy ~22×16px; pass a `text-*` class to resize. Set `circle` for a
 * round flag badge.
 */
export function FlagIcon({ code, circle = false, className }: FlagIconProps): ReactElement {
  const cc = (code ?? '').toLowerCase();
  if (cc.length === 0 || code === 'GLOBAL') {
    if (circle) {
      // Sized by font-size (1em box) so it matches the `fis` flag exactly.
      return (
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex h-[1em] w-[1em] shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/70 ring-1 ring-black/10',
            className,
          )}
        >
          <Globe className="h-[0.62em] w-[0.62em]" />
        </span>
      );
    }
    return (
      <span aria-hidden="true" className={cn('inline-flex text-muted-foreground/70', className)}>
        <Globe className="h-4 w-4 shrink-0" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 ring-1 ring-black/10',
        circle
          ? // `fis` = the 1:1 square flag (width/height = 1em); clipped to a circle.
            `fi fis fi-${cc} rounded-full bg-cover bg-center`
          : `fi fi-${cc} rounded-[2px] text-[1.05rem]`,
        className,
      )}
    />
  );
}
