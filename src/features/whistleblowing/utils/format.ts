import type {
  InvestigationPriority,
  WbAwarenessSource,
  WbCaseType,
  WbConductDuration,
  WbIntakeMethod,
  WbParticipantRole,
  WbPreviouslyReported,
  WbRelationship,
  WhistleblowingCategory,
  WhistleblowingStatus,
} from '../types';
import type { StateTone } from '@components/ui/status-pill';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Workflow status -> state tone (brand manual §12).
 *
 * These are WORKFLOW positions, not judgements. `WB_ESCALATED` is the only
 * entry that maps to the operational `priority` tone, because escalation is a
 * genuine time-sensitivity signal rather than a finding about the case.
 * `WB_DISMISSED` and `WB_CLOSED` both read as "closed after assessment" — the
 * UI never renders a case as "rejected".
 */
const WB_STATUS_TONE: Record<WhistleblowingStatus, StateTone> = {
  SUBMITTED: 'submitted',
  UNDER_TRIAGE: 'review',
  UNDER_INVESTIGATION: 'investigation',
  WB_ESCALATED: 'priority',
  RESOLVED: 'resolved',
  WB_CLOSED: 'closed',
  WB_DISMISSED: 'closed',
};

/** Severity as a 1-4 step level, kept deliberately separate from status. */
const WB_PRIORITY_LEVEL: Record<InvestigationPriority, number> = {
  PRIORITY_LOW: 1,
  PRIORITY_MEDIUM: 2,
  PRIORITY_HIGH: 3,
  PRIORITY_CRITICAL: 4,
};

export function wbStatusTone(s: WhistleblowingStatus): StateTone {
  return WB_STATUS_TONE[s] ?? 'submitted';
}

export function wbPriorityLevel(p: InvestigationPriority): number {
  return WB_PRIORITY_LEVEL[p] ?? 1;
}

export interface LabeledOption<K extends string = string> {
  value: K;
  label: string;
}

/** Build a `{value,label}[]` list from an ordered key list + a label map. */
function optionsFrom<K extends string>(
  keys: readonly K[],
  labels: Record<K, string>,
): LabeledOption<K>[] {
  return keys.map((k) => ({ value: k, label: labels[k] }));
}

// ── Status ───────────────────────────────────────────────────────────────────

export const WB_STATUS_LABEL: Record<WhistleblowingStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_TRIAGE: 'Under Triage',
  UNDER_INVESTIGATION: 'Under Investigation',
  WB_ESCALATED: 'Escalated',
  RESOLVED: 'Resolved',
  WB_CLOSED: 'Closed',
  WB_DISMISSED: 'Dismissed',
};

const WB_STATUS_VARIANT: Record<WhistleblowingStatus, BadgeVariant> = {
  SUBMITTED: 'info',
  UNDER_TRIAGE: 'info',
  UNDER_INVESTIGATION: 'warning',
  WB_ESCALATED: 'danger',
  RESOLVED: 'success',
  WB_CLOSED: 'default',
  WB_DISMISSED: 'default',
};

// ── Category ─────────────────────────────────────────────────────────────────

