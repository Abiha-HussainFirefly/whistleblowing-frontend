import { type ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { Loader } from '@components/common/Loader';
import { getApiErrorMessage } from '@lib/api-error';
import { ROUTES } from '@config/routes';
import { useWbCase } from '@features/whistleblowing/hooks';
import { WbHeader } from './components/WbHeader';
import { WbCaseConsole } from './components/WbCaseConsole';

export function WbCaseDetailPage(): ReactElement {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { data: c, isLoading, isError, error } = useWbCase(caseId);

  if (isLoading) {
    return <Loader fullscreen label="Loading case…" />;
  }

  if (isError || c === undefined) {
    return (
      <div className="space-y-4">
        <WbHeader hideNav />
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-500">
            {getApiErrorMessage(error, 'This case could not be loaded.')}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={ROUTES.WHISTLEBLOWING_REGISTER}>Back to register</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WbHeader hideNav />
      <WbCaseConsole
        caseData={c}
        caseId={caseId}
        backTo={ROUTES.WHISTLEBLOWING_REGISTER}
        backLabel="Back to register"
        detailRoute={ROUTES.WHISTLEBLOWING_DETAIL}
      />
    </div>
  );
}
