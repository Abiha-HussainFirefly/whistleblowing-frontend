import { type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { Loader } from '@components/common/Loader';
import { getApiErrorMessage } from '@lib/api-error';
import { ROUTES } from '@config/routes';
import { useWbOversightCase } from '@features/org-admin/hooks/whistleblowing-oversight';
import { WbCaseConsole } from '@pages/whistleblowing/components/WbCaseConsole';

/**
 * Organization case detail.
 *
 * The register and analytics remain oversight-only. This detail route uses the
 * shared permission-aware workflow console so authorized compliance users can
 * independently review and close a resolved case. The oversight GET endpoint
 * still enforces organization, region, and conflict-of-interest visibility.
 */
export function OrgAdminWhistleblowingCasePage(): ReactElement {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { data: caseData, isLoading, isError, error } = useWbOversightCase(caseId);

  if (isLoading) {
    return <Loader fullscreen label="Loading case…" />;
  }

  if (isError || caseData === undefined) {
    return (
      <div className="space-y-4">
        <Link
          to={ROUTES.ORG_ADMIN.WHISTLEBLOWING}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to oversight
        </Link>
        <div className="rounded-lg border border-border bg-white p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {getApiErrorMessage(
              error,
              'This case is unavailable — it may have been hidden from your profile by the reporter (conflict of interest).',
            )}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={ROUTES.ORG_ADMIN.WHISTLEBLOWING}>Back to oversight</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <WbCaseConsole
      caseData={caseData}
      caseId={caseId}
      backTo={ROUTES.ORG_ADMIN.WHISTLEBLOWING}
      backLabel="Back to oversight"
      detailRoute={ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL}
    />
  );
}
