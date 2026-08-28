import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@components/layout/AuthLayout';
import { queryClient } from '@lib/queryClient';
import { applyThemePreference, readThemePreference } from '@lib/theme';
import { ROUTES } from '@config/routes';
import { LandingPage } from '@pages/LandingPage';
import { LoginPage } from '@pages/auth/LoginPage';
import { AdminLoginPage } from '@pages/auth/AdminLoginPage';
import { OrgLoginPage } from '@pages/auth/OrgLoginPage';
import { MfaVerifyPage } from '@pages/auth/MfaVerifyPage';
import { VerifyEmailPage } from '@pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '@pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@pages/auth/ResetPasswordPage';
import { SignupPage } from '@pages/auth/SignupPage';
import { InvitationAcceptPage } from '@pages/InvitationAcceptPage';
import { WbDashboardPage } from '@pages/whistleblowing/WbDashboardPage';
import { WbCaseRegisterPage } from '@pages/whistleblowing/WbCaseRegisterPage';
import { WbCaseDetailPage } from '@pages/whistleblowing/WbCaseDetailPage';
import { WbReportConcernPage } from '@pages/whistleblowing/WbReportConcernPage';
import { ReportPortalPage } from '@pages/report/ReportPortalPage';
import { ReportTrackPage } from '@pages/report/ReportTrackPage';
import { OrgAdminWhistleblowingPage } from '@pages/org-admin/OrgAdminWhistleblowingPage';
import { OrgAdminWhistleblowingCasePage } from '@pages/org-admin/OrgAdminWhistleblowingCasePage';
import { OrgAdminDashboardPage } from '@pages/org-admin/OrgAdminDashboardPage';
import {
  TenantHelpPage,
  TenantIntegrationsPage,
  TenantMembersPage,
  TenantPlanPage,
  TenantProfilePage,
  TenantRegionsPage,
  TenantReportingPage,
  TenantRoleCreatePage,
  TenantRolesPage,
  TenantSettingsPage,
} from '@pages/org-admin/TenantAdminPages';
import { WhistleblowingLayout } from '@layouts/WhistleblowingLayout';
import { OrgAdminWhistleblowingLayout } from '@layouts/OrgAdminWhistleblowingLayout';
import { AdminConsoleLayout } from '@components/layout/AdminConsoleLayout';
import {
  AdminCapabilitiesPage,
  AdminConfigPacksPage,
  AdminDashboardPage,
  AdminOrganizationsPage,
  AdminPermissionsPage,
  AdminPlansPage,
  AdminRolesPage,
  AdminSettingsPage,
  AdminUsersPage,
} from '@pages/admin/AdminConsolePages';
import { NotificationsPage } from '@pages/NotificationsPage';
import { ManualIntakePage } from './manual-intake';
import { useEffect, type ReactElement, type ReactNode } from 'react';

function isAuthenticated(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('wb.internalToken') !== null;
}

function RequireAuth({ children }: { children: ReactNode }): ReactElement {
  return isAuthenticated() ? <>{children}</> : <Navigate to={ROUTES.AUTH.LOGIN} replace />;
}

function RequireOrganizationAdmin({ children }: { children: ReactNode }): ReactElement {
  const permissions = useAuthPermissions();
  return permissions.includes('whistleblowing_case:admin')
    ? <>{children}</>
    : <Navigate to={ROUTES.WHISTLEBLOWING} replace />;
}

function RequireSuperAdmin({ children }: { children: ReactNode }): ReactElement {
  const role = typeof window === 'undefined' ? null : localStorage.getItem('wb.platformRole');
  return role === 'SUPER_ADMIN' ? <>{children}</> : <Navigate to={ROUTES.AUTH.ADMIN_LOGIN} replace />;
}

