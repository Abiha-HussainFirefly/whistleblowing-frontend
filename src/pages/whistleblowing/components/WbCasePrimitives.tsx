import { Button } from '@components/ui/button';
import { cn } from '@lib/utils';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import type { ElementType, ReactElement, ReactNode } from 'react';
import type { WbCaseDetail } from '@features/whistleblowing/types';
import { caseStageFor } from './wbCaseNavigationConfig';

export function ToggleActionButton({
  open,
  onClick,
  children,
  icon: Icon,
  tone = 'default',
}: {
  open: boolean;
  onClick: () => void;
  children: ReactNode;
  icon: ElementType;
  tone?: 'default' | 'success' | 'danger';
}): ReactElement {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50'
      : tone === 'danger'
        ? 'border-destructive/25 text-destructive hover:border-red-300 hover:bg-red-50'
        : 'border-border text-muted-foreground hover:border-brand-accent/40 hover:text-brand-primary';

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn('gap-1.5 transition-all', toneClass, open && 'bg-muted/50 shadow-sm')}
      aria-expanded={open}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {children}
      <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
    </Button>
  );
}

export function InlineActionPanel({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-brand-accent/20 bg-muted/50/80 p-4 shadow-inner">
      {children}
    </div>
  );
}

export function Panel({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon?: ElementType;
  children: ReactNode;
  action?: ReactNode;
}): ReactElement {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/50/70 px-5 py-4">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          {Icon !== undefined && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
              <Icon className="h-4 w-4" />
            </span>
          )}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  label,
}: {
  icon: ElementType;
  label: string;
}): ReactElement {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/50/60 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-muted-foreground/70 shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-muted-foreground/70">{label}</p>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: string | null }): ReactElement {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{label}</dt>
      <dd
        className="notranslate mt-1 text-sm text-foreground"
        translate="no"
        dir="auto"
      >
        {value !== null && value.length > 0 ? value : '—'}
      </dd>
    </div>
  );
}

export function CaseMeta({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function CaseStageProgress({ status }: { status: WbCaseDetail['status'] }): ReactElement {
  const activeStage = caseStageFor(status);
  const stages = ['Submitted', 'Triage', 'Investigation', 'Outcome'];

  return (
    <div className="border-t border-border px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Case progress
        </p>
        <p className="text-xs text-muted-foreground/70">
          {stages.find((_, index) => index === activeStage) ?? stages.at(-1) ?? 'Outcome'} stage
        </p>
      </div>
      <ol className="mt-3 grid grid-cols-4 gap-2">
        {stages.map((stage, index) => {
          const complete = index < activeStage;
          const current = index === activeStage;
          return (
            <li key={stage} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                    complete || current
                      ? 'bg-brand-accent text-white'
                      : 'bg-muted text-muted-foreground/70',
                  )}
                >
                  {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'truncate text-xs font-medium',
                    current || complete ? 'text-foreground' : 'text-muted-foreground/70',
                  )}
                >
                  {stage}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    'ml-8 mt-1 h-0.5 rounded-full',
                    index < activeStage ? 'bg-brand-accent/60' : 'bg-muted',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function RecordBlock({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p
        className="notranslate mt-1 whitespace-pre-wrap text-sm text-foreground"
        translate="no"
        dir="auto"
      >
        {value}
      </p>
    </div>
  );
}
