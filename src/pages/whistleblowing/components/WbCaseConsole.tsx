import { Button } from '@components/ui/button';
import { PageTitle } from '@components/ui/page-title';
import { Input } from '@components/ui/input';
import { Pagination, type PageMeta } from '@components/ui/pagination';
import { Select } from '@components/ui/select';
import { ServerText } from '@components/ui/server-text';
import { Sheet } from '@components/ui/sheet';
import { Textarea } from '@components/ui/textarea';
import { wbService } from '@features/whistleblowing/api/wb.service';
import {
  useAddWbAttachment,
  useAssignCase,
  useCloseCase,
  useCommentCase,
  useEscalateCase,
  useLinkCase,
  useResolveCase,
  useSetPriority,
  useTriageCase,
  useUnlinkCase,
  useWbCases,
  useWbInvestigators,
} from '@features/whistleblowing/hooks';
import { WB_PERMISSIONS } from '@features/whistleblowing/permissions';
import type { InvestigationPriority, WbCaseDetail } from '@features/whistleblowing/types';
import {
  WB_PRIORITY_OPTIONS,
  formatBytes,
  formatDate,
  formatDateTime,
  slaDaysRemaining,
} from '@features/whistleblowing/utils/format';
import {
  wbAwarenessLabelT,
  wbCaseTypeLabelT,
  wbDurationLabelT,
  wbIntakeMethodLabelT,
  wbPreviouslyReportedLabelT,
  wbPriorityLabelT,
  wbRelationshipLabelT,
} from '@features/whistleblowing/utils/i18n';
import { usePermissions } from '@hooks/usePermissions';
import { getApiErrorMessage, getApiSuccessMessage } from '@lib/api-error';
import { toast } from '@store/toastStore';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Inbox,
  Link2,
  ListTree,
  Lock,
  MessageSquare,
  Paperclip,
  Send,
  UserCheck,
  UserPlus,
  Download,
} from 'lucide-react';
import { type ReactElement, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { WbCategoryBadge, WbPriorityBadge, WbStatusBadge } from './WbBadges';
import {
  CaseEmptyState as EmptyState,
  CaseField as Field,
  CaseProgress,
  CaseRecord as RecordBlock,
  CaseSection as Panel,
  CaseTabNav,
  ToggleActionButton,
} from './WbCaseConsolePrimitives';
import { isClosedCase, type TabKey } from './wbCaseConsoleConfig';
import { WbCaseClassificationTab } from './tabs/WbCaseClassificationTab';
import { WbCaseParticipantsTab } from './tabs/WbCaseParticipantsTab';
import { WbCaseSynopsisTab } from './tabs/WbCaseSynopsisTab';

const MAX_UPLOAD_BYTES = 104_857_600;
const DETAIL_PAGE_SIZE = 5;

function pageMetaFor(page: number, total: number, pageSize = DETAIL_PAGE_SIZE): PageMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page: Math.min(Math.max(1, page), totalPages),
    pageSize,
    total,
    totalPages,
  };
}

function pageItemsFor<T>(items: T[], page: number, pageSize = DETAIL_PAGE_SIZE): T[] {
  const meta = pageMetaFor(page, items.length, pageSize);
  const start = (meta.page - 1) * meta.pageSize;
  return items.slice(start, start + meta.pageSize);
}

export interface WbCaseConsoleProps {
  /** The loaded case (caller owns fetching + loading/error handling). */
  caseData: WbCaseDetail;
  caseId: string;
  /** Where the back link + related-case links point (portal-specific). */
  backTo: string;
  backLabel: string;
  detailRoute: (id: string) => string;
}

/**
 * Shared whistleblowing case detail + investigation actions, used by BOTH the
 * USER-portal console and the org-admin oversight. Action visibility is driven
 * by the caller's whistleblowing permissions (investigate/admin), so an org
 * admin assigned as investigator can act here Ã¢â‚¬â€ not just read Ã¢â‚¬â€ while a
 * monitoring admin with no whistleblowing permission sees it read-only.
 * Mutations hit the internal `/whistleblowing/cases/*` endpoints; the WB hooks
 * also refresh the oversight cache, so the org-admin view updates after an action.
 */
