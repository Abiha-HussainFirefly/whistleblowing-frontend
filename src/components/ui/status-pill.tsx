import { type ReactElement, type ReactNode } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleSlash,
  Inbox,
  MessageSquareReply,
  ScanSearch,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Status, severity and action are DIFFERENT things (brand manual §12).
 *
 * Collapsing workflow status and case sensitivity into one red/green colour
 * model creates bias before an investigation has reached any finding. So this
 * module deliberately exposes two visually distinct systems:
 *
 *   - `StatusPill`     — where a case is in the workflow (a rounded pill)
 *   - `SeverityMeter`  — how sensitive/urgent it is (a stepped meter)
 *
 * Critical rule: colour supports meaning; it never carries meaning alone. Every
 * state below is rendered as colour + icon + text, in a stable location.
 */

/** The three classes of state a case surface can express. */
export type StateKind = 'workflow' | 'action' | 'operational';

export type StateTone =
  | 'submitted'
  | 'review'
  | 'investigation'
  | 'action'
  | 'priority'
  | 'resolved'
  | 'closed';

interface ToneSpec {
  className: string;
  icon: LucideIcon;
  kind: StateKind;
}

const TONE: Record<StateTone, ToneSpec> = {
  /** The report exists and is awaiting triage. */
  submitted: { className: 'state-submitted', icon: Inbox, kind: 'workflow' },
  /** A case manager is assessing scope and routing. */
  review: { className: 'state-review', icon: Scale, kind: 'workflow' },
  /** The case is actively being investigated. */
  investigation: { className: 'state-investigation', icon: ScanSearch, kind: 'workflow' },
  /** A question is waiting in the protected mailbox. */
  action: { className: 'state-action', icon: MessageSquareReply, kind: 'action' },
  /** Time-sensitive or safeguarding review required. */
  priority: { className: 'state-priority', icon: AlertTriangle, kind: 'operational' },
  /** The case has reached a documented conclusion. */
  resolved: { className: 'state-resolved', icon: CheckCircle2, kind: 'workflow' },
  /** Closed after initial assessment — never "rejected". */
  closed: { className: 'state-submitted', icon: Archive, kind: 'workflow' },
};

export interface StatusPillProps {
  tone: StateTone;
  children: ReactNode;
  /** Hide the icon only where an adjacent column already carries one. */
  showIcon?: boolean;
  className?: string;
}

export function StatusPill({
  tone,
  children,
  showIcon = true,
  className,
}: StatusPillProps): ReactElement {
  // eslint-disable-next-line security/detect-object-injection -- tone is a closed union
  const spec = TONE[tone] ?? TONE.submitted;
  const Icon = spec.icon;

  return (
    <span className={cn('state-pill', spec.className, className)}>
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */

const SEVERITY_STEPS = 4;

export interface SeverityMeterProps {
  /** 1-4. Rendered as filled steps, so the value survives without colour. */
  level: number;
  label: string;
  className?: string;
}

/**
 * Severity is shown as a stepped meter, not a coloured pill, so it can never be
 * mistaken for workflow status at a glance. The filled-step count carries the
 * value on its own; the tint is reinforcement, and the label is always present.
 */
export function SeverityMeter({ level, label, className }: SeverityMeterProps): ReactElement {
  const clamped = Math.min(SEVERITY_STEPS, Math.max(1, Math.round(level)));

  // Amber and red are reserved for the top two levels; the lower levels stay
  // neutral so a routine case never reads as an accusation.
  const fill =
    clamped >= 4
      ? 'bg-state-priority-text'
      : clamped === 3
        ? 'bg-courage-strong'
        : clamped === 2
          ? 'bg-signal'
          : 'bg-ink-muted/45';

  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      role="img"
      aria-label={`${label} (${clamped} of ${SEVERITY_STEPS})`}
    >
      <span className="flex items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: SEVERITY_STEPS }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-3 w-1 rounded-full transition-colors',
              index < clamped ? fill : 'bg-ink/10',
            )}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * "No finding yet" marker. A report is an allegation, not a finding — this is
 * used wherever the UI might otherwise imply an outcome (manual §05).
 */
export function NoFindingYet({ label }: { label: string }): ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      <CircleSlash className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
