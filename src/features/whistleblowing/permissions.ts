/**
 * Whistleblowing permission strings — must match the backend seed catalog
 * (`prisma/seed.ts`) and the `@RequirePermissions` decorators. The module gate
 * is in `config/modules.ts`; these granular checks toggle in-page actions.
 *
 *   read        — view cases, dashboard, export.
 *   create      — create a manual case from the Cases tab.
 *   investigate — triage, set priority, resolve, comment, attach evidence.
 *   admin       — assign/escalate/close/link + see CoI-excluded.
 *   reveal_identity — see who filed a named report. Deliberately separate from
 *                     `read`: most investigative work does not need it, and the
 *                     backend audits every disclosure.
 */
export const WB_PERMISSIONS = {
  read: 'whistleblowing_case:read',
  create: 'whistleblowing_case:create',
  investigate: 'whistleblowing_case:investigate',
  admin: 'whistleblowing_case:admin',
  independent_review: 'whistleblowing_case:independent_review',
  reveal_identity: 'whistleblowing_case:reveal_identity',
} as const;
