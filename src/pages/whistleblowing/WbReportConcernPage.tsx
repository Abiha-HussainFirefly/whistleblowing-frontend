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
import { ReporterAssuranceRail } from '@features/whistleblowing/components/ReporterAssuranceRail';
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
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-tint text-signal-strong">
            <MessageSquareWarning className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <PageTitle className="text-foreground">
              {t('page.title', { defaultValue: 'Raise a concern' })}
            </PageTitle>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t('page.subtitle', {
                defaultValue:
                  'Raise a concern about suspected misconduct. You are not required to provide your identity.',
              })}
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTourTriggerTime(Date.now());
            }}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            {t('form.takeTour', { defaultValue: 'How it works' })}
          </Button>
        </div>
      </div>

      {slug === null ? (
        <div className="rounded-xl border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
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
        <div className="rounded-xl border border-courage/35 bg-courage-tint p-5 text-sm text-foreground">
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
          {...(info.data === undefined
            ? {}
            : { organizationName: info.data.organizationName })}
          onTrack={() => {
            saveReporterToken(result.token);
            window.open(ROUTES.REPORT.TRACK, '_blank');
          }}
        />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
            <aside className="space-y-4 lg:sticky lg:top-4">
              <ReporterAssuranceRail
                onHowItWorks={() => {
                  setTourTriggerTime(Date.now());
                }}
              />
            </aside>
            <ReportIntakeForm
              organizationSlug={slug}
              orgInfo={info.data}
              onSubmitted={(submitted) => {
                setResult(submitted);
                toast.success(
                  t('page.reportSubmittedToast', {
                    defaultValue: 'Report submitted. Save your case credentials now.',
                  }),
                );
              }}
              tourTriggerTime={tourTriggerTime}
            />
          </div>
          <ShareReportingLink />
        </>
      )}
    </div>
  );
}
