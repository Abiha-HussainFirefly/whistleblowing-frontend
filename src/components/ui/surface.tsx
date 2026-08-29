import { type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '@lib/utils';

/**
 * Tellara content surfaces.
 *
 * The management environment uses a denser information architecture but avoids
 * visual drama (manual §11): flat surfaces, a single hairline border, and no
 * heavy shadow. Elevation is reserved for genuinely floating chrome.
 */

export type SurfaceTone = 'default' | 'quiet' | 'protected' | 'accent';

const TONE_CLASS: Record<SurfaceTone, string> = {
  /** The standard white card. */
  default: 'border-border bg-card text-card-foreground',
  /** A recessed panel — supporting content, not the main object. */
  quiet: 'border-border bg-muted/50 text-card-foreground',
  /** Confidential Ink. Protected follow-up, secure-environment notices. */
  protected: 'border-white/10 bg-ink text-porcelain',
  /** Violet-tinted, for the one card on a screen that invites the next action. */
  accent: 'border-signal/20 bg-signal-tint text-ink',
};

export interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  /** Remove the default padding when the card owns its own internal layout. */
  flush?: boolean;
  /** Adds the 1px hover lift. Only for cards that are themselves clickable. */
  interactive?: boolean;
}

export function SurfaceCard({
  tone = 'default',
  flush = false,
  interactive = false,
  className,
  children,
  ...props
}: SurfaceCardProps): ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border',
        interactive && 'lift',
        // eslint-disable-next-line security/detect-object-injection -- tone is a closed union
        TONE_CLASS[tone] ?? TONE_CLASS.default,
        flush ? '' : 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned affordance — "View all", a filter, an export. */
  action?: ReactNode;
  /** Leading mark. Keep it small; the heading is the object, not the icon. */
  icon?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  icon,
  className,
}: SectionHeaderProps): ReactElement {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon !== undefined && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-tint text-signal-strong [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{title}</h3>
          {description !== undefined && (
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action !== undefined && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Case identifier. Monospaced so characters that are easy to transcribe wrong
 * (0/O, 1/l) stay distinguishable — a reporter may be copying this by hand from
 * a screen they cannot save (manual §08).
 */
export function CaseId({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <span className={cn('case-id text-sm font-semibold text-foreground', className)} translate="no">
      {children}
    </span>
  );
}
