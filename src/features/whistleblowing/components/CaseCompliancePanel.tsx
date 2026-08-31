import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Lock, MessageSquare, ShieldAlert, TriangleAlert } from 'lucide-react';

import { Button } from '@components/ui/button';
import { Callout } from '@components/ui/callout';
import { Textarea } from '@components/ui/textarea';
import { getApiErrorMessage } from '@lib/api-error';
import { cn } from '@lib/utils';
import { wbService } from '../api/wb.service';
import type { CaseComplianceState } from '../types';

interface CaseCompliancePanelProps {
  caseId: string;
  compliance: CaseComplianceState;
  legalHold: boolean;
  canAct: boolean;
  canPlaceLegalHold: boolean;
  onChanged?: () => void;
}

type Tone = 'overdue' | 'due-soon' | 'met' | 'pending';

function toneFor(done: string | null, overdue: boolean, daysRemaining: number | null): Tone {
  if (done !== null) return 'met';
  if (overdue) return 'overdue';
  if (daysRemaining !== null && daysRemaining <= 2) return 'due-soon';
  return 'pending';
}

/**
 * Status of one statutory obligation.
 *
 * State is carried by an icon, a label and a border position as well as colour,
 * so it survives a monochrome print-out and is legible to someone who cannot
 * distinguish red from amber — a WCAG requirement, and the sort of detail that
 * matters when the reader is deciding whether a legal deadline has passed.
 */
