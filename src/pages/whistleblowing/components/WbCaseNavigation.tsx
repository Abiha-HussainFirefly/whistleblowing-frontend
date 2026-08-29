import { cn } from '@lib/utils';
import { useTranslation } from 'react-i18next';
import { FileText, Paperclip, Scale, Users } from 'lucide-react';
import type { ElementType, ReactElement } from 'react';
import type { WbCaseDetail } from '@features/whistleblowing/types';
import { WB_CASE_MAIN_NAV, type WbCaseTabKey, mainNavFor } from './wbCaseNavigationConfig';
import { WB_CASE_TABS } from './wbCaseNavigationTabs';

export type { WbCaseTabKey } from './wbCaseNavigationConfig';

export function WbCaseNavigation({
  activeTab,
  onSelect,
  caseData,
}: {
  activeTab: WbCaseTabKey;
  onSelect: (tab: WbCaseTabKey) => void;
  caseData: WbCaseDetail;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const activeMain = mainNavFor(activeTab);

  return (
    <nav
      aria-label={t('caseConsole.navigation.primary', { defaultValue: 'Case sections' })}
      className="overflow-hidden rounded-xl border border-border bg-white"
    >
      <div className="grid gap-1 p-1.5 sm:grid-cols-2 xl:grid-cols-4">
        {WB_CASE_MAIN_NAV.map((item) => {
          const Icon = mainIconFor(item.key);
          const isActive = activeMain.key === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                const firstTab = item.tabKeys[0];
                onSelect(firstTab);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-[3.75rem] items-center gap-3 rounded-lg px-4 py-3 text-left transition-all',
                isActive
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-brand-primary dark:hover:text-white',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-muted text-brand-accent',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {t(item.labelKey, { defaultValue: item.fallback })}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-[11px]',
                    isActive ? 'text-white/70' : 'text-muted-foreground/70',
                  )}
                >
                  {mainDescription(item.key, t)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-border px-3 py-2">
        <span className="mr-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
          {t('caseConsole.navigation.currentArea', { defaultValue: 'Current area' })}
        </span>
        {activeMain.tabKeys.map((tabKey) => {
          const tab = WB_CASE_TABS.find((candidate) => candidate.key === tabKey);
          if (tab === undefined) {
            return null;
          }
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = navigationCount(tab.key, caseData);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                onSelect(tab.key);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-brand-accent/10 text-brand-primary dark:text-white'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-brand-primary dark:hover:text-white',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(tab.labelKey, { defaultValue: tab.fallback })}
              {count !== null && (
                <span className="rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function mainIconFor(key: (typeof WB_CASE_MAIN_NAV)[number]['key']): ElementType {
  if (key === 'overview') {
    return FileText;
  }
  if (key === 'investigation') {
    return Scale;
  }
  if (key === 'people') {
    return Users;
  }
  return Paperclip;
}

function mainDescription(
  key: (typeof WB_CASE_MAIN_NAV)[number]['key'],
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (key === 'overview') {
    return t('caseConsole.groups.overviewDescription', { defaultValue: 'Report and synopsis' });
  }
  if (key === 'investigation') {
    return t('caseConsole.groups.investigationDescription', {
      defaultValue: 'Review and decisions',
    });
  }
  if (key === 'people') {
    return t('caseConsole.groups.peopleDescription', { defaultValue: 'People and messages' });
  }
  return t('caseConsole.groups.evidenceDescription', { defaultValue: 'Files and linked cases' });
}

function navigationCount(tab: WbCaseTabKey, c: WbCaseDetail): number | null {
  if (tab === 'participants') {
    return c.participants.length;
  }
  if (tab === 'communication') {
    return c.messages.length;
  }
  if (tab === 'evidence') {
    return c.attachments.length;
  }
  if (tab === 'related') {
    return c.relatedCases.length;
  }
  return null;
}
