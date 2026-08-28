// Domain types for the Whistleblowing & Incident Management module. Union
// string types mirror the backend Prisma enums + serializer view shapes.

export type WhistleblowingStatus =
  | 'SUBMITTED'
  | 'UNDER_TRIAGE'
  | 'UNDER_INVESTIGATION'
  | 'WB_ESCALATED'
  | 'RESOLVED'
  | 'WB_CLOSED'
  | 'WB_DISMISSED';

export type WhistleblowingCategory =
  | 'FRAUD'
  | 'BRIBERY_CORRUPTION'
  | 'HARASSMENT'
  | 'CONFLICT_OF_INTEREST'
  | 'DATA_PRIVACY'
  | 'HEALTH_SAFETY'
  | 'DISCRIMINATION'
  | 'RETALIATION'
  | 'OTHER_MISCONDUCT'
  | 'ACCOUNTING_AUDITING'
  | 'COMPENSATION_BENEFITS'
  | 'SGBP_COMPLIANCE'
  | 'CONFIDENTIAL_INFORMATION'
  | 'DISCLOSURE_COMMUNICATIONS'
  | 'DIVERSITY_EQUITY_INCLUSION'
  | 'DUE_DILIGENCE'
  | 'ENVIRONMENTAL'
  | 'FAIR_COMPETITION'
  | 'GLOBAL_TRADE'
  | 'HUMAN_RIGHTS'
  | 'IMMINENT_THREAT'
  | 'INSIDER_TRADING'
  | 'INTELLECTUAL_PROPERTY'
  | 'ASSET_MISUSE'
  | 'POLITICAL_ACTIVITY'
  | 'PRODUCT_QUALITY_SAFETY'
  | 'SUBSTANCE_ABUSE'
  | 'IT_ELECTRONIC_COMMS'
  | 'WORKPLACE_CIVILITY'
  | 'OTHER_BUSINESS_INTEGRITY'
  | 'OTHER_HUMAN_RESOURCES'
  | 'INQUIRY';

export type InvestigationPriority =
  | 'PRIORITY_LOW'
  | 'PRIORITY_MEDIUM'
  | 'PRIORITY_HIGH'
  | 'PRIORITY_CRITICAL';

export type WbCaseType = 'ALLEGATION' | 'INQUIRY';

export type WbIntakeMethod = 'WEB' | 'EMAIL' | 'PHONE' | 'IN_PERSON' | 'MAIL' | 'OTHER_INTAKE';

export type WbRelationship =
  | 'EMPLOYEE'
  | 'FORMER_EMPLOYEE'
  | 'CONTRACTOR'
  | 'VENDOR_SUPPLIER'
  | 'CUSTOMER'
  | 'BUSINESS_PARTNER'
  | 'OTHER_RELATIONSHIP';

export type WbConductDuration =
  | 'ONE_TIME'
  | 'LESS_THAN_MONTH'
  | 'ONE_TO_THREE_MONTHS'
  | 'THREE_TO_SIX_MONTHS'
  | 'SIX_TO_TWELVE_MONTHS'
  | 'OVER_A_YEAR'
  | 'ONGOING'
  | 'UNKNOWN_DURATION';

export type WbAwarenessSource =
  | 'WITNESSED'
  | 'TOLD_BY_SOMEONE'
  | 'REVIEWED_DOCUMENTS'
  | 'RUMOR'
  | 'INVOLVED'
  | 'OTHER_SOURCE';

export type WbPreviouslyReported = 'YES' | 'NO' | 'UNKNOWN';

export type WbParticipantRole = 'REPORTER' | 'SUBJECT' | 'WITNESS' | 'OTHER_PARTICIPANT';

export interface InvolvedPerson {
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
}

export interface WbParticipant {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  jobTitle: string | null;
  relationship: string | null;
  role: WbParticipantRole;
  results: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRef {
  id: string;
  displayName: string | null;
  email: string;
}

export interface WbMessage {
  id: string;
  content: string;
  isFromReporter: boolean;
  isInternal: boolean;
  author: UserRef | null;
  createdAt: string;
}

export interface WbAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: string;
  label: string | null;
  isFromReporter: boolean;
  addedAt: string;
}