function DeadlineRow({
  label,
  helpText,
  tone,
  dueAt,
  completedAt,
  daysRemaining,
}: {
  label: string;
  helpText: string;
  tone: Tone;
  dueAt: string | null;
  completedAt: string | null;
  daysRemaining: number | null;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const formatted = (value: string | null): string =>
    value === null ? '—' : new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });

  const presentation: Record<Tone, { icon: typeof Clock; className: string; status: string }> = {
    met: {
      icon: CheckCircle2,
      className: 'border-s-moss/70 bg-moss/5',
      status: t('compliance.status.met', { defaultValue: 'Met' }),
    },
    overdue: {
      icon: TriangleAlert,
      className: 'border-s-destructive bg-destructive/5',
      status: t('compliance.status.overdue', { defaultValue: 'Overdue' }),
    },
    'due-soon': {
      icon: Clock,
      className: 'border-s-amber-500 bg-amber-500/5',
      status: t('compliance.status.dueSoon', { defaultValue: 'Due soon' }),
    },
    pending: {
      icon: Clock,
      className: 'border-s-border bg-muted/30',
      status: t('compliance.status.pending', { defaultValue: 'Scheduled' }),
    },
  };

  const { icon: Icon, className, status } = presentation[tone];

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border border-border border-s-4 p-3', className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground/70" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="font-medium text-foreground">{label}</p>
          {/* The status word is the accessible carrier of meaning, not the colour. */}
          <p className="text-sm font-medium text-foreground">{status}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{helpText}</p>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">{t('compliance.due', { defaultValue: 'Due' })}:</dt>
            <dd className="font-mono text-foreground">{formatted(dueAt)}</dd>
          </div>
          {completedAt !== null ? (
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">{t('compliance.completed', { defaultValue: 'Completed' })}:</dt>
              <dd className="font-mono text-foreground">{formatted(completedAt)}</dd>
            </div>
          ) : daysRemaining !== null ? (
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">
                {daysRemaining < 0
                  ? t('compliance.overdueBy', { defaultValue: 'Overdue by' })
                  : t('compliance.remaining', { defaultValue: 'Remaining' })}
                :
              </dt>
              <dd className="font-medium text-foreground">
                {t('compliance.days', {
                  count: Math.abs(daysRemaining),
                  defaultValue: '{{count}} day',
                  defaultValue_other: '{{count}} days',
                })}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}

/**
 * Statutory obligations for one case.
 *
 * Shown separately from the internal SLA on purpose. The SLA is a target the
 * organization sets for itself; these two dates are obligations owed to the
 * person who filed the report, and presenting them together would let a case
 * look healthy against an internal goal while a legal deadline passes.
 */
export function CaseCompliancePanel({
  caseId,
  compliance,
  legalHold,
  canAct,
  canPlaceLegalHold,
  onChanged,
}: CaseCompliancePanelProps): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['wb'] });
    onChanged?.();
  };

  const acknowledge = useMutation({
    mutationFn: () => wbService.acknowledge(caseId),
    onSuccess: refresh,
    onError: (e: unknown) => setError(getApiErrorMessage(e)),
  });

  const sendFeedback = useMutation({
    mutationFn: () => wbService.provideFeedback(caseId, feedback.trim()),
    onSuccess: () => {
      setFeedback('');
      refresh();
    },
    onError: (e: unknown) => setError(getApiErrorMessage(e)),
  });

  const toggleHold = useMutation({
    mutationFn: () => wbService.setLegalHold(caseId, !legalHold, holdReason.trim() || undefined),
    onSuccess: () => {
      setHoldReason('');
      refresh();
    },
    onError: (e: unknown) => setError(getApiErrorMessage(e)),
  });

  const acknowledgementTone = toneFor(
    compliance.acknowledgedAt,
    compliance.acknowledgementOverdue,
    compliance.acknowledgementDueInDays,
  );
  const feedbackTone = toneFor(
    compliance.feedbackProvidedAt,
    compliance.feedbackOverdue,
    compliance.feedbackDueInDays,
  );

  return (
    <section aria-labelledby="case-compliance-heading" className="space-y-4">
      <div>
        <h3 id="case-compliance-heading" className="type-h3 text-foreground">
          {t('compliance.heading', { defaultValue: 'Statutory obligations' })}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('compliance.subheading', {
            defaultValue:
              'Deadlines owed to the person who raised this concern. Tracked separately from the internal service target.',
          })}
        </p>
      </div>

      <div className="space-y-3">
        <DeadlineRow
          label={t('compliance.acknowledgement.label', { defaultValue: 'Acknowledge receipt' })}
          helpText={t('compliance.acknowledgement.help', {
            defaultValue: 'Confirm to the reporter that their concern has been received.',
          })}
          tone={acknowledgementTone}
          dueAt={compliance.acknowledgementDueAt}
          completedAt={compliance.acknowledgedAt}
          daysRemaining={compliance.acknowledgementDueInDays}
        />
        <DeadlineRow
          label={t('compliance.feedback.label', { defaultValue: 'Provide feedback' })}
          helpText={t('compliance.feedback.help', {
            defaultValue: 'Tell the reporter what action has been taken or is planned.',
          })}
          tone={feedbackTone}
          dueAt={compliance.feedbackDueAt}
          completedAt={compliance.feedbackProvidedAt}
          daysRemaining={compliance.feedbackDueInDays}
        />
      </div>

      {error !== null ? (
        <Callout tone="caution" title={t('compliance.actionFailed', { defaultValue: 'That action could not be completed' })}>
          {error}
        </Callout>
      ) : null}

      {canAct ? (
        <div className="space-y-4 rounded-lg border border-border p-4">
          {compliance.acknowledgedAt === null ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('compliance.acknowledgement.cta', {
                  defaultValue:
                    'Acknowledging sends a message to the reporter through the secure channel and starts the feedback period.',
                })}
              </p>
              <Button
                type="button"
                onClick={() => acknowledge.mutate()}
                disabled={acknowledge.isPending}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {acknowledge.isPending
                  ? t('compliance.acknowledgement.sending', { defaultValue: 'Acknowledging…' })
                  : t('compliance.acknowledgement.action', { defaultValue: 'Acknowledge receipt' })}
              </Button>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="case-feedback" className="block text-sm font-medium text-foreground">
              {t('compliance.feedback.action', { defaultValue: 'Send feedback to the reporter' })}
            </label>
            <Textarea
              id="case-feedback"
              rows={4}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder={t('compliance.feedback.placeholder', {
                defaultValue: 'Describe the outcome or the action being taken.',
              })}
            />
            <p className="text-sm text-muted-foreground">
              {t('compliance.feedback.visibility', {
                defaultValue: 'This is visible to the reporter. It is not an internal note.',
              })}
            </p>
            <Button
              type="button"
              onClick={() => sendFeedback.mutate()}
              disabled={sendFeedback.isPending || feedback.trim().length === 0}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              {sendFeedback.isPending
                ? t('compliance.feedback.sending', { defaultValue: 'Sending…' })
                : t('compliance.feedback.send', { defaultValue: 'Send feedback' })}
            </Button>
          </div>
        </div>
      ) : null}

      {canPlaceLegalHold ? (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-foreground/70" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">
                {t('compliance.legalHold.label', { defaultValue: 'Legal hold' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {legalHold
                  ? t('compliance.legalHold.on', {
                      defaultValue: 'This case is on hold and is exempt from scheduled deletion.',
                    })
                  : t('compliance.legalHold.off', {
                      defaultValue:
                        'Placing a hold prevents this case from being deleted when its retention period ends.',
                    })}
              </p>
            </div>
          </div>

          {!legalHold ? (
            <div className="space-y-2">
              <label htmlFor="legal-hold-reason" className="block text-sm font-medium text-foreground">
                {t('compliance.legalHold.reason', { defaultValue: 'Reason for the hold' })}
              </label>
              <Textarea
                id="legal-hold-reason"
                rows={2}
                value={holdReason}
                onChange={(event) => setHoldReason(event.target.value)}
              />
            </div>
          ) : null}

          <Button
            type="button"
            variant={legalHold ? 'outline' : 'default'}
            onClick={() => toggleHold.mutate()}
            disabled={toggleHold.isPending || (!legalHold && holdReason.trim().length === 0)}
          >
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            {legalHold
              ? t('compliance.legalHold.release', { defaultValue: 'Release hold' })
              : t('compliance.legalHold.place', { defaultValue: 'Place legal hold' })}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
