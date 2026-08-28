import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquareWarning } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@lib/utils';
import { ROUTES } from '@config/routes';
import { PageTitle } from '@components/ui/page-title';

const TABS = [
  { to: ROUTES.WHISTLEBLOWING, labelKey: 'dashboard', end: true },
  { to: ROUTES.WHISTLEBLOWING_REGISTER, labelKey: 'cases', end: false },
];

export function WbHeader({ hideNav = false }: { hideNav?: boolean }): ReactElement {
  const { t } = useTranslation('whistleblowing');

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-white">
          <MessageSquareWarning className="h-5 w-5" />
        </div>

        <div>
          <PageTitle as="h2" className="text-[#042248] dark:text-white">
            {t('header.title', { defaultValue: 'Whistleblowing & Incident Management' })}
          </PageTitle>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
            {t('header.subtitle', {
              defaultValue: 'Confidential intake, investigation workflow & board-ready analytics.',
            })}
          </p>
        </div>
      </div>

      {!hideNav && (
        <nav className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  '-mb-[2px] border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-brand-accent text-brand-accent dark:border-brand-accent dark:text-brand-accent'
                    : 'border-transparent text-slate-500 hover:text-brand-accent dark:hover:text-brand-accent',
                )
              }
            >
              {t(`header.tabs.${tab.labelKey}`, {
                defaultValue: tab.labelKey === 'dashboard' ? 'Dashboard' : 'Cases',
              })}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
