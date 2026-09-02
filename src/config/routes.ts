import type { AuthUser, PlatformRole } from '@/types/auth';

/**
 * Centralized route map.
 *
 * Auth routes live under `/auth/*` so the public surface is clearly separated
 * from the authenticated app shell. There are two distinct login entry points:
 *
 *   AUTH.LOGIN        — tenant users (ADMIN, LEGAL_MANAGER, LAWYER, PARALEGAL, VIEWER)
 *   AUTH.ADMIN_LOGIN  — SUPER_ADMIN system users only (no signup, no SSO, hidden entry)
 *
 * Each role lands on its own post-login dashboard (DASHBOARD vs ADMIN.DASHBOARD).
 */
export const ROUTES = Object.freeze({
  ROOT: '/',

  // Auth surface (public)
  AUTH: Object.freeze({
    ROOT: '/auth',
    LOGIN: '/auth/login',
    ADMIN_LOGIN: '/auth/admin/login',
    ORG_LOGIN: '/auth/org/login',
    VERIFY_EMAIL: '/auth/verify-email',
    MFA_VERIFY: '/auth/mfa/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  }),

  // Public invitation acceptance page.
  INVITATION_ACCEPT: '/invitations/accept',

  // Public external-counsel invitation acceptance (matches the backend invite URL).
  EXTERNAL_ACCEPT: '/external/accept',

  // Back-compat alias — old /login deep links keep working.
  LEGACY_LOGIN: '/login',

  // Region selection (post-login for multi-region users)
  REGION_PICKER: '/select-region',

  // Concept Help Center (User portal). The tenant portal has its own at
  // ORG_ADMIN.HELP. Both render the same HelpCenterPage.
  HELP: '/help',

  // Authenticated app (tenant users)
  DASHBOARD: '/dashboard',
  CASES: '/cases',
  CASE_DETAIL: (id: string | number = ':id') => `/cases/${String(id)}`,
  USERS: '/users',
  SETTINGS: '/settings',
  MFA_SETTINGS: '/settings/mfa',
  PROFILE: '/profile',

  // USER-portal modules — gated by permissions via the module registry
  // (see config/modules.ts and routes/RequirePermission.tsx).
  CONTRACTS: '/contracts',
  CONTRACTS_REGISTER: '/contracts/repository',
  CONTRACTS_RENEWALS: '/contracts/renewals',
  CONTRACTS_TYPES: '/contracts/types',
  CONTRACTS_MOA_RULES: '/contracts/moa-rules',
  CONTRACT_DETAIL: (id: string | number = ':contractId') => `/contracts/detail/${String(id)}`,
  LITIGATION: '/matters',
  LITIGATION_RECENT: '/matters/recent',
  LITIGATION_CASES: '/matters/cases',
  LITIGATION_CASE_DETAIL: (id: string | number = ':caseId') => `/matters/cases/${String(id)}`,
  LITIGATION_HEARINGS: '/matters/hearings',
  SECRETARIAL: '/secretarial',
  COMPLIANCE: '/compliance',
  COMPLIANCE_REGISTER: '/compliance/counterparties',
  COMPLIANCE_RENEWALS: '/compliance/renewals',
  COMPLIANCE_DETAIL: (id: string | number = ':counterpartyId') =>
    `/compliance/detail/${String(id)}`,
  LAND: '/assets',
  LAND_GRAPHS: '/assets/graphs',
  LAND_LIST: '/assets/list',
  LAND_DETAIL: (id: string | number = ':assetId') => `/assets/${String(id)}`,
  WHISTLEBLOWING: '/whistleblowing',
  WHISTLEBLOWING_REGISTER: '/whistleblowing/cases',
  WHISTLEBLOWING_DETAIL: (id: string | number = ':caseId') =>
    `/whistleblowing/detail/${String(id)}`,
  // In-app "Report a concern" — available to ALL authenticated users (ungated).
  REPORT_CONCERN: '/report-concern',
  AI_ASSISTANT: '/ai-assistant',
  EXTERNAL_ACCESS: '/external-access',
  // Cross-module Reporting & Analytics (USER portal).
  REPORTING: '/reporting',

  // Public 24/7 whistleblowing reporter portal (anonymous, tenant-scoped by slug).
  REPORT: Object.freeze({
    ROOT: '/report',
    PORTAL: (slug = ':slug') => `/report/${slug}`,
    TRACK: '/report/track',
  }),

  // External-user portal (kind = EXTERNAL_COUNSEL). A dedicated, stripped-down
  // shell that shows only the matters allocated to the signed-in external user.
  PORTAL: Object.freeze({
    ROOT: '/portal',
    CASE_DETAIL: (id: string | number = ':caseId') => `/portal/cases/${String(id)}`,
    CONTRACT_DETAIL: (id: string | number = ':contractId') => `/portal/contracts/${String(id)}`,
  }),

  // Authenticated app (Org Admin/Owner)
  ORG_ADMIN: Object.freeze({
    ROOT: '/org-admin',
    DASHBOARD: '/org-admin/dashboard',
    MEMBERS: '/org-admin/members',
    MEMBER_INVITATIONS: '/org-admin/members/invitations',
    HELP: '/org-admin/help',
    ROLES: '/org-admin/roles',
    ROLE_CREATE: '/org-admin/roles/new',
    ROLE_EDIT: (id: string | number = ':roleId') => `/org-admin/roles/${String(id)}/edit`,
    REGIONS: '/org-admin/regions',
    DEPARTMENTS: '/org-admin/departments',
    LITIGATION: '/org-admin/matters',
    LITIGATION_CASE_DETAIL: (id: string | number = ':caseId') =>
      `/org-admin/matters/cases/${String(id)}`,
    EXTERNAL_COUNSEL: '/org-admin/external-counsel',
    CONTRACTS: '/org-admin/contracts',
    CONTRACT_DETAIL: (id: string | number = ':contractId') =>
      `/org-admin/contracts/detail/${String(id)}`,
    COMPLIANCE: '/org-admin/compliance',
    COMPLIANCE_REGISTER: '/org-admin/compliance/counterparties',
    COMPLIANCE_RENEWALS: '/org-admin/compliance/renewals',
    COMPLIANCE_DETAIL: (id: string | number = ':counterpartyId') =>
      `/org-admin/compliance/detail/${String(id)}`,
    LAND: '/org-admin/assets',
    LAND_OVERVIEW: '/org-admin/assets/overview',
    LAND_LIST: '/org-admin/assets/list',
    LAND_DETAIL: (id: string | number = ':assetId') => `/org-admin/assets/${String(id)}`,
    WHISTLEBLOWING: '/org-admin/whistleblowing',
    WHISTLEBLOWING_CASE_DETAIL: (id: string | number = ':caseId') =>
      `/org-admin/whistleblowing/cases/${String(id)}`,
    // In-app "Report a concern" — org admins can confidentially file a report too.
    REPORT_CONCERN: '/org-admin/report-concern',
    // Cross-module reporting oversight (region-scoped, read-only).
    REPORTING: '/org-admin/reporting',
    PROFILE: '/org-admin/profile',
    PLAN: '/org-admin/plan',
    INTEGRATIONS: '/org-admin/integrations',
    SETTINGS: '/org-admin/settings',
    NOTIFICATIONS: '/org-admin/notifications',
  }),

  // Authenticated app (SUPER_ADMIN)
  ADMIN: Object.freeze({
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    PLANS: '/admin/plans',
    PERMISSIONS: '/admin/permissions',
    ROLES: '/admin/roles',
    ROLE_DETAIL: (id = ':roleId') => `/admin/roles/${id}`,
    ORGANIZATIONS: '/admin/organizations',
    ORG_DETAIL: (id = ':orgId') => `/admin/organizations/${id}`,
    CAPABILITIES: '/admin/capabilities',
    USERS: '/admin/users',
    USER_DETAIL: (id = ':userId') => `/admin/users/${id}`,
    SETTINGS: '/admin/settings',
    MFA_SETTINGS: '/admin/settings/mfa',
  }),

  NOT_FOUND: '*',
});

export const wbRoutes = {
  dashboard: ROUTES.WHISTLEBLOWING,
  cases: ROUTES.WHISTLEBLOWING_REGISTER,
  reportConcern: ROUTES.REPORT_CONCERN,
  caseDetail: ROUTES.WHISTLEBLOWING_DETAIL,
  report: ROUTES.REPORT.ROOT,
  reportTrack: ROUTES.REPORT.TRACK,
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Resolve the correct post-login landing route for a given role.
 * Used by PublicOnlyRoute and by the login mutation on success.
 */
export function dashboardForRole(role: PlatformRole | undefined): string {
  if (role === 'SUPER_ADMIN') {
    return ROUTES.ADMIN.DASHBOARD;
  }
  if (role === 'TENANT') {
    return ROUTES.ORG_ADMIN.DASHBOARD;
  }
  return ROUTES.DASHBOARD;
}

const ADMIN_PREFIX = ROUTES.ADMIN.ROOT;
const ORG_ADMIN_PREFIX = ROUTES.ORG_ADMIN.ROOT;
const PORTAL_PREFIX = ROUTES.PORTAL.ROOT;

function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** True when the user is an external resource (outside counsel / consultant). */
export function isExternalUser(
  user: (Pick<AuthUser, 'kind'> & Partial<Pick<AuthUser, 'persona'>>) | null | undefined,
): boolean {
  return user?.persona !== undefined && user.persona !== null
    ? user.persona === 'EXTERNAL_COUNSEL'
    : user?.kind === 'EXTERNAL_COUNSEL';
}

/**
 * Post-login landing route for a user. External users always land in the
 * dedicated portal; everyone else lands on their role's dashboard.
 */
export function landingForUser(
  user: Pick<AuthUser, 'kind' | 'platformRole'> & Partial<Pick<AuthUser, 'persona'>>,
): string {
  if (isExternalUser(user)) {
    return PORTAL_PREFIX;
  }
  return dashboardForRole(user.platformRole);
}

/**
 * Is `path` inside the portal a user with `role` is actually allowed to use?
 *
 * Each portal is owned by exactly one platform role:
 *   SUPER_ADMIN → /admin/*      TENANT → /org-admin/*      USER → everything else
 *
 * This is the gate for honoring a stored `from` deep-link on login. Without
 * it, a redirect captured against one portal (e.g. a logout that briefly
 * passes through `/org-admin/dashboard` and stashes it as `from`) would be
 * replayed for the *next* user regardless of role — landing, say, a USER on
 * the TENANT dashboard. When the path isn't valid for the role we fall back
 * to that role's own dashboard instead.
 */
export function isPathAllowedForRole(path: string, role: PlatformRole | undefined): boolean {
  if (role === 'SUPER_ADMIN') {
    return isUnder(path, ADMIN_PREFIX);
  }
  if (role === 'TENANT') {
    return isUnder(path, ORG_ADMIN_PREFIX);
  }
  // USER / SUPPORT (module-user roles): the tenant-user app only — never an
  // admin, org-admin, or external-portal path.
  return (
    !isUnder(path, ADMIN_PREFIX) &&
    !isUnder(path, ORG_ADMIN_PREFIX) &&
    !isUnder(path, PORTAL_PREFIX)
  );
}

/**
 * Kind-aware variant of {@link isPathAllowedForRole}. External users live
 * exclusively under `/portal/*`; internal users never do.
 */
export function isPathAllowedForUser(
  path: string,
  user: Pick<AuthUser, 'kind' | 'platformRole'> & Partial<Pick<AuthUser, 'persona'>>,
): boolean {
  if (isExternalUser(user)) {
    return isUnder(path, PORTAL_PREFIX);
  }
  return isPathAllowedForRole(path, user.platformRole);
}
