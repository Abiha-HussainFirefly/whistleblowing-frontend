import type { ElementType } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  ListTree,
  MessageSquare,
  Paperclip,
  Scale,
  UserCheck,
  Users,
} from 'lucide-react';
import type { WbCaseTabKey } from './wbCaseNavigationConfig';

export const WB_CASE_TABS: {
  key: WbCaseTabKey;
  labelKey: string;
  fallback: string;
  icon: ElementType;
}[] = [
  { key: 'overview', labelKey: 'caseConsole.tabs.overview', fallback: 'Overview', icon: FileText },
  {
    key: 'synopsis',
    labelKey: 'caseConsole.tabs.synopsis',
    fallback: 'Synopsis',
    icon: CheckCircle2,
  },
  {
    key: 'assignment',
    labelKey: 'caseConsole.tabs.assignment',
    fallback: 'Assignment',
    icon: UserCheck,
  },
  {
    key: 'classification',
    labelKey: 'caseConsole.tabs.classification',
    fallback: 'Classification',
    icon: ClipboardList,
  },
  {
    key: 'investigation',
    labelKey: 'caseConsole.tabs.investigation',
    fallback: 'Investigation',
    icon: Scale,
  },
  {
    key: 'participants',
    labelKey: 'caseConsole.tabs.participants',
    fallback: 'Participants',
    icon: Users,
  },
  {
    key: 'communication',
    labelKey: 'caseConsole.tabs.communication',
    fallback: 'Communication',
    icon: MessageSquare,
  },
  {
    key: 'evidence',
    labelKey: 'caseConsole.tabs.evidence',
    fallback: 'Evidence',
    icon: Paperclip,
  },
  {
    key: 'related',
    labelKey: 'caseConsole.tabs.related',
    fallback: 'Related cases',
    icon: ListTree,
  },
];