export function WbCaseConsole({
  caseData: c,
  caseId,
  backTo,
  backLabel,
  detailRoute,
}: WbCaseConsoleProps): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const { has } = usePermissions();
  const canRead = has(WB_PERMISSIONS.read);
  // Backend endpoints intentionally require the exact capability. An admin
  // grant alone is not an investigation grant, so do not render actions that
  // would inevitably return 403.
  const canInvestigate = has(WB_PERMISSIONS.investigate);
  const canAdmin = has(WB_PERMISSIONS.admin);

  const triage = useTriageCase();
  const setPriorityM = useSetPriority();
  const assign = useAssignCase();
  const escalate = useEscalateCase();
  const resolve = useResolveCase();
  const close = useCloseCase();
  const link = useLinkCase();
  const unlink = useUnlinkCase();
  const comment = useCommentCase();
  const addAttachment = useAddWbAttachment();
  const investigators = useWbInvestigators(canAdmin, caseId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [priority, setPriorityVal] = useState<InvestigationPriority>('PRIORITY_MEDIUM');
  const [assessment, setAssessment] = useState('');
  const [investigatorId, setInvestigatorId] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [findings, setFindings] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [closureOutcome, setClosureOutcome] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [linkRef, setLinkRef] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [classificationOpen, setClassificationOpen] = useState(false);
  const [synopsisOpen, setSynopsisOpen] = useState(false);
  const [participantOpen, setParticipantOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [closureOpen, setClosureOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [activityView, setActivityView] = useState<'communication' | 'evidence'>('communication');
  const [messagesPage, setMessagesPage] = useState(1);
  const [attachmentsPage, setAttachmentsPage] = useState(1);
  const [relatedCasesPage, setRelatedCasesPage] = useState(1);

  const isClosed = isClosedCase(c.status);
  const isResolved = c.status === 'RESOLVED';
  const slaDays = slaDaysRemaining(c.slaDeadline);
  const mutationError =
    triage.error ??
    setPriorityM.error ??
    assign.error ??
    escalate.error ??
    resolve.error ??
    close.error ??
    link.error ??
    comment.error ??
    addAttachment.error;
  const errMsg = actionError ?? (mutationError !== null ? getApiErrorMessage(mutationError) : null);
  const messagesMeta = pageMetaFor(messagesPage, c.messages.length);
  const visibleMessages = pageItemsFor(c.messages, messagesPage);
  const attachmentsMeta = pageMetaFor(attachmentsPage, c.attachments.length);
  const visibleAttachments = pageItemsFor(c.attachments, attachmentsPage);
  const relatedCasesMeta = pageMetaFor(relatedCasesPage, c.relatedCases.length);
  const visibleRelatedCases = pageItemsFor(c.relatedCases, relatedCasesPage);
  const searchCases = useWbCases(
    relatedOpen && linkRef.trim().length > 0 ? { search: linkRef.trim() } : undefined,
  );
  const availableSuggestions = (searchCases.data?.data ?? []).filter(
    (item) => item.id !== caseId && !c.relatedCases.some((r) => r.id === item.id),
  );
  // Eligibility is case-scoped and conflict-aware on the backend. Do not
  // reconstruct it from the detail payload in the browser.
  const eligibleInvestigators = investigators.data ?? [];

  const showValidationError = (message: string): void => {
    setActionError(message);
    toast.error(message);
  };

  const showMutationError = (error: unknown): void => {
    const message = getApiErrorMessage(error);
    setActionError(message);
    toast.error(message);
  };

  const showSuccess = (payload: unknown, fallback: string): void => {
    setActionError(null);
    toast.success(getApiSuccessMessage(payload) ?? fallback);
  };

  const validateText = (value: string, min: number, message: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length < min) {
      showValidationError(message);
      return null;
    }
    return trimmed;
  };

  const handleAssign = (): void => {
    if (investigatorId.length === 0) {
      showValidationError(
        t('caseConsole.validation.selectInvestigator', {
          defaultValue: 'Select an investigator before assigning.',
        }),
      );
      return;
    }
    setActionError(null);
    assign.mutate(
      { id: caseId, data: { investigatorId } },
      {
        onSuccess: (data) => {
          showSuccess(
            data,
            t('caseConsole.toasts.assigned', { defaultValue: 'Investigator assigned.' }),
          );
          setAssignmentOpen(false);
        },
        onError: showMutationError,
      },
    );
  };

  const handleSetPriority = (): void => {
    setActionError(null);
    setPriorityM.mutate(
      { id: caseId, data: { priority } },
      {
        onSuccess: (data) => {
          showSuccess(data, t('caseConsole.toasts.riskUpdated', { defaultValue: 'Risk updated.' }));
        },
        onError: showMutationError,
      },
    );
  };

  const handleTriage = (): void => {
    const trimmedAssessment = assessment.trim();
    if (trimmedAssessment.length > 0 && trimmedAssessment.length < 10) {
      showValidationError(
        t('caseConsole.validation.assessmentMin', {
          defaultValue: 'Write at least 10 characters for the preliminary assessment.',
        }),
      );
      return;
    }
    setActionError(null);
    triage.mutate(
      {
        id: caseId,
        data: {
          priority,
          ...(trimmedAssessment.length > 0 ? { preliminaryAssessment: trimmedAssessment } : {}),
        },
      },
      {
        onSuccess: (data) => {
          showSuccess(data, t('caseConsole.toasts.triaged', { defaultValue: 'Case triaged.' }));
          setAssessment('');
          setTriageOpen(false);
        },
        onError: showMutationError,
      },
    );
  };

  const handleResolve = (): void => {
    const trimmedFindings = validateText(
      findings,
      10,
      t('caseConsole.validation.findingsMin', {
        defaultValue: 'Investigation findings must be at least 10 characters.',
      }),
    );
    if (trimmedFindings === null) {
      return;
    }
    const trimmedDiscipline = discipline.trim();
    setActionError(null);
    resolve.mutate(
      {
        id: caseId,
        data: {
          investigationFindings: trimmedFindings,
          ...(trimmedDiscipline.length > 0
            ? { disciplinaryRecommendation: trimmedDiscipline }
            : {}),
        },
      },
      {
        onSuccess: (data) => {
          showSuccess(data, t('caseConsole.toasts.resolved', { defaultValue: 'Case resolved.' }));
          setFindings('');
          setDiscipline('');
          setResolveOpen(false);
        },
        onError: showMutationError,
      },
    );
  };

  const handleEscalate = (): void => {
    const reason = validateText(
      escalateReason,
      10,
      t('caseConsole.validation.escalationReasonMin', {
        defaultValue: 'Escalation reason must be at least 10 characters.',
      }),
    );
    if (reason === null) {
      return;
    }
    setActionError(null);
    escalate.mutate(
      { id: caseId, data: { reason } },
      {
        onSuccess: (data) => {
          showSuccess(data, t('caseConsole.toasts.escalated', { defaultValue: 'Case escalated.' }));
          setEscalateReason('');
          setEscalateOpen(false);
        },
        onError: showMutationError,
      },
    );
  };

  const handleClose = (dismiss: boolean): void => {
    const outcome = validateText(
      closureOutcome,
      10,
      t('caseConsole.validation.closureOutcomeMin', {
        defaultValue: 'Closure outcome must be at least 10 characters.',
      }),
    );
    if (outcome === null) {
      return;
    }
    setActionError(null);
    close.mutate(
      { id: caseId, data: { closureOutcome: outcome, ...(dismiss ? { dismiss: true } : {}) } },
      {
        onSuccess: (data) => {
          showSuccess(
            data,
            dismiss
              ? t('caseConsole.toasts.dismissed', { defaultValue: 'Case dismissed.' })
              : t('caseConsole.toasts.closed', { defaultValue: 'Case closed.' }),
          );
          setClosureOutcome('');
          setClosureOpen(false);
        },
        onError: showMutationError,
      },
    );
  };

  const handleComment = (): void => {
    const content = validateText(
      commentText,
      2,
      t('caseConsole.validation.commentRequired', {
        defaultValue: 'Write a comment before sending.',
      }),
    );
    if (content === null) {
      return;
    }
    setActionError(null);
    comment.mutate(
      { id: caseId, data: { content, isInternal: commentInternal } },
      {
        onSuccess: (data) => {
          showSuccess(
            data,
            t('caseConsole.toasts.commentAdded', { defaultValue: 'Comment added.' }),
          );
          setCommentText('');
          setCommentInternal(false);
          setCommentOpen(false);
        },
        onError: showMutationError,
      },
    );
  };

  const handleLinkCaseDirect = (relatedCaseId: string): void => {
    setActionError(null);
    link.mutate(
      { id: caseId, data: { relatedCaseId } },
      {
        onSuccess: (data) => {
          showSuccess(
            data,
            t('caseConsole.toasts.linked', { defaultValue: 'Related case linked.' }),
          );
          setLinkRef('');
        },
        onError: showMutationError,
      },
    );
  };

  const handleLinkCase = (): void => {
    const relatedCaseId = validateText(
      linkRef,
      4,
      t('caseConsole.validation.relatedCaseRequired', {
        defaultValue: 'Enter a valid related case reference.',
      }),
    );
    if (relatedCaseId === null) {
      return;
    }
    handleLinkCaseDirect(relatedCaseId);
  };

  const handleUnlinkCase = (relatedId: string): void => {
    setActionError(null);
    unlink.mutate(
      { id: caseId, relatedId },
      {
        onSuccess: (data) => {
          showSuccess(
            data,
            t('caseConsole.toasts.unlinked', { defaultValue: 'Related case unlinked.' }),
          );
        },
        onError: showMutationError,
      },
    );
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file === undefined) {
      return;
    }
    if (file.size === 0) {
      showValidationError(
        t('caseConsole.validation.emptyFile', {
          defaultValue: 'Choose a file that is not empty.',
        }),
      );
      e.target.value = '';
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showValidationError(
        t('caseConsole.validation.fileTooLarge', {
          defaultValue: 'File must be 100 MB or smaller.',
        }),
      );
      e.target.value = '';
      return;
    }
    setActionError(null);
    addAttachment.mutate(
      { id: caseId, file },
      {
        onSuccess: (data) => {
          showSuccess(
            data,
            t('caseConsole.toasts.evidenceAttached', { defaultValue: 'Evidence attached.' }),
          );
        },
        onError: showMutationError,
      },
    );
    e.target.value = '';
  };

  const onDownload = (documentId: string): void => {
    wbService
      .downloadAttachment(caseId, documentId)
      .then((r) => {
        window.open(r.url, '_blank', 'noopener,noreferrer');
      })
      .catch((err: unknown) => {
        showMutationError(err);
      });
  };

  return (
    <>
      <div className="space-y-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        {/* Title row */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                {t('caseConsole.header.reference', { defaultValue: 'Case reference' })}
              </p>
              <PageTitle className="mt-1 text-foreground">
                <ServerText>{c.caseReferenceNumber}</ServerText>
              </PageTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <WbStatusBadge status={c.status} />
                <WbPriorityBadge priority={c.priority} />
                <WbCategoryBadge category={c.category} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {c.isAnonymous
                  ? t('caseConsole.reporter.anonymous', { defaultValue: 'Anonymous reporter' })
                  : t('caseConsole.reporter.named', { defaultValue: 'Named reporter' })}{' '}
                - <ServerText>{c.reporterAlias}</ServerText>
                {c.reporterEmail !== null && (
                  <>
                    {' - '}
                    <ServerText>{c.reporterEmail}</ServerText>
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {c.slaBreachedAt !== null ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {t('caseConsole.sla.breached', { defaultValue: 'SLA breached' })}
                </span>
              ) : slaDays !== null ? (
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${slaDays <= 7 ? 'bg-courage-tint text-courage-strong' : 'bg-muted/50 text-muted-foreground'}`}
                >
                  {t('caseConsole.sla.remaining', {
                    count: slaDays,
                    defaultValue: 'SLA: {{count}}d remaining',
                  })}
                </span>
              ) : null}
              {canInvestigate && !isClosed && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTriageOpen(true);
                    }}
                  >
                    <ClipboardList className="h-4 w-4" />
                    {t('caseConsole.actions.triage', { defaultValue: 'Triage' })}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResolveOpen(true);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t('caseConsole.actions.resolve', { defaultValue: 'Resolve' })}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEscalateOpen(true);
                    }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {t('caseConsole.actions.escalate', { defaultValue: 'Escalate' })}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSynopsisOpen(true);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t('caseConsole.actions.synopsis', { defaultValue: 'Synopsis' })}
                  </Button>
                  {canAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssignmentOpen(true);
                      }}
                    >
                      <UserCheck className="h-4 w-4" />
                      {t('caseConsole.actions.assignment', { defaultValue: 'Assignment' })}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setParticipantOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    {t('caseConsole.actions.participants', { defaultValue: 'Participants' })}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setClassificationOpen(true);
                    }}
                  >
                    <ClipboardList className="h-4 w-4" />
                    {t('caseConsole.actions.classification', { defaultValue: 'Classification' })}
                  </Button>
                </>
              )}
              {canAdmin && !isClosed && isResolved && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClosureOpen(true);
                  }}
                >
                  <Lock className="h-4 w-4" />
                  {t('caseConsole.actions.close', { defaultValue: 'Close' })}
                </Button>
              )}
            </div>
          </div>
          <CaseProgress
            status={c.status}
            submittedAt={c.submittedAt}
            triagedAt={c.triagedAt}
            assignedAt={c.assignedAt}
            closedAt={c.closedAt}
          />
        </div>

        {errMsg !== null && (
          <p className="rounded-md border border-red-100 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errMsg}
          </p>
        )}

        <CaseTabNav
          activeTab={activeTab}
          onChange={setActiveTab}
          getLabel={(tab) => t(tab.labelKey, { defaultValue: tab.fallback })}
        />

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <Panel
              title={t('caseConsole.panels.incident', { defaultValue: 'Incident' })}
              icon={FileText}
            >
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Field
                  label={t('caseConsole.fields.caseType', { defaultValue: 'Case type' })}
                  value={wbCaseTypeLabelT(c.caseType, t)}
                />
                <Field
                  label={t('caseConsole.fields.intakeMethod', { defaultValue: 'Intake method' })}
                  value={wbIntakeMethodLabelT(c.intakeMethod, t)}
                />
                <Field
                  label={t('caseConsole.fields.dateOfOccurrence', {
                    defaultValue: 'Date of occurrence',
                  })}
                  value={formatDate(c.incidentDate)}
                />
                <Field
                  label={t('caseConsole.fields.whenLast', {
                    defaultValue: 'When it last happened',
                  })}
                  value={c.whenLastOccurred}
                />
                <Field
                  label={t('caseConsole.fields.duration', { defaultValue: 'Duration' })}
                  value={c.conductDuration === null ? null : wbDurationLabelT(c.conductDuration, t)}
                />
                <Field
                  label={t('caseConsole.fields.awareness', {
                    defaultValue: 'How they became aware',
                  })}
                  value={
                    c.awarenessSource === null ? null : wbAwarenessLabelT(c.awarenessSource, t)
                  }
                />
                <Field
                  label={t('caseConsole.fields.previouslyReported', {
                    defaultValue: 'Previously reported',
                  })}
                  value={
                    c.previouslyReported === null
                      ? null
                      : wbPreviouslyReportedLabelT(c.previouslyReported, t)
                  }
                />
                <Field
                  label={t('caseConsole.fields.reporterRelationship', {
                    defaultValue: 'Reporter relationship',
                  })}
                  value={
                    c.relationshipToOrg === null
                      ? null
                      : wbRelationshipLabelT(c.relationshipToOrg, t)
                  }
                />
                <Field
                  label={t('caseConsole.fields.region', { defaultValue: 'Region' })}
                  value={c.regionCode}
                />
                <Field
                  label={t('caseConsole.fields.submitted', { defaultValue: 'Submitted' })}
                  value={formatDateTime(c.submittedAt)}
                />
              </dl>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                  {t('caseConsole.fields.location', { defaultValue: 'Location' })}
                </p>
                <ServerText className="mt-1 block text-sm text-foreground">
                  {formatLocation(c)}
                </ServerText>
              </div>

              {!c.isAnonymous &&
                (c.reporterPhone !== null || c.reporterPreferredContact !== null) && (
                  <div className="mt-4 grid gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
                    <Field
                      label={t('caseConsole.fields.reporterPhone', {
                        defaultValue: 'Reporter phone',
                      })}
                      value={c.reporterPhone}
                    />
                    <Field
                      label={t('caseConsole.fields.bestTime', {
                        defaultValue: 'Best time to contact',
                      })}
                      value={c.reporterPreferredContact}
                    />
                  </div>
                )}

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                  {t('caseConsole.fields.description', { defaultValue: 'Description' })}
                </p>
                <ServerText className="mt-1 block whitespace-pre-wrap text-sm text-foreground">
                  {c.incidentDescription}
                </ServerText>
              </div>

              {c.involvedPersons.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                    {t('caseConsole.fields.involvedPersons', {
                      defaultValue: 'Person(s) engaged in this behavior',
                    })}
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-foreground">
                    {c.involvedPersons.map((p, i) => (
                      <li key={i}>
                        {formatPerson(
                          p.firstName,
                          p.lastName,
                          p.title,
                          t('caseConsole.unknown', { defaultValue: 'Unknown' }),
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {c.personsInvolved !== null && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                    {t('caseConsole.fields.personsInvolvedNotes', {
                      defaultValue: 'Persons involved (notes)',
                    })}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {c.personsInvolved}
                  </p>
                </div>
              )}
            </Panel>
          )}

          {activeTab === 'investigation' && (
            <div className="space-y-6">
              <Panel
                title={t('caseConsole.panels.investigationRecord', {
                  defaultValue: 'Investigation record',
                })}
                icon={ClipboardList}
              >
                {c.preliminaryAssessment === null &&
                c.investigationFindings === null &&
                c.disciplinaryRecommendation === null &&
                c.closureOutcome === null ? (
                  <EmptyState
                    icon={ClipboardList}
                    label={t('caseConsole.investigation.empty', {
                      defaultValue: 'No investigation details recorded yet.',
                    })}
                  />
                ) : (
                  <>
                    {c.preliminaryAssessment !== null && (
                      <RecordBlock
                        label={t('caseConsole.fields.preliminaryAssessment', {
                          defaultValue: 'Preliminary assessment',
                        })}
                        value={c.preliminaryAssessment}
                      />
                    )}
                    {c.investigationFindings !== null && (
                      <RecordBlock
                        label={t('caseConsole.fields.findings', { defaultValue: 'Findings' })}
                        value={c.investigationFindings}
                      />
                    )}
                    {c.disciplinaryRecommendation !== null && (
                      <RecordBlock
                        label={t('caseConsole.fields.disciplinaryRecommendation', {
                          defaultValue: 'Disciplinary recommendation',
                        })}
                        value={c.disciplinaryRecommendation}
                      />
                    )}
                    {c.closureOutcome !== null && (
                      <RecordBlock
                        label={t('caseConsole.fields.closureOutcome', {
                          defaultValue: 'Closure outcome',
                        })}
                        value={c.closureOutcome}
                      />
                    )}
                  </>
                )}
              </Panel>

              <WbCaseParticipantsTab
                caseId={caseId}
                participants={c.participants}
                canEdit={canInvestigate && !isClosed}
              />

              <WbCaseSynopsisTab
                caseId={caseId}
                caseData={c}
                canEdit={canInvestigate && !isClosed}
              />
            </div>
          )}

          {activeTab === 'activity' && (
            <Panel
              title={t('caseConsole.panels.activityEvidence', {
                defaultValue: 'Activity & evidence',
              })}
              icon={MessageSquare}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-border bg-white p-0.5">
                  {(
                    [
                      {
                        key: 'communication',
                        label: t('caseConsole.panels.communication', {
                          defaultValue: 'Communication',
                        }),
                      },
                      {
                        key: 'evidence',
                        label: t('caseConsole.panels.evidence', { defaultValue: 'Evidence' }),
                      },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setActivityView(option.key);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        activityView === option.key
                          ? 'bg-brand-accent text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option.key === 'communication' ? (
                        <MessageSquare className="h-4 w-4 shrink-0" />
                      ) : (
                        <Paperclip className="h-4 w-4 shrink-0" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
                {activityView === 'communication' && canInvestigate && !isClosed && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCommentOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {t('caseConsole.communication.addComment', { defaultValue: 'Add comment' })}
                  </Button>
                )}
                {activityView === 'evidence' && canInvestigate && !isClosed && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-dashed"
                    disabled={addAttachment.isPending}
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                  >
                    <Paperclip className="h-4 w-4" />
                    {addAttachment.isPending
                      ? t('caseConsole.evidence.uploading', { defaultValue: 'Uploading...' })
                      : t('caseConsole.evidence.attach', { defaultValue: 'Attach evidence' })}
                  </Button>
                )}
              </div>

              {activityView === 'communication' ? (
                <div className="rounded-md border border-border bg-muted/50/60 p-3">
                  {c.messages.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      label={t('caseConsole.communication.empty', {
                        defaultValue: 'No messages yet.',
                      })}
                    />
                  ) : (
                    <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                      {visibleMessages.map((m) => (
                        <li
                          key={m.id}
                          className={`rounded-md border p-3 text-sm ${
                            m.isFromReporter
                              ? 'border-blue-100 bg-signal-tint/60 dark:border-blue-900/40 dark:bg-blue-950/20'
                              : m.isInternal
                                ? 'border-amber-100 bg-courage-tint/60 dark:border-amber-900/40 dark:bg-amber-950/20'
                                : 'border-border bg-white'
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground/70">
                            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                              {m.isFromReporter ? (
                                <Inbox className="h-4 w-4 text-blue-500" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-muted-foreground/70" />
                              )}
                              {m.isFromReporter ? (
                                t('caseConsole.communication.reporter', {
                                  defaultValue: 'Reporter',
                                })
                              ) : (
                                <ServerText>
                                  {m.author?.displayName ??
                                    m.author?.email ??
                                    t('caseConsole.communication.investigator', {
                                      defaultValue: 'Investigator',
                                    })}
                                </ServerText>
                              )}
                              {m.isInternal && (
                                <span className="ml-1 inline-flex items-center gap-0.5 text-courage-strong">
                                  <Lock className="h-4 w-4" />
                                  {t('caseConsole.communication.internal', {
                                    defaultValue: 'Internal',
                                  })}
                                </span>
                              )}
                            </span>
                            <span>{formatDateTime(m.createdAt)}</span>
                          </div>
                          <ServerText className="block whitespace-pre-wrap text-foreground">
                            {m.content}
                          </ServerText>
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.messages.length > DETAIL_PAGE_SIZE && (
                    <Pagination meta={messagesMeta} onPageChange={setMessagesPage} />
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-border bg-muted/50/60 p-3">
                  {c.attachments.length === 0 ? (
                    <EmptyState
                      icon={Paperclip}
                      label={t('caseConsole.evidence.empty', {
                        defaultValue: 'No evidence attached.',
                      })}
                    />
                  ) : (
                    <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                      {visibleAttachments.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-2 py-2 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Paperclip className="h-5 w-5 shrink-0 text-muted-foreground/70" />
                            <span className="truncate text-foreground">
                              {a.fileName}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground/70">
                              {formatBytes(a.sizeBytes)} ·{' '}
                              {a.isFromReporter
                                ? t('caseConsole.evidence.reporter', { defaultValue: 'reporter' })
                                : t('caseConsole.evidence.investigator', {
                                    defaultValue: 'investigator',
                                  })}
                            </span>
                          </div>
                          {canRead && (
                            <button
                              onClick={() => {
                                onDownload(a.id);
                              }}
                              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-brand-accent"
                            >
                              <Download className="h-4 w-4" />
                              {t('caseConsole.evidence.download', { defaultValue: 'Download' })}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.attachments.length > DETAIL_PAGE_SIZE && (
                    <Pagination meta={attachmentsMeta} onPageChange={setAttachmentsPage} />
                  )}
                  {addAttachment.error !== null && (
                    <p className="mt-2 text-xs text-destructive">
                      {getApiErrorMessage(addAttachment.error)}
                    </p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={onUpload}
                    disabled={addAttachment.isPending}
                  />
                </div>
              )}

              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('caseConsole.panels.relatedCases', { defaultValue: 'Related cases' })}
                  </h3>
                  {(canInvestigate || canAdmin) && !isClosed ? (
                    <ToggleActionButton
                      open={relatedOpen}
                      onClick={() => {
                        setRelatedOpen((value) => !value);
                      }}
                      icon={Link2}
                    >
                      {t('caseConsole.actions.linkRelatedCase', {
                        defaultValue: 'Link related case',
                      })}
                    </ToggleActionButton>
                  ) : undefined}
                </div>
                {c.relatedCases.length === 0 ? (
                  <EmptyState
                    icon={ListTree}
                    label={t('caseConsole.related.empty', { defaultValue: 'No linked cases.' })}
                  />
                ) : (
                  <ul className="space-y-2 text-sm">
                    {visibleRelatedCases.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2">
                        <Link
                          to={detailRoute(r.id)}
                          className="text-foreground hover:text-brand-accent"
                        >
                          <ServerText>{r.caseReferenceNumber}</ServerText>
                        </Link>
                        {(canInvestigate || canAdmin) && !isClosed && (
                          <button
                            onClick={() => {
                              handleUnlinkCase(r.id);
                            }}
                            className="text-xs text-muted-foreground/70 hover:text-red-600"
                          >
                            {t('caseConsole.actions.unlink', { defaultValue: 'Unlink' })}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {c.relatedCases.length > DETAIL_PAGE_SIZE && (
                  <Pagination meta={relatedCasesMeta} onPageChange={setRelatedCasesPage} />
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>

      {canInvestigate && !isClosed && (
        <Sheet
          isOpen={synopsisOpen}
          onClose={() => {
            setSynopsisOpen(false);
          }}
          title={t('caseConsole.panels.synopsisOutcome', {
            defaultValue: 'Synopsis & outcome',
          })}
          description={t('caseConsole.synopsis.sheetDescription', {
            defaultValue: 'Review or update the outcome and next steps for this case.',
          })}
          width="2xl"
        >
          <WbCaseSynopsisTab caseId={caseId} caseData={c} canEdit />
        </Sheet>
      )}

      {canInvestigate && !isClosed && (
        <Sheet
          isOpen={triageOpen}
          onClose={() => {
            setTriageOpen(false);
          }}
          title={t('caseConsole.panels.triage', { defaultValue: 'Triage & priority' })}
          description={t('caseConsole.triage.sheetDescription', {
            defaultValue: 'Set the risk level and record the preliminary assessment.',
          })}
          width="2xl"
          footer={
            <div className="form-sheet-footer">
              <Button
                variant="outline"
                onClick={() => {
                  setTriageOpen(false);
                }}
                disabled={triage.isPending}
              >
                {t('caseConsole.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button onClick={handleSetPriority} disabled={setPriorityM.isPending}>
                {setPriorityM.isPending
                  ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                  : t('caseConsole.actions.savePriority', { defaultValue: 'Save priority' })}
              </Button>
              <Button onClick={handleTriage} disabled={triage.isPending}>
                {triage.isPending
                  ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                  : t('caseConsole.actions.triage', { defaultValue: 'Triage case' })}
              </Button>
            </div>
          }
        >
          <div className="form-sheet-body space-y-4">
            <label className="block text-sm font-medium text-foreground">
              {t('caseConsole.fields.priority', { defaultValue: 'Priority' })}
              <Select
                value={priority}
                onChange={(event) => {
                  setPriorityVal(event.target.value as InvestigationPriority);
                }}
              >
                {WB_PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {wbPriorityLabelT(option, t)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-medium text-foreground">
              {t('caseConsole.fields.preliminaryAssessment', {
                defaultValue: 'Preliminary assessment',
              })}
              <Textarea
                value={assessment}
                onChange={(event) => {
                  setAssessment(event.target.value);
                }}
                rows={5}
              />
            </label>
          </div>
        </Sheet>
      )}

      {canInvestigate && !isClosed && (
        <Sheet
          isOpen={resolveOpen}
          onClose={() => {
            setResolveOpen(false);
          }}
          title={t('caseConsole.panels.resolve', { defaultValue: 'Resolve investigation' })}
          description={t('caseConsole.resolve.sheetDescription', {
            defaultValue: 'Record the investigation findings and recommended action.',
          })}
          width="2xl"
          footer={
            <div className="form-sheet-footer">
              <Button
                variant="outline"
                onClick={() => {
                  setResolveOpen(false);
                }}
                disabled={resolve.isPending}
              >
                {t('caseConsole.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button onClick={handleResolve} disabled={resolve.isPending}>
                {resolve.isPending
                  ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                  : t('caseConsole.actions.resolve', { defaultValue: 'Resolve case' })}
              </Button>
            </div>
          }
        >
          <div className="form-sheet-body space-y-4">
            <label className="block text-sm font-medium text-foreground">
              {t('caseConsole.fields.findings', { defaultValue: 'Findings' })}
              <Textarea
                value={findings}
                onChange={(event) => {
                  setFindings(event.target.value);
                }}
                rows={6}
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              {t('caseConsole.fields.disciplinaryRecommendation', {
                defaultValue: 'Disciplinary recommendation',
              })}
              <Textarea
                value={discipline}
                onChange={(event) => {
                  setDiscipline(event.target.value);
                }}
                rows={4}
              />
            </label>
          </div>
        </Sheet>
      )}

      {canInvestigate && !isClosed && (
        <Sheet
          isOpen={escalateOpen}
          onClose={() => {
            setEscalateOpen(false);
          }}
          title={t('caseConsole.panels.escalate', { defaultValue: 'Escalate case' })}
          description={t('caseConsole.escalate.sheetDescription', {
            defaultValue: 'Explain why this case requires senior management review.',
          })}
          width="2xl"
          footer={
            <div className="form-sheet-footer">
              <Button
                variant="outline"
                onClick={() => {
                  setEscalateOpen(false);
                }}
                disabled={escalate.isPending}
              >
                {t('caseConsole.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button onClick={handleEscalate} disabled={escalate.isPending}>
                {escalate.isPending
                  ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                  : t('caseConsole.actions.escalate', { defaultValue: 'Escalate case' })}
              </Button>
            </div>
          }
        >
          <div className="form-sheet-body">
            <label className="block text-sm font-medium text-foreground">
              {t('caseConsole.fields.escalationReason', { defaultValue: 'Escalation reason' })}
              <Textarea
                value={escalateReason}
                onChange={(event) => {
                  setEscalateReason(event.target.value);
                }}
                rows={6}
              />
            </label>
          </div>
        </Sheet>
      )}

      {canAdmin && !isClosed && isResolved && (
        <Sheet
          isOpen={closureOpen}
          onClose={() => {
            setClosureOpen(false);
          }}
          title={t('caseConsole.panels.closure', { defaultValue: 'Close or dismiss case' })}
          description={t('caseConsole.closure.sheetDescription', {
            defaultValue: 'Record the final outcome before closing this case.',
          })}
          width="2xl"
          footer={
            <div className="form-sheet-footer">
              <Button
                variant="outline"
                onClick={() => {
                  setClosureOpen(false);
                }}
                disabled={close.isPending}
              >
                {t('caseConsole.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleClose(true);
                }}
                disabled={close.isPending}
              >
                {close.isPending
                  ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                  : t('caseConsole.actions.dismiss', { defaultValue: 'Dismiss' })}
              </Button>
              <Button
                onClick={() => {
                  handleClose(false);
                }}
                disabled={close.isPending}
              >
                {close.isPending
                  ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                  : t('caseConsole.actions.close', { defaultValue: 'Close case' })}
              </Button>
            </div>
          }
        >
          <div className="form-sheet-body">
            <label className="block text-sm font-medium text-foreground">
              {t('caseConsole.fields.closureOutcome', { defaultValue: 'Closure outcome' })}
              <Textarea
                value={closureOutcome}
                onChange={(event) => {
                  setClosureOutcome(event.target.value);
                }}
                rows={6}
              />
            </label>
          </div>
        </Sheet>
      )}

      {canAdmin && !isClosed && (
        <Sheet
          isOpen={assignmentOpen}
          onClose={() => {
            setAssignmentOpen(false);
          }}
          title={t('caseConsole.panels.assignment', { defaultValue: 'Assignment' })}
          description={t('caseConsole.assignment.sheetDescription', {
            defaultValue: 'Assign this case to an investigator responsible for the next review.',
          })}
          width="2xl"
          footer={
            <div className="form-sheet-footer">
              <Button
                variant="outline"
                onClick={() => {
                  setAssignmentOpen(false);
                }}
                disabled={assign.isPending}
              >
                {t('caseConsole.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                onClick={handleAssign}
                disabled={assign.isPending || investigatorId.length === 0}
              >
                <UserPlus className="h-4 w-4" />
                {assign.isPending
                  ? t('caseConsole.actions.saving', { defaultValue: 'Saving...' })
                  : t('caseConsole.assignment.assign', { defaultValue: 'Assign' })}
              </Button>
            </div>
          }
        >
          <div className="form-sheet-body space-y-4">
            <p className="text-sm text-muted-foreground">
              {c.assignedInvestigator !== null
                ? t('caseConsole.assignment.assignedPrefix', {
                    defaultValue: 'Assigned: {{name}}',
                    name: c.assignedInvestigator.displayName ?? c.assignedInvestigator.email,
                  })
                : t('caseConsole.assignment.unassigned', {
                    defaultValue: 'This case is currently unassigned.',
                  })}
            </p>
            <Select
              value={investigatorId}
              onChange={(event) => {
                setInvestigatorId(event.target.value);
              }}
            >
              <option value="">
                {t('caseConsole.assignment.selectInvestigator', {
                  defaultValue: 'Select investigator...',
                })}
              </option>
              {eligibleInvestigators.map((u) => (
                <option key={u.id} value={u.id} translate="no" dir="auto">
                  {u.displayName ?? u.email}
                </option>
              ))}
            </Select>
          </div>
        </Sheet>
      )}

      {canInvestigate && !isClosed && (
        <WbCaseParticipantsTab
          caseId={caseId}
          participants={c.participants}
          canEdit
          showSection={false}
          openForm={participantOpen}
          onOpenFormChange={setParticipantOpen}
        />
      )}

      {canInvestigate && !isClosed && (
        <Sheet
          isOpen={classificationOpen}
          onClose={() => {
            setClassificationOpen(false);
          }}
          title={t('caseConsole.panels.classification', { defaultValue: 'Classification' })}
          description={t('caseConsole.classification.sheetDescription', {
            defaultValue: 'Set how this report entered the case workflow and how it is classified.',
          })}
          width="2xl"
        >
          <WbCaseClassificationTab
            caseId={caseId}
            caseData={c}
            canEdit
            onSaved={() => {
              setClassificationOpen(false);
            }}
          />
        </Sheet>
      )}

      {canInvestigate && !isClosed && (
        <Sheet
          isOpen={commentOpen}
          onClose={() => {
            setCommentOpen(false);
          }}
          title={t('caseConsole.communication.addComment', { defaultValue: 'Add comment' })}
          description={t('caseConsole.communication.sheetDescription', {
            defaultValue: 'Send a secure follow-up message to the investigation team.',
          })}
          width="2xl"
          footer={
            <div className="form-sheet-footer">
              <Button
                variant="outline"
                onClick={() => {
                  setCommentOpen(false);
                }}
                disabled={comment.isPending}
              >
                {t('caseConsole.actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                onClick={handleComment}
                disabled={comment.isPending || commentText.trim().length === 0}
              >
                <Send className="h-4 w-4" />
                {comment.isPending
                  ? t('caseConsole.communication.sending', { defaultValue: 'Sending...' })
                  : t('caseConsole.communication.send', { defaultValue: 'Send' })}
              </Button>
            </div>
          }
        >
          <div className="form-sheet-body">
            <div className="rounded-lg border border-brand-accent/20 bg-[#F2EFFF]/50 px-4 py-3 text-sm text-brand-primary">
              {t('caseConsole.communication.commentGuidance', {
                defaultValue:
                  'Use this for case updates, investigator notes, follow-up questions, or additional context.',
              })}
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-foreground">
                {t('caseConsole.communication.commentLabel', { defaultValue: 'Comment' })}
              </span>
              <Textarea
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                }}
                rows={7}
                placeholder={t('caseConsole.communication.placeholder', {
                  defaultValue: 'Write a message...',
                })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={commentInternal}
                onChange={(e) => {
                  setCommentInternal(e.target.checked);
                }}
                className="h-4 w-4 rounded border-border"
              />
              {t('caseConsole.communication.internalNote', {
                defaultValue: 'Internal note (hidden from reporter)',
              })}
            </label>
          </div>
        </Sheet>
      )}

      {(canInvestigate || canAdmin) && !isClosed && (
        <Sheet
          isOpen={relatedOpen}
          onClose={() => {
            setRelatedOpen(false);
            setLinkRef('');
          }}
          title={t('caseConsole.actions.linkRelatedCase', { defaultValue: 'Link related case' })}
          description={t('caseConsole.related.sheetDescription', {
            defaultValue:
              'Search case reference or keywords to link related whistleblowing reports.',
          })}
          width="2xl"
        >
          <div className="form-sheet-body space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('caseConsole.related.searchLabel', {
                  defaultValue: 'Search case reference or keywords',
                })}
              </label>
              <div className="flex gap-2">
                <Input
                  value={linkRef}
                  onChange={(e) => {
                    setLinkRef(e.target.value);
                  }}
                  placeholder={t('caseConsole.placeholders.caseReferenceToLink', {
                    defaultValue: 'Type reference (e.g. WB-2026) or keyword...',
                  })}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={link.isPending || linkRef.trim().length === 0}
                  onClick={handleLinkCase}
                  className="shrink-0"
                >
                  <Link2 className="h-4 w-4" />
                  {t('caseConsole.actions.link', { defaultValue: 'Link' })}
                </Button>
              </div>
            </div>

            {linkRef.trim().length > 0 && (
              <div className="rounded-lg border border-border bg-muted/50/70 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {t('caseConsole.related.searchResults', { defaultValue: 'Matching cases' })}
                </p>
                {searchCases.isLoading ? (
                  <p className="py-2 text-xs text-muted-foreground/70">
                    {t('common.loading', { defaultValue: 'Searching cases...' })}
                  </p>
                ) : availableSuggestions.length === 0 ? (
                  <p className="py-2 text-xs text-muted-foreground">
                    {t('caseConsole.related.noMatches', {
                      defaultValue: 'No matching unlinked cases found.',
                    })}
                  </p>
                ) : (
                  <ul className="max-h-56 divide-y divide-border/60 overflow-y-auto">
                    {availableSuggestions.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-foreground">
                            {item.caseReferenceNumber}
                          </span>
                          <span className="ml-2 inline-flex items-center text-xs">
                            <WbStatusBadge status={item.status} />
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={link.isPending}
                          onClick={() => {
                            handleLinkCaseDirect(item.caseReferenceNumber);
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                          {t('caseConsole.actions.link', { defaultValue: 'Link' })}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('caseConsole.panels.relatedCases', { defaultValue: 'Currently Linked Cases' })} (
                {c.relatedCases.length})
              </h4>
              {c.relatedCases.length === 0 ? (
                <EmptyState
                  icon={ListTree}
                  label={t('caseConsole.related.empty', { defaultValue: 'No linked cases.' })}
                />
              ) : (
                <ul className="space-y-2 text-sm">
                  {visibleRelatedCases.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-white p-2.5"
                    >
                      <Link
                        to={detailRoute(r.id)}
                        className="font-medium text-foreground hover:text-brand-accent"
                      >
                        <ServerText>{r.caseReferenceNumber}</ServerText>
                      </Link>
                      {(canInvestigate || canAdmin) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            handleUnlinkCase(r.id);
                          }}
                          className="h-7 text-xs text-destructive hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                        >
                          {t('caseConsole.actions.unlink', { defaultValue: 'Unlink' })}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Sheet>
      )}
    </>
  );
}

function formatPerson(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  title: string | null | undefined,
  unknown = 'Unknown',
): string {
  const name = [firstName, lastName]
    .filter((value): value is string => value !== null && value !== undefined && value.length > 0)
    .join(' ');
  const parts = [name, title].filter(
    (value): value is string => value !== null && value !== undefined && value.length > 0,
  );
  return parts.length > 0 ? parts.join(' - ') : unknown;
}

function formatLocation(c: WbCaseDetail): string {
  const lines: string[] = [];
  if (c.incidentLocation !== null && c.incidentLocation.length > 0) {
    lines.push(c.incidentLocation);
  }
  const cityLine = [c.locationCity, c.locationState, c.locationPostalCode]
    .filter((value) => value !== null && value.length > 0)
    .join(', ');
  if (cityLine.length > 0) {
    lines.push(cityLine);
  }
  if (c.locationCountry !== null && c.locationCountry.length > 0) {
    lines.push(c.locationCountry);
  }
  return lines.length > 0 ? lines.join(' - ') : '-';
}
