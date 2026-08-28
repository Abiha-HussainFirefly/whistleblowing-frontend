import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareWarning, HelpCircle } from 'lucide-react';
import { Button } from '@components/ui/button';
import { PageTitle } from '@components/ui/page-title';
import { Loader } from '@components/common/Loader';
import { getApiErrorMessage } from '@lib/api-error';
import { ROUTES } from '@config/routes';
import { toast } from '@store/toastStore';
import { useAuthStore } from '@store/authStore';
import { reporterService } from '@features/whistleblowing/api/reporter.service';
import { saveReporterToken } from '@features/whistleblowing/reporterSession';
import { ReportIntakeForm } from '@features/whistleblowing/components/ReportIntakeForm';
import { ReportCredentials } from '@features/whistleblowing/components/ReportCredentials';
import { ShareReportingLink } from '@features/whistleblowing/components/ShareReportingLink';
import type { ReporterSubmitResult } from '@features/whistleblowing/types';

export function WbReportConcernPage(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const slug = useAuthStore(
    (s) => s.activeOrganization?.slug ?? s.availableOrganizations[0]?.slug ?? null,
  );
  const [result, setResult] = useState<ReporterSubmitResult | null>(null);
  const [tourTriggerTime, setTourTriggerTime] = useState<number>(0);

  const info = useQuery({
    queryKey: ['report-portal', slug],
    queryFn: () => reporterService.portalInfo(slug ?? ''),
    enabled: slug !== null && slug.length > 0,
    retry: false,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-2 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-white">
            <MessageSquareWarning className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <PageTitle className="text-slate-900 dark:text-slate-100">
              {t('page.title', { defaultValue: 'Report a concern' })}
            </PageTitle>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {t('page.subtitle', {
                defaultValue:
                  'Confidentially report suspected misconduct. You may remain anonymous.',
              })}
            </p>
          </div>
        </div>

        {/* Header-Level Tour Button */}
        <div className="shrink-0 sm:self-center">
          <Button
            variant="default"
            onClick={() => {
              setTourTriggerTime(Date.now());
            }}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#007d89] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#007d89]/90"
          >
            <HelpCircle className="h-4 w-4 text-white/90" />
            {t('form.takeTour', { defaultValue: 'Take a tour' })}
          </Button>
        </div>
      </div>

      {slug === null ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
          {t('page.noContext', { defaultValue: 'No active organization context.' })}
        </div>
      ) : info.isLoading ? (
        <div className="py-12">
          <Loader
            label={t('page.loadingSecure', {
              defaultValue: 'Loading secure intake portal...',
            })}
          />
        </div>
      ) : info.isError || info.data === undefined ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900 shadow-sm dark:border-amber-950/40 dark:bg-amber-950/20 dark:text-amber-400">
          {getApiErrorMessage(
            info.error,
            t('page.notEnabled', {
              defaultValue: 'Whistleblowing reporting is not enabled for your organization.',
            }),
          )}
        </div>
      ) : result !== null ? (
        <ReportCredentials
          result={result}
          onTrack={() => {
            saveReporterToken(result.token);
            window.open(ROUTES.REPORT.TRACK, '_blank');
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <ReportIntakeForm
            organizationSlug={slug}
            orgInfo={info.data}
            onSubmitted={(submitted) => {
              setResult(submitted);
              toast.success(
                t('page.reportSubmittedToast', {
                  defaultValue: 'Report submitted successfully. Save the credentials now.',
                }),
              );
            }}
            tourTriggerTime={tourTriggerTime}
          />
          <aside className="lg:sticky lg:top-4">
            <ShareReportingLink />
          </aside>
        </div>
      )}
    </div>
  );
}