function useAuthPermissions(): string[] {
  // The store is populated immediately after login. The local copy keeps the
  // guard correct during a hard refresh before the session bootstrap runs.
  const stored = typeof window === 'undefined' ? null : localStorage.getItem('wb.permissions');
  try {
    const parsed: unknown = stored === null ? [] : JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function App(): ReactElement {
  useEffect(() => {
    applyThemePreference(readThemePreference());
  }, []);

  return <QueryClientProvider client={queryClient}><Routes>
    <Route path={ROUTES.ROOT} element={<LandingPage />} />
    <Route element={<AuthLayout />}>
      <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.AUTH.ADMIN_LOGIN} element={<AdminLoginPage />} />
      <Route path={ROUTES.AUTH.ORG_LOGIN} element={<OrgLoginPage />} />
      <Route path={ROUTES.AUTH.MFA_VERIFY} element={<MfaVerifyPage />} />
      <Route path={ROUTES.AUTH.VERIFY_EMAIL} element={<VerifyEmailPage />} />
      <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path={ROUTES.INVITATION_ACCEPT} element={<InvitationAcceptPage />} />
    </Route>
    <Route element={<RequireAuth><WhistleblowingLayout /></RequireAuth>}>
      <Route path={ROUTES.DASHBOARD} element={<Navigate to={ROUTES.WHISTLEBLOWING} replace />} />
      <Route path={ROUTES.WHISTLEBLOWING} element={<WbDashboardPage />} />
      <Route path={ROUTES.WHISTLEBLOWING_REGISTER} element={<WbCaseRegisterPage />} />
      <Route path={ROUTES.WHISTLEBLOWING_DETAIL()} element={<WbCaseDetailPage />} />
      <Route path={ROUTES.REPORT_CONCERN} element={<WbReportConcernPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/cases/new" element={<ManualIntakePage />} />
      <Route path="/cases" element={<WbCaseRegisterPage />} />
    </Route>
    <Route element={<RequireAuth><RequireOrganizationAdmin><OrgAdminWhistleblowingLayout /></RequireOrganizationAdmin></RequireAuth>}>
      <Route path={ROUTES.ORG_ADMIN.DASHBOARD} element={<OrgAdminDashboardPage />} />
      <Route path={ROUTES.ORG_ADMIN.WHISTLEBLOWING} element={<OrgAdminWhistleblowingPage />} />
      <Route path={ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL()} element={<OrgAdminWhistleblowingCasePage />} />
      <Route path={ROUTES.ORG_ADMIN.REPORT_CONCERN} element={<WbReportConcernPage />} />
      <Route path={ROUTES.ORG_ADMIN.NOTIFICATIONS} element={<NotificationsPage />} />
      <Route path={ROUTES.ORG_ADMIN.REPORTING} element={<TenantReportingPage />} />
      <Route path={ROUTES.ORG_ADMIN.MEMBERS} element={<TenantMembersPage />} />
      <Route path={ROUTES.ORG_ADMIN.MEMBER_INVITATIONS} element={<TenantMembersPage />} />
      <Route path={ROUTES.ORG_ADMIN.ROLES} element={<TenantRolesPage />} />
      <Route path={ROUTES.ORG_ADMIN.ROLE_CREATE} element={<TenantRoleCreatePage />} />
      <Route path={ROUTES.ORG_ADMIN.REGIONS} element={<TenantRegionsPage />} />
      <Route path={ROUTES.ORG_ADMIN.PLAN} element={<TenantPlanPage />} />
      <Route path={ROUTES.ORG_ADMIN.INTEGRATIONS} element={<TenantIntegrationsPage />} />
      <Route path={ROUTES.ORG_ADMIN.SETTINGS} element={<TenantSettingsPage />} />
      <Route path={ROUTES.ORG_ADMIN.PROFILE} element={<TenantProfilePage />} />
      <Route path={ROUTES.ORG_ADMIN.HELP} element={<TenantHelpPage />} />
    </Route>
    <Route element={<RequireAuth><RequireSuperAdmin><AdminConsoleLayout /></RequireSuperAdmin></RequireAuth>}>
      <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboardPage />} />
      <Route path={ROUTES.ADMIN.PERMISSIONS} element={<AdminPermissionsPage />} />
      <Route path={ROUTES.ADMIN.ROLES} element={<AdminRolesPage />} />
      <Route path={ROUTES.ADMIN.ORGANIZATIONS} element={<AdminOrganizationsPage />} />
      <Route path={ROUTES.ADMIN.PLANS} element={<AdminPlansPage />} />
      <Route path={ROUTES.ADMIN.CONFIG_PACKS} element={<AdminConfigPacksPage />} />
      <Route path={ROUTES.ADMIN.CAPABILITIES} element={<AdminCapabilitiesPage />} />
      <Route path={ROUTES.ADMIN.USERS} element={<AdminUsersPage />} />
      <Route path={ROUTES.ADMIN.SETTINGS} element={<AdminSettingsPage />} />
    </Route>
    <Route path={ROUTES.REPORT.TRACK} element={<ReportTrackPage />} />
    <Route path={ROUTES.REPORT.PORTAL()} element={<ReportPortalPage />} />
    <Route path="/report/credentials" element={<Navigate to={ROUTES.REPORT.TRACK} replace />} />
    <Route path="/login" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
    <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
  </Routes></QueryClientProvider>;
}

export { LoginPage as Login };
