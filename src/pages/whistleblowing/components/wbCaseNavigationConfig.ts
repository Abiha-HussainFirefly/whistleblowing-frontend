import type { WhistleblowingStatus } from '@features/whistleblowing/types';

export const WB_CASE_MAIN_NAV = [
  {
    key: 'overview',
    labelKey: 'caseConsole.groups.overview',
    fallback: 'Overview',
    tabKeys: ['overview', 'synopsis'],
  },
  {
    key: 'investigation',
    labelKey: 'caseConsole.groups.investigation',
    fallback: 'Investigation',
    tabKeys: ['assignment', 'classification', 'investigation'],
  },
  {
    key: 'people',
    labelKey: 'caseConsole.groups.people',
    fallback: 'People & communication',
    tabKeys: ['participants', 'communication'],
  },
  {
    key: 'evidence',
    labelKey: 'caseConsole.groups.evidence',
    fallback: 'Evidence & related',
    tabKeys: ['evidence', 'related'],
  },
] as const;

export type WbCaseTabKey = (typeof WB_CASE_MAIN_NAV)[number]['tabKeys'][number];
export type WbCaseMainNav = (typeof WB_CASE_MAIN_NAV)[number];

export function mainNavFor(tabKey: WbCaseTabKey): WbCaseMainNav {
  return (
    WB_CASE_MAIN_NAV.find((item) => item.tabKeys.some((key) => key === tabKey)) ??
    WB_CASE_MAIN_NAV[0]
  );
}

export function caseStageFor(status: WhistleblowingStatus): number {
  if (status === 'SUBMITTED') {
    return 0;
  }
  if (status === 'UNDER_TRIAGE') {
    return 1;
  }
  if (status === 'UNDER_INVESTIGATION' || status === 'WB_ESCALATED') {
    return 2;
  }
  return 3;
}
