import type { TFunction } from 'i18next';
import {
  WB_AWARENESS_LABEL,
  WB_CASE_TYPE_LABEL,
  WB_CATEGORY_LABEL,
  WB_DURATION_LABEL,
  WB_INTAKE_METHOD_LABEL,
  WB_PARTICIPANT_ROLE_LABEL,
  WB_PREVIOUSLY_REPORTED_LABEL,
  WB_PRIORITY_LABEL,
  WB_RELATIONSHIP_LABEL,
  WB_STATUS_LABEL,
} from './format';
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

/**
 * Localized labels for the whistleblowing intake enums. Each looks up a key in
 * the `whistleblowing` namespace and falls back to the English label map from
 * `./format`, so an unseeded locale still renders a sensible value rather than a
 * raw enum key. Pass any `t` — the namespace is specified explicitly.
 */

export function wbCategoryLabelT(c: WhistleblowingCategory, t: TFunction): string {
  // eslint-disable-next-line security/detect-object-injection -- c is a typed enum union
  return t(`category.${c}`, { ns: 'whistleblowing', defaultValue: WB_CATEGORY_LABEL[c] });
}

export function wbRelationshipLabelT(r: WbRelationship, t: TFunction): string {
  // eslint-disable-next-line security/detect-object-injection -- r is a typed enum union
  return t(`relationship.${r}`, { ns: 'whistleblowing', defaultValue: WB_RELATIONSHIP_LABEL[r] });
}

export function wbDurationLabelT(d: WbConductDuration, t: TFunction): string {
  // eslint-disable-next-line security/detect-object-injection -- d is a typed enum union
  return t(`duration.${d}`, { ns: 'whistleblowing', defaultValue: WB_DURATION_LABEL[d] });
}

export function wbAwarenessLabelT(a: WbAwarenessSource, t: TFunction): string {
  // eslint-disable-next-line security/detect-object-injection -- a is a typed enum union
  return t(`awareness.${a}`, { ns: 'whistleblowing', defaultValue: WB_AWARENESS_LABEL[a] });
}

export function wbPreviouslyReportedLabelT(p: WbPreviouslyReported, t: TFunction): string {
  return t(`previouslyReported.${p}`, {
    ns: 'whistleblowing',
    // eslint-disable-next-line security/detect-object-injection -- p is a typed enum union
    defaultValue: WB_PREVIOUSLY_REPORTED_LABEL[p],
  });
}

export function wbStatusLabelT(s: WhistleblowingStatus, t: TFunction): string {
  // eslint-disable-next-line security/detect-object-injection -- s is a typed enum union
  return t(`status.${s}`, { ns: 'whistleblowing', defaultValue: WB_STATUS_LABEL[s] });
}

export function wbPriorityLabelT(p: InvestigationPriority, t: TFunction): string {
  // eslint-disable-next-line security/detect-object-injection -- p is a typed enum union
  return t(`priority.${p}`, { ns: 'whistleblowing', defaultValue: WB_PRIORITY_LABEL[p] });
}

export function wbCaseTypeLabelT(c: WbCaseType, t: TFunction): string {
  // eslint-disable-next-line security/detect-object-injection -- c is a typed enum union
  return t(`caseType.${c}`, { ns: 'whistleblowing', defaultValue: WB_CASE_TYPE_LABEL[c] });
}

export function wbIntakeMethodLabelT(i: WbIntakeMethod, t: TFunction): string {
  return t(`intakeMethod.${i}`, {
    ns: 'whistleblowing',
    // eslint-disable-next-line security/detect-object-injection -- i is a typed enum union
    defaultValue: WB_INTAKE_METHOD_LABEL[i],
  });
}

export function wbParticipantRoleLabelT(r: WbParticipantRole, t: TFunction): string {
  return t(`participantRole.${r}`, {
    ns: 'whistleblowing',
    // eslint-disable-next-line security/detect-object-injection -- r is a typed enum union
    defaultValue: WB_PARTICIPANT_ROLE_LABEL[r],
  });
}
