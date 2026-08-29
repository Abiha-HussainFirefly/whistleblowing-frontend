import { type ReactElement, type ReactNode } from 'react';
import { AlertTriangle, Info, Lightbulb, Lock, ShieldCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@lib/utils';

/**
 * Inline notice. Used to reduce fear before asking for information and to
 * explain what the system does and does not do (manual §09, §10).
 *
 * Tone is never alarmist: `caution` is the strongest available level, and it is
 * for process consequences ("this will route the report elsewhere"), not for
 * implying wrongdoing by anyone named in a report.
 */
export type CalloutTone = 'tip' | 'info' | 'protected' | 'caution';

interface ToneSpec {
  wrapper: string;
  iconWrap: string;
  icon: LucideIcon;
}

const TONE: Record<CalloutTone, ToneSpec> = {
  tip: {
    wrapper: 'border-signal/20 bg-signal-tint text-ink',
    iconWrap: 'bg-signal/12 text-signal-strong',
    icon: Lightbulb,
  },
  info: {
    wrapper: 'border-border bg-muted/60 text-ink',
    iconWrap: 'bg-ink/[0.06] text-ink-muted',
    icon: Info,
  },
  protected: {
    wrapper: 'border-plum/20 bg-plum-tint text-ink',
    iconWrap: 'bg-plum/12 text-plum',
    icon: ShieldCheck,
  },
  caution: {
    wrapper: 'border-courage/35 bg-courage-tint text-ink',
    iconWrap: 'bg-courage/20 text-courage-strong',
    icon: AlertTriangle,
  },
};

export interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  children: ReactNode;
  /** Override the tone's default mark. */
  icon?: LucideIcon;
  className?: string;
}

export function Callout({
  tone = 'info',
  title,
  children,
  icon,
  className,
}: CalloutProps): ReactElement {
  // eslint-disable-next-line security/detect-object-injection -- tone is a closed union
  const spec = TONE[tone] ?? TONE.info;
  const Icon = icon ?? spec.icon;

  return (
    <div className={cn('flex gap-3 rounded-xl border p-4', spec.wrapper, className)}>
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          spec.iconWrap,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title !== undefined && <p className="font-semibold">{title}</p>}
        <div className={cn(title !== undefined && 'mt-1', 'text-ink/75')}>{children}</div>
      </div>
    </div>
  );
}

/**
 * Reassurance item for the reporter rail. Explains anonymity and what the
 * system does *not* collect before the first form field (manual §09 rule 01).
 */
export function AssuranceItem({
  icon: Icon = Lock,
  title,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <div className={cn('flex gap-3', className)}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-tint text-signal-strong">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
