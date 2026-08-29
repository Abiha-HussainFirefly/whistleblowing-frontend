import { BrandLogo, TrustLockup } from '@components/common/BrandLogo';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { PageTitle } from '@components/ui/page-title';
import { cn } from '@lib/utils';
import { Lock } from 'lucide-react';
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

/**
 * Public reporter chrome.
 *
 * Enterprise co-branding rule (manual §14): the organization's logo sits
 * top-left and is never larger than the Tellara trust lockup on reporting
 * screens. "Protected by Tellara" stays on reporter entry and case-login
 * surfaces so the protection layer reads as independent of the employer — which
 * is the whole point of an external speak-up channel.
 */
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
    orgName ?? t('shell.defaultOrgName', { defaultValue: 'Confidential reporting' });
  const hasOrgLogo = logoUrl !== undefined && logoUrl !== null && logoUrl.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-porcelain">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            {hasOrgLogo ? (
              <>
                <img
                  src={logoUrl}
                  alt={orgName ?? t('shell.organizationLogoAlt', { defaultValue: 'Organization' })}
                  className="h-8 w-auto max-w-[9rem] object-contain"
                />
                <span className="h-8 w-px bg-border" aria-hidden="true" />
                <BrandLogo className="h-7 w-auto" alt="Tellara" />
              </>
            ) : (
              <BrandLogo className="h-9 w-auto" alt="Tellara" />
            )}
            <div className="hidden min-w-0 border-s border-border ps-3 sm:block">
              <p className="truncate text-sm font-semibold text-foreground">{portalName}</p>
              <p className="text-xs text-muted-foreground">
                {t('shell.subtitle', { defaultValue: 'Protected reporting channel' })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <LanguageSwitcher variant="compact" align="end" />
            {action}
          </div>
        </div>
      </header>

      <main
        className={cn(
          'mx-auto w-full max-w-[90rem] flex-1 px-4 py-8 sm:px-6 lg:px-10',
          mainClassName,
        )}
      >
        {showPageTitle && (
          <div className="mb-7">
            <PageTitle className="text-foreground">{title}</PageTitle>
            {subtitle !== undefined && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </main>

      {bottomBanner}

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-10">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('shell.footerAssurance', {
              defaultValue:
                'This channel is encrypted and access-controlled. You are not required to provide your identity.',
            })}
          </p>
          <TrustLockup />
        </div>
      </footer>
    </div>
  );
}
