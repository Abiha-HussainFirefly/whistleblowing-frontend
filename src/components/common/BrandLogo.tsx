import { type ReactElement } from 'react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@store/authStore';

interface BrandLogoProps {
  className?: string;
  /** Render the DEFAULT logo in solid white (for dark backgrounds) via a CSS filter. */
  white?: boolean;
  /** Render only the mark area. Useful in collapsed sidebars where the full lockup is too wide. */
  iconOnly?: boolean;
  alt?: string;
}

/**
 * Brand logo (full lockup). Renders the active organization's white-label logo
 * when one is configured, otherwise the default Civorah logo. Size it with a
 * height utility (e.g. `h-8 w-auto`). On dark surfaces pass `white` to invert the
 * default navy artwork (skipped for org logos, which supply their own artwork).
 */
export function BrandLogo({
  className,
  white = false,
  iconOnly = false,
  alt,
}: BrandLogoProps): ReactElement {
  const org = useAuthStore((s) => s.activeOrganization);
  const orgLogoRaw = org?.logoUrl ?? '';
  const orgLogo = orgLogoRaw !== '' ? orgLogoRaw : null;
  const src = orgLogo ?? '/civorah-logo.png';
  const label = alt ?? org?.name ?? 'Civorah';

  return (
    <img
      src={src}
      alt={label}
      draggable={false}
      className={cn(
        'select-none',
        iconOnly ? 'object-cover object-left' : 'object-contain',
        orgLogo === null && white && 'brightness-0 invert',
        className,
      )}
    />
  );
}