export const WB_CATEGORY_LABEL: Record<WhistleblowingCategory, string> = {
  FRAUD: 'Fraud',
  BRIBERY_CORRUPTION: 'Bribery & Corruption',
  HARASSMENT: 'Harassment',
  CONFLICT_OF_INTEREST: 'Conflict of Interest',
  DATA_PRIVACY: 'Data Privacy & Protection',
  HEALTH_SAFETY: 'Health & Safety',
  DISCRIMINATION: 'Discrimination',
  RETALIATION: 'Retaliation',
  OTHER_MISCONDUCT: 'Other Misconduct',
  ACCOUNTING_AUDITING: 'Accounting, Auditing & Financial Reporting',
  COMPENSATION_BENEFITS: 'Compensation & Benefits',
  SGBP_COMPLIANCE: 'Compliance with Standard General Business Principles',
  CONFIDENTIAL_INFORMATION: 'Confidential & Proprietary Information',
  DISCLOSURE_COMMUNICATIONS: 'Disclosure & Business Communications',
  DIVERSITY_EQUITY_INCLUSION: 'Diversity, Equity & Inclusion',
  DUE_DILIGENCE: 'E&C Due Diligence',
  ENVIRONMENTAL: 'Environmental',
  FAIR_COMPETITION: 'Free & Fair Competition',
  GLOBAL_TRADE: 'Global Trade',
  HUMAN_RIGHTS: 'Human Rights',
  IMMINENT_THREAT: 'Imminent Threat to a Person, Animals or Property',
  INSIDER_TRADING: 'Insider Trading',
  INTELLECTUAL_PROPERTY: 'Intellectual Property',
  ASSET_MISUSE: 'Misuse or Misappropriation of Assets',
  POLITICAL_ACTIVITY: 'Political Activity',
  PRODUCT_QUALITY_SAFETY: 'Product Quality & Safety',
  SUBSTANCE_ABUSE: 'Substance Abuse',
  IT_ELECTRONIC_COMMS: 'Use of IT & Electronic Communications',
  WORKPLACE_CIVILITY: 'Workplace Civility',
  OTHER_BUSINESS_INTEGRITY: 'Other Business Integrity',
  OTHER_HUMAN_RESOURCES: 'Other Human Resources',
  INQUIRY: 'Inquiry',
};

// ── Case type / intake method / relationship / duration / awareness ──────────

export const WB_CASE_TYPE_LABEL: Record<WbCaseType, string> = {
  ALLEGATION: 'Allegation',
  INQUIRY: 'Inquiry',
};

export const WB_INTAKE_METHOD_LABEL: Record<WbIntakeMethod, string> = {
  WEB: 'Web',
  EMAIL: 'E-mail',
  PHONE: 'Phone / Hotline',
  IN_PERSON: 'In Person',
  MAIL: 'Mail',
  OTHER_INTAKE: 'Other',
};

export const WB_RELATIONSHIP_LABEL: Record<WbRelationship, string> = {
  EMPLOYEE: 'Employee',
  FORMER_EMPLOYEE: 'Former Employee',
  CONTRACTOR: 'Contractor',
  VENDOR_SUPPLIER: 'Vendor / Supplier',
  CUSTOMER: 'Customer',
  BUSINESS_PARTNER: 'Business Partner',
  OTHER_RELATIONSHIP: 'Other',
};

export const WB_DURATION_LABEL: Record<WbConductDuration, string> = {
  ONE_TIME: 'One-time occurrence',
  LESS_THAN_MONTH: 'Less than a month',
  ONE_TO_THREE_MONTHS: '1 to 3 months',
  THREE_TO_SIX_MONTHS: '3 to 6 months',
  SIX_TO_TWELVE_MONTHS: '6 to 12 months',
  OVER_A_YEAR: 'Over a year',
  ONGOING: 'Ongoing',
  UNKNOWN_DURATION: 'Unknown',
};

export const WB_AWARENESS_LABEL: Record<WbAwarenessSource, string> = {
  WITNESSED: 'Personally witnessed it',
  TOLD_BY_SOMEONE: 'Told by someone else',
  REVIEWED_DOCUMENTS: 'Reviewed documents / records',
  RUMOR: 'Heard a rumor',
  INVOLVED: 'I was involved',
  OTHER_SOURCE: 'Other',
};

export const WB_PREVIOUSLY_REPORTED_LABEL: Record<WbPreviouslyReported, string> = {
  YES: 'Yes',
  NO: 'No',
  UNKNOWN: 'Do not know / do not wish to disclose',
};

export const WB_PARTICIPANT_ROLE_LABEL: Record<WbParticipantRole, string> = {
  REPORTER: 'Reporter',
  SUBJECT: 'Subject',
  WITNESS: 'Witness',
  OTHER_PARTICIPANT: 'Other',
};

// ── Priority (risk rating) ───────────────────────────────────────────────────

export const WB_PRIORITY_LABEL: Record<InvestigationPriority, string> = {
  PRIORITY_LOW: 'Low',
  PRIORITY_MEDIUM: 'Medium',
  PRIORITY_HIGH: 'High',
  PRIORITY_CRITICAL: 'Critical',
};

