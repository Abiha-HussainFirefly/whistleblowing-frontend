import { type ReactElement, type ReactNode, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  FileSearch,
  Link2,
  Lock,
  MapPin,
  MessageSquare,
  Paperclip,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { Loader } from '@components/common/Loader';
import { PageTitle } from '@components/ui/page-title';
import { ServerText } from '@components/ui/server-text';
import { getApiErrorMessage } from '@lib/api-error';
import { cn } from '@lib/utils';
import { ROUTES } from '@config/routes';
import { useWbOversightCase } from '@features/org-admin/hooks/whistleblowing-oversight';
import {
  formatBytes,
  formatDate,
  formatDateTime,
  slaDaysRemaining,
  wbCategoryLabel,
  wbPriorityLabel,
} from '@features/whistleblowing/utils/format';
import {
  WbCategoryBadge,
  WbPriorityBadge,
  WbStatusBadge,
} from '@pages/whistleblowing/components/WbBadges';
import type { WbAttachment, WbCaseDetail, WbMessage } from '@features/whistleblowing/types';

// ── Status pipeline ──────────────────────────────────────────────────────────
// Terminal/branch states (escalated, dismissed) render as a callout instead of
// forcing them into the linear pipeline, since they don't represent "further
// along" the same track.
const PIPELINE_STEPS = [
  { key: 'SUBMITTED', labelKey: 'status.SUBMITTED' },
  { key: 'UNDER_TRIAGE', labelKey: 'oversight.detail.pipeline.triage' },
  { key: 'UNDER_INVESTIGATION', labelKey: 'oversight.detail.pipeline.investigation' },
  { key: 'RESOLVED', labelKey: 'status.RESOLVED' },
  { key: 'WB_CLOSED', labelKey: 'status.WB_CLOSED' },
] as const;

function pipelineIndex(status: string): number {
  if (status === 'WB_CLOSED') {
    return PIPELINE_STEPS.length;
  }
  const i = PIPELINE_STEPS.findIndex((s) => s.key === status);
  if (i >= 0) {
    return i;
  }
  // Escalated sits conceptually after Investigation; dismissed after Triage.
  if (status === 'WB_ESCALATED') {
    return 2;
  }
  if (status === 'WB_DISMISSED') {
    return 1;
  }
  return 0;
}

function StatusPipeline({ status }: { status: string }): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const activeIndex = pipelineIndex(status);
  const isBranch = status === 'WB_ESCALATED' || status === 'WB_DISMISSED';

  return (
    <div className="flex items-center">
      {PIPELINE_STEPS.map((step, i) => {
        const done = i < activeIndex || (i === activeIndex && !isBranch);
        const current = i === activeIndex && !isBranch;
        const last = i === PIPELINE_STEPS.length - 1;
        return (
          <div key={step.key} className={cn('flex items-center', !last && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold transition-colors',
                  current
                    ? 'border-brand-accent bg-brand-accent text-white'
                    : done
                      ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                      : 'border-border bg-white text-muted-foreground/70',
                )}
              >
                {done && !current ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px] font-medium',
                  current || done ? 'text-foreground' : 'text-muted-foreground/70',
                )}
              >
                {t(step.labelKey)}
              </span>
            </div>
            {!last && (
              <div
                className={cn(
                  'mx-1 h-0.5 flex-1 rounded-full',
                  i < activeIndex ? 'bg-brand-accent' : 'bg-muted',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── SLA progress card ────────────────────────────────────────────────────────
// ── SLA card — clearer at-a-glance state ────────────────────────────────────
function SlaCard({ c }: { c: WbCaseDetail }): ReactElement | null {
  const { t } = useTranslation('whistleblowing');

  if (c.slaDeadline === null) {
    return null;
  }
  const breached = c.slaBreachedAt !== null;
  const days = slaDaysRemaining(c.slaDeadline);
  const submitted = new Date(c.submittedAt).getTime();
  const deadline = new Date(c.slaDeadline).getTime();
  const now = Date.now();
  const totalWindow = deadline - submitted;
  const elapsed = now - submitted;
  const rawPercent = totalWindow > 0 ? (elapsed / totalWindow) * 100 : 100;
  // Floor at 4% so early-stage cases still show a visible sliver instead of
  // an empty-looking bar — communicates "in progress", not "broken".
  const percentElapsed = Math.min(100, Math.max(4, rawPercent));
  const urgent = days !== null && days <= 7;

  const barColor = breached ? 'bg-red-500' : urgent ? 'bg-amber-500' : 'bg-brand-accent';

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-accent/10 text-brand-accent">
          <Clock className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{t('oversight.detail.sla.title')}</h3>
      </div>

      {breached ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/5 px-3 py-2.5 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t('oversight.detail.sla.breachedOn', { date: formatDate(c.slaBreachedAt) })}
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <span
              className={cn(
                'text-xl font-semibold tabular-nums',
                urgent ? 'text-courage-strong' : 'text-foreground',
              )}
            >
              {days ?? '—'}
              <span className="ml-1 text-base font-medium text-muted-foreground/70">
                {t('oversight.detail.sla.daysLeft')}
              </span>
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${String(percentElapsed)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground/70">
            <span>{t('oversight.detail.sla.opened', { date: formatDate(c.submittedAt) })}</span>
            <span className="font-medium text-muted-foreground">
              {t('oversight.detail.sla.due', { date: formatDate(c.slaDeadline) })}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Unified activity timeline (messages + evidence, chronological) ─────────
type ActivityItem =
  | { kind: 'message'; at: string; data: WbMessage }
  | { kind: 'attachment'; at: string; data: WbAttachment };

function ActivityTimeline({ c }: { c: WbCaseDetail }): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const items = useMemo<ActivityItem[]>(() => {
    const messages: ActivityItem[] = c.messages.map((m) => ({
      kind: 'message',
      at: m.createdAt,
      data: m,
    }));
    const attachments: ActivityItem[] = c.attachments.map((a) => ({
      kind: 'attachment',
      at: a.addedAt,
      data: a,
    }));
    return [...messages, ...attachments].sort(
      (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
    );
  }, [c.messages, c.attachments]);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground/70">{t('oversight.detail.activity.empty')}</p>;
  }

  return (
    <ol className="space-y-0">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={`${item.kind}-${String(i)}`} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span className="bg-slate-150 absolute left-[15px] top-8 h-[calc(100%-1.75rem)] w-px bg-muted" />
            )}
            <span
              className={cn(
                'z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm',
                item.kind === 'attachment'
                  ? 'bg-muted text-muted-foreground'
                  : item.data.isFromReporter
                    ? 'bg-signal-tint text-signal-strong'
                    : item.data.isInternal
                      ? 'bg-courage-tint text-courage-strong'
                      : 'bg-brand-accent/10 text-brand-accent',
              )}
            >
              {item.kind === 'attachment' ? (
                <Paperclip className="h-3.5 w-3.5" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
            </span>

            {item.kind === 'message' ? (
              <div
                className={cn(
                  'flex-1 rounded-lg border p-3.5 text-sm',
                  item.data.isFromReporter
                    ? 'border-blue-100 bg-signal-tint/60'
                    : item.data.isInternal
                      ? 'border-amber-100 bg-courage-tint/60'
                      : 'border-brand-accent/20 bg-brand-accent/5',
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground/70">
                  <span className="font-medium text-muted-foreground">
                    {item.data.isFromReporter ? (
                      t('caseConsole.communication.reporter')
                    ) : (
                      <ServerText>
                        {item.data.author?.displayName ??
                          item.data.author?.email ??
                          t('caseConsole.communication.investigator')}
                      </ServerText>
                    )}
                    {item.data.isInternal && (
                      <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-courage-strong">
                        <Lock className="h-3 w-3" />
                        {t('caseConsole.communication.internal', { defaultValue: 'Internal' })}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0">{formatDateTime(item.data.createdAt)}</span>
                </div>
                <ServerText className="block whitespace-pre-wrap leading-relaxed text-foreground">
                  {item.data.content}
                </ServerText>
              </div>
            ) : (
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-white p-3 text-sm">
                <ServerText className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {item.data.fileName}
                </ServerText>
                <span className="shrink-0 text-xs text-muted-foreground/70">
                  {formatBytes(item.data.sizeBytes)} ·{' '}
                  {item.data.isFromReporter
                    ? t('caseConsole.evidence.reporter', { defaultValue: 'reporter' })
                    : t('caseConsole.evidence.investigator', { defaultValue: 'investigator' })}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground/70">
                  {formatDateTime(item.data.addedAt)}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Org-admin **Whistleblowing oversight** case detail — strictly READ-ONLY.
 * Investigation, assignment and edits are USER-portal module work; an org admin
 * only monitors. The data is read through the CoI-enforced oversight endpoint,
 * so a case the reporter hid from this admin is unavailable here (404).
 */
export function OrgAdminWhistleblowingCasePage(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { data: c, isLoading, isError, error } = useWbOversightCase(caseId);

  if (isLoading) {
    return <Loader fullscreen label="Loading case…" />;
  }

  if (isError || c === undefined) {
    return (
      <div className="space-y-4">
        <Back />
        <div className="rounded-lg border border-border bg-white p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {getApiErrorMessage(
              error,
              'This case is unavailable — it may have been hidden from your profile by the reporter (conflict of interest).',
            )}
          </p>
        </div>
      </div>
    );
  }

  const isBranchStatus = c.status === 'WB_ESCALATED' || c.status === 'WB_DISMISSED';

  return (
    <div className="space-y-6">
      <Back />

      {/* Header card */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-white">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <PageTitle className="text-foreground">
                <ServerText>{c.caseReferenceNumber}</ServerText>
              </PageTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <WbStatusBadge status={c.status} />
                <WbPriorityBadge priority={c.priority} />
                <WbCategoryBadge category={c.category} />
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/70">
                <span>
                  {c.isAnonymous
                    ? t('caseConsole.reporter.anonymous')
                    : t('caseConsole.reporter.named')}{' '}
                  - <ServerText>{c.reporterAlias}</ServerText>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {t('oversight.readOnly')}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Status pipeline — hidden for escalated/dismissed, shown as callout instead */}
        <div className="mt-5 border-t border-border pt-5">
          {isBranchStatus ? (
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium',
                c.status === 'WB_ESCALATED'
                  ? 'bg-destructive/5 text-destructive'
                  : 'bg-muted/50 text-muted-foreground',
              )}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {c.status === 'WB_ESCALATED'
                ? t('oversight.detail.pipeline.escalated')
                : t('oversight.detail.pipeline.dismissed')}
            </div>
          ) : (
            <StatusPipeline status={c.status} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title={t('caseConsole.panels.incident')} icon={FileSearch}>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Field label={t('caseConsole.fields.category')} value={wbCategoryLabel(c.category)} />
              <Field
                label={t('caseConsole.fields.riskRating')}
                value={wbPriorityLabel(c.priority)}
              />
              <Field
                label={t('caseConsole.fields.dateOfOccurrence')}
                value={formatDate(c.incidentDate)}
              />
              <Field
                label={t('caseConsole.fields.location')}
                value={c.incidentLocation}
                icon={MapPin}
              />
              <Field label={t('caseConsole.fields.region')} value={c.regionCode} />
              <Field
                label={t('caseConsole.fields.submitted')}
                value={formatDateTime(c.submittedAt)}
              />
            </dl>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                {t('caseConsole.fields.description')}
              </p>
              <ServerText className="mt-1.5 block whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {c.incidentDescription}
              </ServerText>
            </div>
            {c.personsInvolved !== null && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                  {t('caseConsole.fields.personsInvolvedNotes')}
                </p>
                <ServerText className="mt-1.5 block whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {c.personsInvolved}
                </ServerText>
              </div>
            )}
          </Panel>

          {(c.preliminaryAssessment !== null ||
            c.investigationFindings !== null ||
            c.disciplinaryRecommendation !== null ||
            c.closureOutcome !== null) && (
            <Panel title={t('caseConsole.panels.investigationRecord')} icon={ShieldAlert}>
              {c.preliminaryAssessment !== null && (
                <RecordBlock
                  label={t('caseConsole.fields.preliminaryAssessment')}
                  value={c.preliminaryAssessment}
                />
              )}
              {c.investigationFindings !== null && (
                <RecordBlock
                  label={t('caseConsole.fields.findings')}
                  value={c.investigationFindings}
                />
              )}
              {c.disciplinaryRecommendation !== null && (
                <RecordBlock
                  label={t('caseConsole.fields.disciplinaryRecommendation')}
                  value={c.disciplinaryRecommendation}
                />
              )}
              {c.closureOutcome !== null && (
                <RecordBlock
                  label={t('caseConsole.fields.closureOutcome')}
                  value={c.closureOutcome}
                />
              )}
            </Panel>
          )}

          <Panel
            title={t('oversight.detail.activity.title')}
            icon={MessageSquare}
            subtitle={t('oversight.detail.activity.subtitle', {
              messages: c.messages.length,
              files: c.attachments.length,
            })}
          >
            {c.messages.length === 0 && c.attachments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/70">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <p className="text-sm text-muted-foreground/70">{t('oversight.detail.activity.empty')}</p>
              </div>
            ) : (
              <ActivityTimeline c={c} />
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <SlaCard c={c} />

          <Panel title={t('caseConsole.panels.assignment')} icon={UserCheck}>
            {c.assignedInvestigator !== null ? (
              <div className="flex items-center gap-3 rounded-lg bg-brand-accent/5 px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-semibold text-white">
                  {(c.assignedInvestigator.displayName ?? c.assignedInvestigator.email)
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <ServerText className="block truncate text-sm font-medium text-foreground">
                    {c.assignedInvestigator.displayName ?? c.assignedInvestigator.email}
                  </ServerText>
                  <p className="text-xs text-muted-foreground/70">
                    {t('caseConsole.communication.investigator')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground/70">
                <UserCheck className="h-4 w-4 shrink-0" />
                {t('caseConsole.assignment.unassigned')}
              </div>
            )}
            <dl className="mt-4 space-y-3 text-sm">
              <Field
                label={t('oversight.detail.assignment.triaged')}
                value={formatDate(c.triagedAt)}
              />
              <Field
                label={t('oversight.detail.assignment.assigned')}
                value={formatDate(c.assignedAt)}
              />
              <Field
                label={t('oversight.detail.assignment.closed')}
                value={formatDate(c.closedAt)}
              />
            </dl>
          </Panel>

          <Panel title={t('caseConsole.panels.relatedCases')} icon={Link2}>
            {c.relatedCases.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/70">
                  <Link2 className="h-4 w-4" />
                </span>
                <p className="text-sm text-muted-foreground/70">{t('caseConsole.related.empty')}</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {c.relatedCases.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL(r.id)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-brand-accent/5 hover:text-brand-primary"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />
                      <ServerText>{r.caseReferenceNumber}</ServerText>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Back(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  return (
    <Link
      to={ROUTES.ORG_ADMIN.WHISTLEBLOWING}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand-accent"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('oversight.back')}
    </Link>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: typeof MessageSquare;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-accent/10 text-brand-accent">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {subtitle !== undefined && <span className="text-xs text-muted-foreground/70">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon?: typeof MapPin;
}): ReactElement {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{label}</dt>
      <dd
        className="notranslate mt-0.5 flex items-center gap-1 text-foreground"
        translate="no"
        dir="auto"
      >
        {Icon !== undefined && value !== null && value.length > 0 && (
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
        )}
        {value !== null && value.length > 0 ? value : '—'}
      </dd>
    </div>
  );
}

function RecordBlock({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="mb-4 border-t border-border pt-4 first:mt-0 first:border-t-0 first:pt-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p
        className="notranslate mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground"
        translate="no"
        dir="auto"
      >
        {value}
      </p>
    </div>
  );
}