export interface WbCaseRef {
  id: string;
  caseReferenceNumber: string;
  category: WhistleblowingCategory;
  status: WhistleblowingStatus;
}

export interface WbCaseListItem {
  id: string;
  caseReferenceNumber: string;
  category: WhistleblowingCategory;
  caseType: WbCaseType;
  intakeMethod: WbIntakeMethod;
  priority: InvestigationPriority;
  status: WhistleblowingStatus;
  regionCode: string | null;
  isAnonymous: boolean;
  reporterAlias: string;
  incidentDate: string | null;
  incidentLocation: string | null;
  assignedInvestigator: UserRef | null;
  slaDeadline: string | null;
  slaBreachedAt: string | null;
  closedAt: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  attachmentCount: number;
  hiddenFromCount: number;
}

export interface WbCaseDetail extends WbCaseListItem {
  incidentDescription: string;
  personsInvolved: string | null;
  reporterEmail: string | null;
  // Enriched intake
  relationshipToOrg: WbRelationship | null;
  locationCity: string | null;
  locationState: string | null;
  locationPostalCode: string | null;
  locationCountry: string | null;
  involvedPersons: InvolvedPerson[];
  previouslyReported: WbPreviouslyReported | null;
  whenLastOccurred: string | null;
  conductDuration: WbConductDuration | null;
  awarenessSource: WbAwarenessSource | null;
  reporterPhone: string | null;
  reporterPreferredContact: string | null;
  termsAcceptedAt: string | null;
  // Investigation record
  preliminaryAssessment: string | null;
  investigationFindings: string | null;
  disciplinaryRecommendation: string | null;
  // Synopsis / outcome
  primaryOutcome: string | null;
  secondaryOutcome: string | null;
  actionTaken: string | null;
  potentialNextSteps: string | null;
  synopsisNotes: string | null;
  closureOutcome: string | null;
  closedAt: string | null;
  triagedAt: string | null;
  assignedAt: string | null;
  hiddenFromUsers: UserRef[];
  participants: WbParticipant[];
  messages: WbMessage[];
  attachments: WbAttachment[];
  relatedCases: WbCaseRef[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface WbStats {
  total: number;
  open: number;
  underInvestigation: number;
  escalated: number;
  closed: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  anonymousCount: number;
  namedCount: number;
  slaBreached: number;
  slaAtRisk: number;
  avgResolutionDays: number | null;
  submissionsByMonth: { month: string; count: number }[];
}

export interface WbCaseListParams {
  search?: string;
  status?: WhistleblowingStatus;
  category?: WhistleblowingCategory;
  priority?: InvestigationPriority;
  dateFrom?: string;
  dateTo?: string;
  assignedToMe?: boolean;
  page?: number;
  pageSize?: number;
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface TriageInput {
  priority: InvestigationPriority;
  preliminaryAssessment?: string;
}
export interface AssignInput {
  investigatorId: string;
}
export interface SetPriorityInput {
  priority: InvestigationPriority;
}
export interface EscalateInput {
  reason: string;
}
export interface ResolveInput {
  investigationFindings: string;
  disciplinaryRecommendation?: string;
}
export interface CloseInput {
  closureOutcome: string;
  dismiss?: boolean;
}
export interface LinkInput {
  relatedCaseId: string;
}
export interface CommentInput {
  content: string;
  isInternal?: boolean;
}
export interface ManualCreateInput {
  category: WhistleblowingCategory;
  priority?: InvestigationPriority;
  caseType?: WbCaseType;
  intakeMethod?: WbIntakeMethod;
  incidentDescription: string;
  incidentDate?: string;
  incidentLocation?: string;
  personsInvolved?: string;
  regionCode?: string;
  relationshipToOrg?: WbRelationship;
  locationCity?: string;
  locationState?: string;
  locationPostalCode?: string;
  locationCountry?: string;
  involvedPersons?: InvolvedPerson[];
  previouslyReported?: WbPreviouslyReported;
  whenLastOccurred?: string;
  conductDuration?: WbConductDuration;
  awarenessSource?: WbAwarenessSource;
  intakeChannel?: string;
  isAnonymous?: boolean;
  reporterEmail?: string;
  reporterPhone?: string;
}

export interface UpdateCaseDetailsInput {
  caseType?: WbCaseType;
  intakeMethod?: WbIntakeMethod;
  relationshipToOrg?: WbRelationship;
  incidentLocation?: string;
  locationCity?: string;
  locationState?: string;
  locationPostalCode?: string;
  locationCountry?: string;
  previouslyReported?: WbPreviouslyReported;
  whenLastOccurred?: string;
  conductDuration?: WbConductDuration;
  awarenessSource?: WbAwarenessSource;
}

export interface UpdateSynopsisInput {
  primaryOutcome?: string;
  secondaryOutcome?: string;
  actionTaken?: string;
  potentialNextSteps?: string;
  synopsisNotes?: string;
}

export interface ParticipantInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  relationship?: string;
  role: WbParticipantRole;
  results?: string;
}

// ── Reporter portal (public) ─────────────────────────────────────────────────

export interface PortalOrgInfo {
  organizationName: string;
  organizationSlug: string;
  logoUrl: string | null;
  brandColor: string | null;
  categories: WhistleblowingCategory[];
  regions: { regionCode: string; displayName: string }[];
  complianceTeam: { id: string; displayName: string; isAdmin: boolean; canExclude: boolean }[];
}

export interface ReporterSubmitResult {
  caseReferenceNumber: string;
  password: string;
  alias: string;
  token: string;
  expiresIn: number;
}

export interface ReporterSession {
  token: string;
  expiresIn: number;
}

export interface ReporterMessage {
  id: string;
  content: string;
  fromReporter: boolean;
  authorLabel: 'You' | 'Investigation Team';
  createdAt: string;
}

export interface ReporterAttachment {
  id: string;
  fileName: string;
  isFromReporter: boolean;
  addedAt: string;
}

export interface ReporterCommentPage {
  data: ReporterMessage[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ReporterCaseView {
  caseReferenceNumber: string;
  category: WhistleblowingCategory;
  caseType: WbCaseType;
  status: WhistleblowingStatus;
  incidentDescription: string;
  incidentDate: string | null;
  incidentLocation: string | null;
  personsInvolved: string | null;
  involvedPersons: InvolvedPerson[];
  relationshipToOrg: WbRelationship | null;
  locationCity: string | null;
  locationCountry: string | null;
  previouslyReported: WbPreviouslyReported | null;
  whenLastOccurred: string | null;
  conductDuration: WbConductDuration | null;
  awarenessSource: WbAwarenessSource | null;
  isAnonymous: boolean;
  submittedAt: string;
  updatedAt: string;
  closedAt: string | null;
  closureOutcome: string | null;
  messages: ReporterMessage[];
  attachments: ReporterAttachment[];
}

export interface SubmitReportInput {
  organizationSlug: string;
  category: WhistleblowingCategory;
  incidentDescription: string;
  incidentDate?: string;
  incidentLocation?: string;
  personsInvolved?: string;
  regionCode?: string;
  relationshipToOrg?: WbRelationship;
  locationCity?: string;
  locationState?: string;
  locationPostalCode?: string;
  locationCountry?: string;
  involvedPersons?: InvolvedPerson[];
  previouslyReported?: WbPreviouslyReported;
  whenLastOccurred?: string;
  conductDuration?: WbConductDuration;
  awarenessSource?: WbAwarenessSource;
  isAnonymous?: boolean;
  reporterEmail?: string;
  reporterPhone?: string;
  reporterPreferredContact?: string;
  acceptedTerms: boolean;
  conflictOfInterestDeclared?: boolean;
  hiddenFromUserPublicIds?: string[];
}
