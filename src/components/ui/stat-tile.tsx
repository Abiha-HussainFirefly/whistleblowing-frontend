import { type ReactElement, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Dashboard metric tile.
 *
 * A rising or falling count is a fact, not a verdict: "open reports up 3" can
 * mean the channel is trusted, not that the organization is failing. So the
 * delta is rendered neutrally by default, and `deltaTone` must be set
 * explicitly on the rare metric where a direction genuinely is good or bad
 * (e.g. average time to resolve).
 */
export type DeltaDirection = 'up' | 'down' | 'flat';
export type DeltaTone = 'neutral' | 'positive' | 'negative';

const DELTA_ICON: Record<DeltaDirection, LucideIcon> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
};

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  neutral: 'text-ink-muted',
  positive: 'text-moss',
  negative: 'text-state-priority-text',
};

export interface StatTileProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  /** Tailwind classes for the icon chip — pass one of the brand tint pairs. */
  iconClassName?: string;
  delta?: {
    direction: DeltaDirection;
    label: string;
    tone?: DeltaTone;
  };
  className?: string;
}

export function StatTile({
  label,
  value,
  icon: Icon,
  iconClassName = 'bg-signal-tint text-signal-strong',
  delta,
  className,
}: StatTileProps): ReactElement {
  const DeltaIcon = delta === undefined ? null : DELTA_ICON[delta.direction];
  const deltaClass =
    delta === undefined ? '' : DELTA_TONE_CLASS[delta.tone ?? 'neutral'];

  return (
    <div
      className={cn(
        'lift wash-card rounded-xl border border-border bg-card p-4 hover:border-signal/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      {delta !== undefined && DeltaIcon !== null && (
        <p className={cn('mt-2 flex items-center gap-1 text-xs font-medium', deltaClass)}>
          <DeltaIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {delta.label}
        </p>
      )}
    </div>
  );
}