const WB_PRIORITY_VARIANT: Record<InvestigationPriority, BadgeVariant> = {
  PRIORITY_LOW: 'default',
  PRIORITY_MEDIUM: 'info',
  PRIORITY_HIGH: 'warning',
  PRIORITY_CRITICAL: 'danger',
};

export const WB_STATUS_OPTIONS: WhistleblowingStatus[] = [
  'SUBMITTED',
  'UNDER_TRIAGE',
  'UNDER_INVESTIGATION',
  'WB_ESCALATED',
  'RESOLVED',
  'WB_CLOSED',
  'WB_DISMISSED',
];

export const WB_CATEGORY_OPTIONS: WhistleblowingCategory[] = [
  'ACCOUNTING_AUDITING',
  'BRIBERY_CORRUPTION',
  'COMPENSATION_BENEFITS',
  'SGBP_COMPLIANCE',
  'CONFIDENTIAL_INFORMATION',
  'CONFLICT_OF_INTEREST',
  'DATA_PRIVACY',
  'DISCLOSURE_COMMUNICATIONS',
  'DISCRIMINATION',
  'DIVERSITY_EQUITY_INCLUSION',
  'DUE_DILIGENCE',
  'ENVIRONMENTAL',
  'FRAUD',
  'FAIR_COMPETITION',
  'GLOBAL_TRADE',
  'HARASSMENT',
  'HEALTH_SAFETY',
  'HUMAN_RIGHTS',
  'IMMINENT_THREAT',
  'INSIDER_TRADING',
  'INTELLECTUAL_PROPERTY',
  'ASSET_MISUSE',
  'POLITICAL_ACTIVITY',
  'PRODUCT_QUALITY_SAFETY',
  'RETALIATION',
  'SUBSTANCE_ABUSE',
  'IT_ELECTRONIC_COMMS',
  'WORKPLACE_CIVILITY',
  'OTHER_BUSINESS_INTEGRITY',
  'OTHER_HUMAN_RESOURCES',
  'OTHER_MISCONDUCT',
  'INQUIRY',
];

export const WB_PRIORITY_OPTIONS: InvestigationPriority[] = [
  'PRIORITY_LOW',
  'PRIORITY_MEDIUM',
  'PRIORITY_HIGH',
  'PRIORITY_CRITICAL',
];

export const WB_CASE_TYPE_OPTIONS = optionsFrom(
  ['ALLEGATION', 'INQUIRY'] as const,
  WB_CASE_TYPE_LABEL,
);
export const WB_INTAKE_METHOD_OPTIONS = optionsFrom(
  ['WEB', 'EMAIL', 'PHONE', 'IN_PERSON', 'MAIL', 'OTHER_INTAKE'] as const,
  WB_INTAKE_METHOD_LABEL,
);
export const WB_RELATIONSHIP_OPTIONS = optionsFrom(
  [
    'EMPLOYEE',
    'FORMER_EMPLOYEE',
    'CONTRACTOR',
    'VENDOR_SUPPLIER',
    'CUSTOMER',
    'BUSINESS_PARTNER',
    'OTHER_RELATIONSHIP',
  ] as const,
  WB_RELATIONSHIP_LABEL,
);
export const WB_DURATION_OPTIONS = optionsFrom(
  [
    'ONE_TIME',
    'LESS_THAN_MONTH',
    'ONE_TO_THREE_MONTHS',
    'THREE_TO_SIX_MONTHS',
    'SIX_TO_TWELVE_MONTHS',
    'OVER_A_YEAR',
    'ONGOING',
    'UNKNOWN_DURATION',
  ] as const,
  WB_DURATION_LABEL,
);
export const WB_AWARENESS_OPTIONS = optionsFrom(
  [
    'WITNESSED',
    'TOLD_BY_SOMEONE',
    'REVIEWED_DOCUMENTS',
    'RUMOR',
    'INVOLVED',
    'OTHER_SOURCE',
  ] as const,
  WB_AWARENESS_LABEL,
);
export const WB_PREVIOUSLY_REPORTED_OPTIONS = optionsFrom(
  ['YES', 'NO', 'UNKNOWN'] as const,
  WB_PREVIOUSLY_REPORTED_LABEL,
);
export const WB_PARTICIPANT_ROLE_OPTIONS = optionsFrom(
  ['REPORTER', 'SUBJECT', 'WITNESS', 'OTHER_PARTICIPANT'] as const,
  WB_PARTICIPANT_ROLE_LABEL,
);

