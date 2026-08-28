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
        ? 'border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50'
        : 'border-slate-200 text-slate-600 hover:border-brand-accent/40 hover:text-brand-primary';

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn('gap-1.5 transition-all', toneClass, open && 'bg-slate-50 shadow-sm')}
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
    <div className="mt-4 space-y-3 rounded-xl border border-brand-accent/20 bg-slate-50/80 p-4 shadow-inner dark:border-slate-700 dark:bg-slate-900/40">
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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/30">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
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
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center dark:border-slate-700 dark:bg-slate-900/30">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-800">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

export function Field({ label, value }: { label: string; value: string | null }): ReactElement {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd
        className="notranslate mt-1 text-sm text-slate-800 dark:text-slate-200"
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
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}

export function CaseStageProgress({ status }: { status: WbCaseDetail['status'] }): ReactElement {
  const activeStage = caseStageFor(status);
  const stages = ['Submitted', 'Triage', 'Investigation', 'Outcome'];

  return (
    <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Case progress
        </p>
        <p className="text-xs text-slate-400">
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
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-700',
                  )}
                >
                  {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'truncate text-xs font-medium',
                    current || complete ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400',
                  )}
                >
                  {stage}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    'ml-8 mt-1 h-0.5 rounded-full',
                    index < activeStage ? 'bg-brand-accent/60' : 'bg-slate-100 dark:bg-slate-700',
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className="notranslate mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200"
        translate="no"
        dir="auto"
      >
        {value}
      </p>
    </div>
  );
}
