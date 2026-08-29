import { Button } from '@components/ui/button';
import type { WhistleblowingStatus } from '@features/whistleblowing/types';
import { formatDate } from '@features/whistleblowing/utils/format';
import { cn } from '@lib/utils';
import { ChevronDown } from 'lucide-react';
import type { ElementType, ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { WB_CASE_TABS, type TabKey, type WbCaseTab } from './wbCaseConsoleConfig';

export function CaseTabNav({
  activeTab,
  onChange,
  getLabel,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  getLabel: (tab: WbCaseTab) => string;
}): ReactElement {
  return (
    <nav
      aria-label="Case detail sections"
      className="overflow-x-auto border-b border-border"
    >
      <div className="flex min-w-max gap-1" role="tablist" aria-label="Case detail sections">
        {WB_CASE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const label = getLabel(tab);

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`case-tabpanel-${tab.key}`}
              onClick={() => {
                onChange(tab.key);
              }}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'border-brand-accent text-brand-primary dark:text-white'
                  : 'border-transparent text-muted-foreground hover:border-signal/40 hover:text-brand-primary dark:hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function CaseSection({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: ElementType;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <section
      className={cn(
        'min-w-0 overflow-x-clip rounded-lg border border-border bg-white',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-brand-primary dark:text-white">
          {Icon !== undefined && <Icon className="h-5 w-5 text-brand-accent" aria-hidden="true" />}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function CaseProgress({
  status,
  submittedAt,
  triagedAt,
  assignedAt,
  closedAt,
}: {
  status: WhistleblowingStatus;
  submittedAt: string;
  triagedAt: string | null;
  assignedAt: string | null;
  closedAt: string | null;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const currentStage = progressStageFor(status);
  const steps = [
    {
      label: t('caseConsole.progress.received', { defaultValue: 'Case received' }),
      date: submittedAt,
    },
    {
      label: t('caseConsole.progress.initialReview', { defaultValue: 'Initial review' }),
      date: triagedAt,
    },
    {
      label: t('caseConsole.progress.investigation', { defaultValue: 'Investigation' }),
      date: assignedAt,
    },
    { label: t('caseConsole.progress.review', { defaultValue: 'Review' }), date: null },
    { label: t('caseConsole.progress.resolution', { defaultValue: 'Resolution' }), date: closedAt },
  ];
  const isComplete = currentStage >= steps.length;
  const currentStep = steps.find((_, index) => index === currentStage) ?? steps.at(-1);
  const currentDate = isComplete ? closedAt : currentStep?.date;

  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground dark:text-white">
          {t('caseConsole.progress.title', { defaultValue: 'Case progress' })}
        </h2>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          {isComplete
            ? t('caseConsole.progress.completed', { defaultValue: 'Completed' })
            : (currentStep?.label ??
              t('caseConsole.progress.inProgress', { defaultValue: 'In progress' }))}
        </span>
      </div>
      <ol className="flex flex-wrap items-center gap-y-3" aria-label="Case progress">
        {steps.map((step, index) => {
          const isComplete = index < currentStage;
          const isCurrent = index === currentStage;
          return (
            <li key={step.label} className="flex items-center">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isComplete && 'bg-emerald-500 text-white',
                  isCurrent && 'bg-brand-accent text-white ring-2 ring-brand-accent/30',
                  !isComplete &&
                    !isCurrent &&
                    'bg-muted text-muted-foreground/70',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? '✓' : index + 1}
              </span>
              <span
                className={cn(
                  'ml-2 whitespace-nowrap text-xs font-medium',
                  isCurrent
                    ? 'text-foreground dark:text-white'
                    : isComplete
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/70',
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'mx-2 h-px w-5 sm:w-8',
                    index < currentStage ? 'bg-emerald-400' : 'bg-muted',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          {currentDate !== null && currentDate !== undefined
            ? formatDate(currentDate)
            : t('caseConsole.progress.inProgress', { defaultValue: 'In progress' })}
        </p>
      </div>
    </div>
  );
}

function progressStageFor(status: WhistleblowingStatus): number {
  if (status === 'SUBMITTED') {
    return 0;
  }
  if (status === 'UNDER_TRIAGE') {
    return 1;
  }
  if (status === 'UNDER_INVESTIGATION' || status === 'WB_ESCALATED') {
    return 2;
  }
  if (status === 'RESOLVED') {
    return 3;
  }
  return 5;
}

export function CaseField({ label, value }: { label: string; value: string | null }): ReactElement {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{label}</dt>
      <dd className="notranslate mt-1 text-foreground" translate="no" dir="auto">
        {value !== null && value.length > 0 ? value : '—'}
      </dd>
    </div>
  );
}

export function CaseRecord({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p
        className="notranslate whitespace-pre-wrap text-sm leading-6 text-foreground"
        translate="no"
        dir="auto"
      >
        {value}
      </p>
    </div>
  );
}

export function CaseEmptyState({
  icon: Icon,
  label,
}: {
  icon: ElementType;
  label: string;
}): ReactElement {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/50/60 px-5 py-8 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/70" aria-hidden="true" />
      <p className="text-sm text-muted-foreground/70">{label}</p>
    </div>
  );
}

export function InlineActionPanel({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="mt-5 space-y-4 rounded-lg border border-brand-accent/20 bg-brand-accent/[0.04] p-4 dark:bg-brand-accent/[0.08]">
      {children}
    </div>
  );
}

export function ToggleActionButton({
  open,
  onClick,
  children,
  icon: Icon,
}: {
  open: boolean;
  onClick: () => void;
  children: ReactNode;
  icon: ElementType;
}): ReactElement {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="gap-1.5"
      aria-expanded={open}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
      <ChevronDown
        className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        aria-hidden="true"
      />
    </Button>
  );
}

export function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}): ReactElement {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-signal focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