// ── Accessors (eslint-safe object indexing) ──────────────────────────────────

export function wbStatusLabel(s: WhistleblowingStatus): string {
  return WB_STATUS_LABEL[s];
}
export function wbStatusVariant(s: WhistleblowingStatus): BadgeVariant {
  return WB_STATUS_VARIANT[s];
}
export function wbCategoryLabel(c: WhistleblowingCategory): string {
  return WB_CATEGORY_LABEL[c];
}
export function wbPriorityLabel(p: InvestigationPriority): string {
  return WB_PRIORITY_LABEL[p];
}
export function wbPriorityVariant(p: InvestigationPriority): BadgeVariant {
  return WB_PRIORITY_VARIANT[p];
}

const STATUS_LABEL_MAP = new Map<string, string>(Object.entries(WB_STATUS_LABEL));
export function wbStatusLabelOf(key: string): string {
  return STATUS_LABEL_MAP.get(key) ?? key;
}
const CATEGORY_LABEL_MAP = new Map<string, string>(Object.entries(WB_CATEGORY_LABEL));
export function wbCategoryLabelOf(key: string): string {
  return CATEGORY_LABEL_MAP.get(key) ?? key;
}
const PRIORITY_LABEL_MAP = new Map<string, string>(Object.entries(WB_PRIORITY_LABEL));
export function wbPriorityLabelOf(key: string): string {
  return PRIORITY_LABEL_MAP.get(key) ?? key;
}

const CASE_TYPE_MAP = new Map<string, string>(Object.entries(WB_CASE_TYPE_LABEL));
export function wbCaseTypeLabelOf(key: string): string {
  return CASE_TYPE_MAP.get(key) ?? key;
}
const INTAKE_METHOD_MAP = new Map<string, string>(Object.entries(WB_INTAKE_METHOD_LABEL));
export function wbIntakeMethodLabelOf(key: string): string {
  return INTAKE_METHOD_MAP.get(key) ?? key;
}
const RELATIONSHIP_MAP = new Map<string, string>(Object.entries(WB_RELATIONSHIP_LABEL));
export function wbRelationshipLabelOf(key: string | null): string {
  return key === null ? '—' : (RELATIONSHIP_MAP.get(key) ?? key);
}
const DURATION_MAP = new Map<string, string>(Object.entries(WB_DURATION_LABEL));
export function wbDurationLabelOf(key: string | null): string {
  return key === null ? '—' : (DURATION_MAP.get(key) ?? key);
}
const AWARENESS_MAP = new Map<string, string>(Object.entries(WB_AWARENESS_LABEL));
export function wbAwarenessLabelOf(key: string | null): string {
  return key === null ? '—' : (AWARENESS_MAP.get(key) ?? key);
}
const PREVIOUSLY_REPORTED_MAP = new Map<string, string>(
  Object.entries(WB_PREVIOUSLY_REPORTED_LABEL),
);
export function wbPreviouslyReportedLabelOf(key: string | null): string {
  return key === null ? '—' : (PREVIOUSLY_REPORTED_MAP.get(key) ?? key);
}
const PARTICIPANT_ROLE_MAP = new Map<string, string>(Object.entries(WB_PARTICIPANT_ROLE_LABEL));
export function wbParticipantRoleLabelOf(key: string): string {
  return PARTICIPANT_ROLE_MAP.get(key) ?? key;
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function formatDate(iso: string | null): string {
  if (iso === null) {
    return '—';
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export function formatDateTime(iso: string | null): string {
  if (iso === null) {
    return '—';
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export function formatBytes(bytes: string | number): string {
  const n = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (Number.isNaN(n) || n <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units.at(i) ?? 'B'}`;
}

/** Days until (positive) / past (negative) the SLA deadline, or null. */
export function slaDaysRemaining(deadlineIso: string | null): number | null {
  if (deadlineIso === null) {
    return null;
  }
  const d = new Date(deadlineIso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}
