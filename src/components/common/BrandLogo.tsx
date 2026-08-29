import { type ReactElement } from 'react';
import { cn } from '@lib/utils';
import { useAuthStore } from '@store/authStore';

/** Full lockup (mark + "tellara" + descriptor), for light surfaces. */
const TELLARA_LOCKUP = '/tellara-logo.png';
/**
 * Reverse lockup for dark surfaces (Ink sidebar, auth panel). The wordmark is
 * Porcelain; the plum/violet mark and the amber signal dot are unchanged — the
 * brand manual does not permit flattening the mark to a silhouette.
 */
const TELLARA_LOCKUP_REVERSE = '/tellara-logo-reverse.png';
/** Mark only, for collapsed rails and app-icon surfaces. Minimum size 24px. */
const TELLARA_MARK = '/tellara-mark.png';

interface BrandLogoProps {
  className?: string;
  /**
   * Render the reverse (dark-surface) artwork. Ignored for organization logos,
   * which supply their own artwork and must not be recolored.
   */
  white?: boolean;
  /** Render only the mark. Useful in collapsed sidebars where the lockup is too wide. */
  iconOnly?: boolean;
  alt?: string;
}

/**
 * Brand logo. Renders the active organization's white-label logo when one is
 * configured, otherwise the default Tellara artwork. Size it with a height
 * utility (e.g. `h-8 w-auto`).
 *
 * Clear space: at least the width of the amber signal dot on every side.
 * Minimum digital mark size 24px; minimum full lockup width 132px.
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

  const defaultSrc = iconOnly
    ? TELLARA_MARK
    : white
      ? TELLARA_LOCKUP_REVERSE
      : TELLARA_LOCKUP;

  const src = orgLogo ?? defaultSrc;
  const label = alt ?? org?.name ?? 'Tellara';

  return (
    <img
      src={src}
      alt={label}
      draggable={false}
      className={cn('select-none', iconOnly ? 'object-contain' : 'object-contain', className)}
    />
  );
}

/**
 * "Protected by Tellara" trust lockup. The brand manual requires this to stay
 * on reporter entry and case-login surfaces even under enterprise co-branding,
 * so the protection layer reads as independent of the organization.
 */
export function TrustLockup({
  className,
  white = false,
}: {
  className?: string;
  white?: boolean;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-medium',
        white ? 'text-porcelain/70' : 'text-ink/60',
        className,
      )}
    >
      <img
        src={TELLARA_MARK}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="h-4 w-4 select-none object-contain"
      />
      Protected by <span className="font-semibold">Tellara</span>
    </span>
  );
}
