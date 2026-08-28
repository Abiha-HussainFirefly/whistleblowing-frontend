import type { ElementType } from 'react';
import { Activity, FileText, Scale } from 'lucide-react';
import type { WhistleblowingStatus } from '@features/whistleblowing/types';

export type TabKey = 'overview' | 'investigation' | 'activity';

export interface WbCaseTab {
  key: TabKey;
  labelKey: string;
  fallback: string;
  icon: ElementType;
}

export const WB_CASE_TABS: WbCaseTab[] = [
  { key: 'overview', labelKey: 'caseConsole.tabs.overview', fallback: 'Overview', icon: FileText },
  {
    key: 'investigation',
    labelKey: 'caseConsole.tabs.investigation',
    fallback: 'Investigation',
    icon: Scale,
  },
  {
    key: 'activity',
    labelKey: 'caseConsole.tabs.activity',
    fallback: 'Activity & evidence',
    icon: Activity,
  },
];

const CLOSED_CASE_STATUSES: WhistleblowingStatus[] = ['WB_CLOSED', 'WB_DISMISSED'];

export function isClosedCase(status: WhistleblowingStatus): boolean {
  return CLOSED_CASE_STATUSES.includes(status);
}
