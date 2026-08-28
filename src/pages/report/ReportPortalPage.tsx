import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@components/ui/button';
import { Loader } from '@components/common/Loader';
import { getApiErrorMessage } from '@lib/api-error';
import { ROUTES } from '@config/routes';
import { reporterService } from '@features/whistleblowing/api/reporter.service';
import { saveReporterToken } from '@features/whistleblowing/reporterSession';
import { ReportIntakeForm } from '@features/whistleblowing/components/ReportIntakeForm';
import { ReportCredentials } from '@features/whistleblowing/components/ReportCredentials';
import type { ReporterSubmitResult } from '@features/whistleblowing/types';
import { ReportShell } from './ReportShell';

export function ReportPortalPage(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const { slug = '' } = useParams<{ slug: string }>();
  const [result, setResult] = useState<ReporterSubmitResult | null>(null);

  const info = useQuery({
    queryKey: ['report-portal', slug],
    queryFn: () => reporterService.portalInfo(slug),
    enabled: slug.length > 0,
    retry: false,
  });

  if (info.isLoading) {
    return (
      <ReportShell title={t('shell.defaultOrgName', { defaultValue: 'Whistleblowing Portal' })}>
        <Loader label={t('page.loading', { defaultValue: 'Loading...' })} />
      </ReportShell>
    );
  }
  if (info.isError || info.data === undefined) {
    return (
      <ReportShell title={t('page.portalUnavailable', { defaultValue: 'Portal unavailable' })}>
        <p className="text-sm text-slate-500">
          {getApiErrorMessage(
            info.error,
            t('page.portalNotFound', {
              defaultValue: 'This reporting portal could not be found.',
            }),
          )}
        </p>
      </ReportShell>
    );
  }

  const org = info.data;

  if (result !== null) {
    return (
      <ReportShell
        title={t('page.reportSubmitted', { defaultValue: 'Report submitted' })}
        orgName={org.organizationName}
        logoUrl={org.logoUrl}
      >
        <ReportCredentials
          result={result}
          onTrack={() => {
            // Pre-seed the session token, then open tracking in a NEW TAB — the
            // new tab inherits a copy of sessionStorage (auto-login) while this
            // tab keeps the one-time credentials on screen.
            saveReporterToken(result.token);
            window.open(ROUTES.REPORT.TRACK, '_blank');
          }}
        />
      </ReportShell>
    );
  }

  return (
    <ReportShell
      title={t('page.title', { defaultValue: 'Report a concern' })}
      subtitle={t('page.portalSubtitle', {
        organization: org.organizationName,
        defaultValue: 'Submit a confidential report to {{organization}}. You may remain anonymous.',
      })}
      orgName={org.organizationName}
      logoUrl={org.logoUrl}
      action={
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.REPORT.TRACK}>
            {t('shell.trackReport', { defaultValue: 'Track a report' })}
          </Link>
        </Button>
      }
    >
      <ReportIntakeForm organizationSlug={slug} orgInfo={org} onSubmitted={setResult} />
    </ReportShell>
  );
}
