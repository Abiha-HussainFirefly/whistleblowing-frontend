import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { PageTitle } from '@components/ui/page-title';
import { cn } from '@lib/utils';
import { ShieldCheck } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type ReportShellProps = {
  subtitle?: string;
  orgName?: string;
  logoUrl?: string | null;
  action?: ReactNode;
  bottomBanner?: ReactNode;
  showPageTitle?: boolean;
  showTrackLink?: boolean;
  mainClassName?: string;
  children: ReactNode;
} & ({ showPageTitle?: true; title: string } | { showPageTitle: false; title?: string });

export function ReportShell({
  title,
  subtitle,
  orgName,
  logoUrl,
  action,
  bottomBanner,
  showPageTitle = true,
  mainClassName,
  children,
}: ReportShellProps): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const portalName =
    orgName ?? t('shell.defaultOrgName', { defaultValue: 'Whistleblowing Portal' });

  return (

    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            {logoUrl !== undefined && logoUrl !== null && logoUrl.length > 0 ? (
              <img
                src={logoUrl}
                alt={orgName ?? t('shell.organizationLogoAlt', { defaultValue: 'Organization' })}
                className="h-9 w-auto"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">{portalName}</p>
              <p className="text-xs text-slate-400">
                {t('shell.subtitle', { defaultValue: 'Confidential reporting' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
           
            <LanguageSwitcher
              variant="compact"
              align="end"
              className="shrink-0 [&>button]:rounded-full [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:shadow-none [&>div]:rounded-full [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-0 [&>div]:shadow-none [&_img]:rounded-full [&_svg]:rounded-full"
            />
            {action}
          </div>
        </div>
      </header>

      <main className={cn('w-full flex-1 px-4 py-8 sm:px-6 lg:px-10', mainClassName)}>
        {showPageTitle && (
          <div className="mb-6">
            <PageTitle className="text-slate-900">{title}</PageTitle>
            {subtitle !== undefined && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      {bottomBanner}
    </div>
  );
}
