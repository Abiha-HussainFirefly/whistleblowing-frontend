/**
 * Whistleblowing permission strings — must match the backend seed catalog
 * (`prisma/seed.ts`) and the `@RequirePermissions` decorators. The module gate
 * is in `config/modules.ts`; these granular checks toggle in-page actions.
 *
 *   read        — view cases, dashboard, export.
 *   investigate — triage, set priority, resolve, comment, attach evidence.
 *   admin       — assign/escalate/close/manual-create/link + see CoI-excluded.
 */
export const WB_PERMISSIONS = {
  read: 'whistleblowing_case:read',
  investigate: 'whistleblowing_case:investigate',
  admin: 'whistleblowing_case:admin',
  independent_review: 'whistleblowing_case:independent_review',
} as const;
