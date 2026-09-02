import { getDirection } from '@/i18n';
import { BrandLogo } from '@components/common/BrandLogo';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { Loader } from '@components/common/Loader';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { PageTitle } from '@components/ui/page-title';
import { Pagination } from '@components/ui/pagination';
import { PasswordInput } from '@components/ui/password-input';
import { PrimaryButton } from '@components/ui/primary-button';
import { Sheet } from '@components/ui/sheet';
import { reporterService } from '@features/whistleblowing/api/reporter.service';
import {
  clearReporterToken,
  hasReporterSession,
  saveReporterToken,
} from '@features/whistleblowing/reporterSession';
import { formatDate, formatDateTime, wbStatusVariant } from '@features/whistleblowing/utils/format';
import {
  wbCategoryLabelT,
  wbDurationLabelT,
  wbPreviouslyReportedLabelT,
  wbRelationshipLabelT,
  wbStatusLabelT,
} from '@features/whistleblowing/utils/i18n';
import { getApiErrorMessage } from '@lib/api-error';
import { cn } from '@lib/utils';
import { toast } from '@store/toastStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Copy,
  FileText,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  MessageSquarePlus,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportShell } from './ReportShell';

type TrackTab = 'details' | 'messages' | 'attachments';

function ShieldCheckGraphic(): ReactElement {
  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg
        width="160"
        height="140"
        viewBox="0 0 160 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-32 w-36 select-none"
      >
        <defs>
          <linearGradient
            id="tealShieldGrad"
            x1="80"
            y1="42"
            x2="80"
            y2="98"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0d9488" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
          <filter
            id="shieldShadow"
            x="48"
            y="38"
            width="64"
            height="72"
            filterUnits="userSpaceOnUse"
          >
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f766e" floodOpacity="0.3" />
          </filter>
        </defs>

        <circle cx="148" cy="114" r="3.5" fill="#99f6e4" opacity="0.7" />
        <circle cx="124" cy="18" r="4.5" fill="#99f6e4" opacity="0.6" />
        <path
          d="M22 108C12 88 16 58 28 42"
          stroke="#ccfbf1"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.5"
        />

        <circle cx="80" cy="70" r="62" fill="#f0fdfa" opacity="0.6" />
        <circle
          cx="80"
          cy="70"
          r="50"
          fill="#e6fffa"
          stroke="#ccfbf1"
          strokeWidth="6"
          opacity="0.8"
        />
        <circle cx="80" cy="70" r="38" fill="#ccfbf1" opacity="0.5" />
        <circle cx="80" cy="70" r="28" fill="#99f6e4" opacity="0.4" />

        <path
          d="M80 44C65 44 58 48 58 48V68C58 84 72 96 80 100C88 96 102 84 102 68V48C102 48 95 44 80 44Z"
          fill="url(#tealShieldGrad)"
          filter="url(#shieldShadow)"
        />

        <path
          d="M72 71.5L77.5 77L88 65.5"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function PrivacyHelpBanner(): ReactElement {
  const { t } = useTranslation('whistleblowing');

  return (
    <div className="relative w-full overflow-hidden bg-[#003c3d] px-6 py-7 sm:px-12">
      <div className="pointer-events-none absolute bottom-3 left-4 opacity-30">
        <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
          <pattern id="dot-left" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#2dd4bf" />
          </pattern>
          <rect width="80" height="50" fill="url(#dot-left)" />
        </svg>
      </div>

      <div className="pointer-events-none absolute right-4 top-3 opacity-30">
        <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
          <pattern id="dot-right" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#2dd4bf" />
          </pattern>
          <rect width="80" height="50" fill="url(#dot-right)" />
        </svg>
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 md:flex-row md:gap-12">
        {/* Privacy Section */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#005253]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
                fill="var(--tw-color-brand-accent)"
                stroke="#2dd4bf"
                strokeWidth="1.5"
              />
              <path
                d="M9 12L11 14L15 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {t('track.banner.privacyTitle', { defaultValue: 'Your privacy matters' })}
            </h4>
            <p className="text-xs text-muted-foreground/70">
              {t('track.banner.privacyBody', {
                defaultValue:
                  'Your report is encrypted and handled confidentially. You may report anonymously.',
              })}
            </p>
          </div>
        </div>

        <div className="hidden h-10 w-[1px] bg-white/20 md:block" />

        {/* Help Section */}
        <div>
          <h4 className="text-sm font-bold text-white">
            {t('track.banner.helpTitle', { defaultValue: 'Need help?' })}
          </h4>
          <p className="text-xs text-muted-foreground/70">
            {t('track.banner.helpBody', {
              defaultValue: 'If you have any questions, please contact our Whistleblowing Office.',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function TrackCardField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon: LucideIcon;
}): ReactElement | null {
  if (value === null || value.length === 0 || value === '—') {
    return null;
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50/50 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
        <Icon className="h-4 w-4" />
      </span>
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function MessageAvatar({ fromReporter }: { fromReporter: boolean }): ReactElement {
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        fromReporter
          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
          : 'bg-[#4B2E58]/10 text-[#4B2E58]',
      )}
    >
      {fromReporter ? <User className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
    </span>
  );
}

function UserMenu({
  name,
  email,
  onSignOut,
}: {
  name: string;
  email: string;
  onSignOut: () => void;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
        }}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-teal-50 dark:hover:bg-teal-900/20"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-foreground sm:inline">
          {name}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={t('track.userMenu.close', { defaultValue: 'Close menu' })}
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => {
              setOpen(false);
            }}
          />
          <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white">
                <User className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {name}
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground/70">
                  <Mail className="h-3 w-3 shrink-0" />
                  {email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              {t('track.actions.signOut', { defaultValue: 'Sign out' })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const REPORTER_CASE_KEY = ['reporter', 'me'];

export function ReportTrackPage(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const qc = useQueryClient();
  const [authed, setAuthed] = useState(hasReporterSession());

  const [reference, setReference] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TrackTab>('details');

  const login = useMutation({
    mutationFn: (v: { reference: string; password: string }) =>
      reporterService.login(v.reference, v.password),
    onSuccess: (session) => {
      saveReporterToken(session.token);
      setAuthed(true);
      void qc.invalidateQueries({ queryKey: REPORTER_CASE_KEY });
    },
    onError: (e) => {
      setLoginError(getApiErrorMessage(e));
    },
  });

  const caseQuery = useQuery({
    queryKey: REPORTER_CASE_KEY,
    queryFn: () => reporterService.myCase(),
    enabled: authed,
    retry: false,
  });

  const [commentPage, setCommentPage] = useState(1);
  const [commentPageSize, setCommentPageSize] = useState(5);
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');

  const commentsQuery = useQuery({
    queryKey: ['reporter', 'me', 'comments', commentPage, commentPageSize],
    queryFn: () => reporterService.myComments(commentPage, commentPageSize),
    enabled: authed,
    retry: false,
  });

  const comment = useMutation({
    mutationFn: (content: string) => reporterService.addComment(content),
    onSuccess: () => {
      setCommentDraft('');
      setCommentSheetOpen(false);
      setCommentPage(1);
      void qc.invalidateQueries({ queryKey: ['reporter', 'me', 'comments'] });
      toast.success(
        t('track.comments.sentToast', {
          defaultValue: 'Your comment was sent.',
        }),
      );
    },
  });

  const attach = useMutation({
    mutationFn: (file: File) => reporterService.addAttachment(file),
    onSuccess: (data) => {
      qc.setQueryData(REPORTER_CASE_KEY, data);
      toast.success(
        t('track.attachments.uploadedToast', {
          defaultValue: 'Your evidence was uploaded.',
        }),
      );
    },
  });

  const logout = (): void => {
    clearReporterToken();
    setAuthed(false);
    setPassword('');
    setCommentDraft('');
    setCommentSheetOpen(false);
    setCommentPage(1);
    setCommentPageSize(5);
    setActiveTab('details');
    qc.removeQueries({ queryKey: REPORTER_CASE_KEY });
    qc.removeQueries({ queryKey: ['reporter', 'me', 'comments'] });
    toast.success(t('track.toasts.signedOut', { defaultValue: 'Signed out successfully.' }));
  };

  const copyReference = (ref: string) => {
    void navigator.clipboard.writeText(ref);
    toast.success(t('track.toasts.copiedRef', { defaultValue: 'Reference code copied!' }));
  };

  const sessionInvalid = authed && caseQuery.isError;
  const caseError = caseQuery.error;
  useEffect(() => {
    if (sessionInvalid) {
      clearReporterToken();
      setAuthed(false);
      setLoginError(
        getApiErrorMessage(
          caseError,
          t('track.login.sessionExpired', {
            defaultValue: 'Your session has expired. Please log in again.',
          }),
        ),
      );
    }
  }, [sessionInvalid, caseError, t]);

  if (!authed) {
    return (
      <LoginView
        reference={reference}
        password={password}
        setReference={setReference}
        setPassword={setPassword}
        error={loginError}
        isPending={login.isPending}
        onSubmit={() => {
          setLoginError(null);
          if (reference.trim().length === 0 || password.length === 0) {
            setLoginError(
              t('track.login.validation.empty', {
                defaultValue: 'Enter your case reference and password.',
              }),
            );
            return;
          }
          login.mutate({ reference: reference.trim(), password });
        }}
      />
    );
  }

  if (caseQuery.isLoading || caseQuery.data === undefined) {
    return (
      <ReportShell
        title={t('track.case.title', { defaultValue: 'Your report' })}
        showTrackLink={false}
      >
        <Loader label={t('track.case.loading', { defaultValue: 'Loading your case...' })} />
      </ReportShell>
    );
  }

  const c = caseQuery.data;
  const isClosed = c.status === 'WB_CLOSED' || c.status === 'WB_DISMISSED';

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file === undefined) {
      return;
    }
    attach.mutate(file);
    e.target.value = '';
  };

  const mutError = comment.error ?? attach.error;

  const tabs: { id: TrackTab; label: string; icon: typeof FileText; count?: number }[] = [
    {
      id: 'details',
      label: t('track.tabs.details', { defaultValue: 'Details' }),
      icon: FileText,
    },
    {
      id: 'messages',
      label: t('track.tabs.messages', { defaultValue: 'Messages' }),
      icon: MessageSquare,
      count: commentsQuery.data?.meta.total ?? 0,
    },
    {
      id: 'attachments',
      label: t('track.tabs.attachments', { defaultValue: 'Evidence' }),
      icon: Paperclip,
      count: c.attachments.length,
    },
  ];

  return (
    <ReportShell
      showPageTitle={false}
      showTrackLink={false}
      action={
        <UserMenu
          name={t('track.userMenu.reporterName', { defaultValue: 'Reporter' })}
          email={c.caseReferenceNumber}
          onSignOut={logout}
        />
      }
      bottomBanner={<PrivacyHelpBanner />}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">
              {t('track.case.title', { defaultValue: 'Your report' })}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('track.case.referenceSubtitle', {
                  defaultValue: 'Reference {{ref}}',
                  ref: c.caseReferenceNumber,
                })}
              </span>
              <button
                type="button"
                onClick={() => {
                  copyReference(c.caseReferenceNumber);
                }}
                className="text-muted-foreground/70 transition-colors hover:text-brand-accent dark:hover:text-brand-accent"
                title="Copy reference"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={wbStatusVariant(c.status)} className="bg-teal-50 text-teal-700">
                <ShieldCheck className="mr-1 h-3 w-3" />
                {wbStatusLabelT(c.status, t)}
              </Badge>
              <Badge
                variant="default"
                className="border border-border bg-transparent text-muted-foreground shadow-none hover:bg-transparent"
              >
                {wbCategoryLabelT(c.category, t)}
              </Badge>
            </div>
          </div>

          <div className="shadow-xs flex shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-4 py-3">
            <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <div className="text-xs">
              <p className="text-muted-foreground/70">
                {t('track.case.submittedLabel', { defaultValue: 'Submitted' })}
              </p>
              <p className="font-semibold text-foreground">
                {formatDate(c.submittedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed Case Content Container */}
        <div className="shadow-xs mt-6 rounded-2xl border border-border bg-white">
          <div className="flex items-center gap-2 border-b border-border px-4 pt-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'border-brand-accent text-brand-accent dark:border-brand-accent dark:text-brand-accent'
                      : 'border-transparent text-muted-foreground hover:text-brand-accent dark:hover:text-brand-accent',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        isActive
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6 p-6">
              <div className="relative mb-6">
                <div className="space-y-3 pr-44">
                  <h3 className="text-base font-bold text-foreground">
                    {t('track.case.detailsHeading', { defaultValue: 'Report details' })}
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {c.incidentDescription}
                  </p>
                </div>

                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <ShieldCheckGraphic />
                </div>
              </div>

              {(c.incidentDate !== null ||
                c.incidentLocation !== null ||
                c.whenLastOccurred !== null ||
                c.conductDuration !== null ||
                c.previouslyReported !== null ||
                c.relationshipToOrg !== null) && (
                <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
                  <TrackCardField
                    icon={Calendar}
                    label={t('track.case.fields.dateOfOccurrence', {
                      defaultValue: 'Date of occurrence',
                    })}
                    value={formatDate(c.incidentDate)}
                  />
                  <TrackCardField
                    icon={MapPin}
                    label={t('track.case.fields.location', { defaultValue: 'Location' })}
                    value={c.incidentLocation}
                  />
                  <TrackCardField
                    icon={User}
                    label={t('track.case.fields.relationship', { defaultValue: 'Relationship' })}
                    value={
                      c.relationshipToOrg === null
                        ? null
                        : wbRelationshipLabelT(c.relationshipToOrg, t)
                    }
                  />
                  <TrackCardField
                    icon={Clock}
                    label={t('track.case.fields.whenLast', {
                      defaultValue: 'When it last happened',
                    })}
                    value={c.whenLastOccurred}
                  />
                  <TrackCardField
                    icon={RotateCcw}
                    label={t('track.case.fields.duration', { defaultValue: 'Duration' })}
                    value={
                      c.conductDuration === null ? null : wbDurationLabelT(c.conductDuration, t)
                    }
                  />
                  <TrackCardField
                    icon={ShieldCheck}
                    label={t('track.case.fields.previouslyReported', {
                      defaultValue: 'Previously reported',
                    })}
                    value={
                      c.previouslyReported === null
                        ? null
                        : wbPreviouslyReportedLabelT(c.previouslyReported, t)
                    }
                  />
                </div>
              )}

              {c.involvedPersons.length > 0 && (
                <div className="border-t border-border pt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {t('track.case.identifiedPersons', {
                      defaultValue: 'Person(s) you identified',
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.involvedPersons.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                      >
                        <User className="h-3.5 w-3.5" />
                        {[p.firstName, p.lastName]
                          .filter((x): x is string => x !== null && x !== undefined && x.length > 0)
                          .join(' ')}
                        {p.title !== null && p.title !== undefined && p.title.length > 0
                          ? ` - ${p.title}`
                          : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-4 p-6">
              {!isClosed && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brand-accent/50 hover:bg-brand-accent/10 hover:text-brand-accent dark:hover:border-brand-accent/50 dark:hover:bg-brand-accent/10 dark:hover:text-brand-accent">
                    <Paperclip className="h-3.5 w-3.5" />
                    {attach.isPending
                      ? t('track.messages.uploading', { defaultValue: 'Uploading...' })
                      : t('track.messages.attachEvidence', { defaultValue: 'Attach evidence' })}
                    <input
                      type="file"
                      className="hidden"
                      onChange={onUpload}
                      disabled={attach.isPending}
                    />
                  </label>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCommentDraft('');
                      setCommentSheetOpen(true);
                    }}
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {t('track.messages.addComment', { defaultValue: 'Add comment' })}
                  </Button>
                </div>
              )}

              {commentsQuery.isError ? (
                <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {getApiErrorMessage(commentsQuery.error)}
                </div>
              ) : commentsQuery.isLoading || commentsQuery.data === undefined ? (
                <div className="py-8">
                  <Loader
                    label={t('track.messages.loading', { defaultValue: 'Loading messages...' })}
                  />
                </div>
              ) : commentsQuery.data.data.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-slate-200" />
                  <p className="text-sm text-muted-foreground/70">
                    {t('track.messages.emptyTitle', { defaultValue: 'No messages yet.' })}
                  </p>
                </div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {commentsQuery.data.data.map((m) => (
                      <li
                        key={m.id}
                        className={cn(
                          'flex gap-3 rounded-xl border p-4 text-sm',
                          m.fromReporter
                            ? 'border-teal-100 bg-teal-50/50 dark:border-teal-800/40 dark:bg-teal-900/20'
                            : 'border-border bg-muted/50',
                        )}
                      >
                        <MessageAvatar fromReporter={m.fromReporter} />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center justify-between gap-3">
                            <span
                              className={cn(
                                'text-xs font-semibold',
                                m.fromReporter
                                  ? 'text-teal-700 dark:text-teal-400'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {m.authorLabel === 'You'
                                ? t('track.messages.authorYou', { defaultValue: 'You' })
                                : t('track.messages.authorTeam', {
                                    defaultValue: 'Investigation team',
                                  })}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground/70">
                              {formatDateTime(m.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-foreground">
                            {m.content}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <Pagination
                    meta={commentsQuery.data.meta}
                    onPageChange={(page) => {
                      setCommentPage(page);
                    }}
                    onPageSizeChange={(size) => {
                      setCommentPage(1);
                      setCommentPageSize(size);
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    className="border-0 px-0 pb-0 pt-2"
                  />
                </>
              )}
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div className="p-6">
              {c.attachments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Paperclip className="h-8 w-8 text-slate-200" />
                  <p className="text-sm text-muted-foreground/70">
                    {t('track.attachments.emptyTitle', {
                      defaultValue: 'No evidence uploaded yet.',
                    })}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {c.attachments.map((a) => (
                    <li key={a.id} className="group flex items-center gap-3 py-3 text-sm">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                        <Paperclip className="h-4 w-4" />
                      </span>
                      <span className="truncate font-medium text-foreground">
                        {a.fileName}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground/70">
                        {formatDate(a.addedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Comment Sheet */}
        <Sheet
          isOpen={commentSheetOpen}
          onClose={() => {
            setCommentSheetOpen(false);
          }}
          title={t('track.comments.sheetTitle', { defaultValue: 'Add comment' })}
          description={t('track.comments.sheetDescription', {
            defaultValue: 'Send a secure follow-up message to the investigation team.',
          })}
          width="lg"
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCommentSheetOpen(false);
                }}
              >
                {t('track.comments.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="button"
                disabled={comment.isPending || commentDraft.trim().length === 0}
                onClick={() => {
                  comment.mutate(commentDraft.trim());
                }}
              >
                <Send className="h-4 w-4" />
                {comment.isPending
                  ? t('track.comments.sending', { defaultValue: 'Sending...' })
                  : t('track.comments.send', { defaultValue: 'Send comment' })}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-teal-900 dark:border-teal-800/40 dark:bg-teal-900/20 dark:text-teal-100">
              {t('track.comments.helper', {
                defaultValue:
                  'Use this for updates, questions, or additional context related to your report.',
              })}
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-comment" className="text-sm font-medium text-foreground">
                {t('track.comments.label', { defaultValue: 'Comment' })}
              </Label>
              <textarea
                id="report-comment"
                value={commentDraft}
                onChange={(e) => {
                  setCommentDraft(e.target.value);
                }}
                rows={8}
                className="shadow-xs outline-hidden min-h-48 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                placeholder={t('track.comments.placeholder', {
                  defaultValue: 'Add more information or respond to the investigators...',
                })}
              />
            </div>
          </div>
        </Sheet>

        {mutError !== null && (
          <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {getApiErrorMessage(mutError)}
          </p>
        )}
      </div>
    </ReportShell>
  );
}

interface LoginViewProps {
  reference: string;
  password: string;
  setReference: (v: string) => void;
  setPassword: (v: string) => void;
  error: string | null;
  isPending: boolean;
  onSubmit: () => void;
}

function LoginView({
  reference,
  password,
  setReference,
  setPassword,
  error,
  isPending,
  onSubmit,
}: LoginViewProps): ReactElement {
  const { t, i18n } = useTranslation(['whistleblowing', 'common']);
  const activeLang = i18n.resolvedLanguage ?? i18n.language;
  const current = activeLang.split('-')[0] ?? 'en';
  const contentDir = getDirection(current);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background [direction:ltr] lg:flex-row">
      <div className="absolute end-4 top-4 z-30 sm:end-6 sm:top-5">
        <LanguageSwitcher variant="compact" align="end" />
      </div>
      <ReportTrackBrandPanel />

      <section
        className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:w-[54%] lg:px-10 xl:px-16"
        dir={contentDir}
      >
        <form
          className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-foreground shadow-raised sm:p-8 lg:p-10"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <header className="text-center">
            <PageTitle className="text-foreground">
              {t('track.login.title', { defaultValue: 'Track your report' })}
            </PageTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('track.login.cardSubtitle', {
                defaultValue: 'Enter the case reference and password exactly as provided.',
              })}
            </p>
          </header>

          <div className="mt-6">
            <Label htmlFor="report-reference" className="">
              {t('track.login.referenceLabel', { defaultValue: 'Case reference' })}
            </Label>
            <Input
              id="report-reference"
              value={reference}
              onChange={(e) => {
                setReference(e.target.value);
              }}
              placeholder={t('track.login.referencePlaceholder', {
                defaultValue: 'WB-2026-XXXXXX',
              })}
              autoComplete="off"
            />
          </div>

          <div className="mt-4">
            <Label htmlFor="report-password" className="">
              {t('track.login.passwordLabel', { defaultValue: 'Password' })}
            </Label>
            <PasswordInput
              id="report-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              autoComplete="off"
            />
          </div>

          {error !== null && (
            <p className="mt-4 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <PrimaryButton type="submit" className="mt-6 gap-2" disabled={isPending}>
            <KeyRound className="h-4 w-4" />
            {isPending
              ? t('track.login.signingIn', { defaultValue: 'Signing in...' })
              : t('track.login.submit', { defaultValue: 'View my case' })}
          </PrimaryButton>
        </form>
      </section>
    </div>
  );
}

function ReportTrackBrandPanel(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const assurances = [
    t('track.login.assurances.status', { defaultValue: 'Check investigation status securely.' }),
    t('track.login.assurances.messages', {
      defaultValue: 'Send follow-up information without exposing your identity.',
    }),
    t('track.login.assurances.attachments', {
      defaultValue: 'Attach additional evidence when the case remains open.',
    }),
  ];

  return (
    <aside className="relative isolate flex w-full flex-col justify-between overflow-hidden bg-ink px-6 py-10 text-porcelain sm:px-10 lg:w-[46%] lg:px-14 lg:py-14">
      <div aria-hidden="true" className="wash-ink animate-drift pointer-events-none absolute inset-0 -z-10" />
      <header className="relative z-10">
        <BrandLogo white className="h-12 w-auto sm:h-14" />
      </header>

      <div className="relative z-10 my-10 flex flex-1 flex-col justify-center lg:my-0">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal-soft">
            {t('track.login.eyebrow', { defaultValue: 'Confidential case access' })}
          </p>
          <h2 className="mt-5 text-3xl font-semibold leading-tight text-porcelain lg:text-4xl">
            {t('track.login.title', { defaultValue: 'Track your report' })}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-porcelain/70">
            {t('track.login.description', {
              defaultValue:
                'Use the credentials generated when you submitted the report. The case password is not recoverable, so keep it private.',
            })}
          </p>

          <ul className="mt-8 space-y-4">
            {assurances.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm font-medium text-porcelain">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-signal-soft/40 bg-white/5 text-signal-soft">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="relative z-10 text-xs text-porcelain/45">
        {t('shell.footerPrefix', {
          defaultValue:
            'Your report is encrypted and handled confidentially. You may report anonymously.',
        })}
      </footer>
    </aside>
  );
}
