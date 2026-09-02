import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { AuthLayout } from '@components/layout/AuthLayout';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { ToastViewport } from '@components/common/ToastViewport';
import { Loader } from '@components/common/Loader';
import { queryClient } from '@lib/queryClient';
import { applyThemePreference, readThemePreference } from '@lib/theme';
import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';
import { useSessionBootstrap } from '@hooks/useSessionBootstrap';
import { useSessionSync } from '@hooks/useSessionSync';
import { LandingPage } from '@pages/LandingPage';
import { LoginPage } from '@pages/auth/LoginPage';
import { AdminLoginPage } from '@pages/auth/AdminLoginPage';
import { OrgLoginPage } from '@pages/auth/OrgLoginPage';
import { MfaVerifyPage } from '@pages/auth/MfaVerifyPage';
import { VerifyEmailPage } from '@pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '@pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@pages/auth/ResetPasswordPage';
import { InvitationAcceptPage } from '@pages/InvitationAcceptPage';
import { PostLoginWelcome } from '@components/common/PostLoginWelcome';
import { consumePostLoginWelcome } from '@lib/post-login-welcome';

/*
 * Route-level code splitting.
 *
 * The build was previously a single 2.4 MB chunk, so someone opening the public
 * reporting portal downloaded the entire investigator console and system-admin
 * console before they could read the first question on the form. That is the
 * wrong cost to impose on the one user who may be doing this on a borrowed phone
 * on a bad connection, and who has the strongest reason to want the page to load
 * and be done with.
 *
 * The reporter-facing routes and the login screen stay in the main chunk; every
 * authenticated surface is split out and fetched only once someone signs in.
 */
const ReportPortalPage = lazy(() =>
  import('@pages/report/ReportPortalPage').then((m) => ({ default: m.ReportPortalPage })),
);
const ReportTrackPage = lazy(() =>
  import('@pages/report/ReportTrackPage').then((m) => ({ default: m.ReportTrackPage })),
);
const WhistleblowingLayout = lazy(() =>
  import('@layouts/WhistleblowingLayout').then((m) => ({ default: m.WhistleblowingLayout })),
);
const WbDashboardPage = lazy(() =>
  import('@pages/whistleblowing/WbDashboardPage').then((m) => ({ default: m.WbDashboardPage })),
);
const UserOverviewPage = lazy(() =>
  import('@pages/dashboard/UserOverviewPage').then((m) => ({ default: m.UserOverviewPage })),
);
const ProfilePage = lazy(() =>
  import('@pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const WbCaseRegisterPage = lazy(() =>
  import('@pages/whistleblowing/WbCaseRegisterPage').then((m) => ({ default: m.WbCaseRegisterPage })),
);
const WbCaseDetailPage = lazy(() =>
  import('@pages/whistleblowing/WbCaseDetailPage').then((m) => ({ default: m.WbCaseDetailPage })),
);
const WbReportConcernPage = lazy(() =>
  import('@pages/whistleblowing/WbReportConcernPage').then((m) => ({ default: m.WbReportConcernPage })),
);
const NotificationsPage = lazy(() =>
  import('@pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const ManualIntakePage = lazy(() =>
  import('./manual-intake').then((m) => ({ default: m.ManualIntakePage })),
);
const OrgAdminWhistleblowingLayout = lazy(() =>
  import('@layouts/OrgAdminWhistleblowingLayout').then((m) => ({
    default: m.OrgAdminWhistleblowingLayout,
  })),
);
const OrgAdminDashboardPage = lazy(() =>
  import('@pages/org-admin/OrgAdminDashboardPage').then((m) => ({ default: m.OrgAdminDashboardPage })),
);
const OrgAdminWhistleblowingPage = lazy(() =>
  import('@pages/org-admin/OrgAdminWhistleblowingPage').then((m) => ({
    default: m.OrgAdminWhistleblowingPage,
  })),
);
const OrgAdminWhistleblowingCasePage = lazy(() =>
  import('@pages/org-admin/OrgAdminWhistleblowingCasePage').then((m) => ({
    default: m.OrgAdminWhistleblowingCasePage,
  })),
);
const AdminConsoleLayout = lazy(() =>
  import('@components/layout/AdminConsoleLayout').then((m) => ({ default: m.AdminConsoleLayout })),
);

const tenantPages = () => import('@pages/org-admin/TenantAdminPages');
const TenantHelpPage = lazy(() => import('@pages/org-admin/TenantHelpPage').then((m) => ({ default: m.TenantHelpPage })));
const TenantMembersPage = lazy(() => tenantPages().then((m) => ({ default: m.TenantMembersPage })));
const TenantPlanPage = lazy(() => import('@pages/org-admin/TenantPlanPage').then((m) => ({ default: m.TenantPlanPage })));
const TenantProfilePage = lazy(() => tenantPages().then((m) => ({ default: m.TenantProfilePage })));
const TenantRegionsPage = lazy(() => tenantPages().then((m) => ({ default: m.TenantRegionsPage })));
const TenantReportingPage = lazy(() => tenantPages().then((m) => ({ default: m.TenantReportingPage })));
const TenantSecurityPage = lazy(() => import('@pages/org-admin/TenantSecurityPage').then((m) => ({ default: m.TenantSecurityPage })));

const adminPages = () => import('@pages/admin/AdminConsolePages');
const AdminCapabilitiesPage = lazy(() => adminPages().then((m) => ({ default: m.AdminCapabilitiesPage })));
const AdminDashboardPage = lazy(() => adminPages().then((m) => ({ default: m.AdminDashboardPage })));
const AdminOrganizationsPage = lazy(() => adminPages().then((m) => ({ default: m.AdminOrganizationsPage })));
const AdminPermissionsPage = lazy(() => adminPages().then((m) => ({ default: m.AdminPermissionsPage })));
const AdminPlansPage = lazy(() => adminPages().then((m) => ({ default: m.AdminPlansPage })));
const AdminRolesPage = lazy(() => adminPages().then((m) => ({ default: m.AdminRolesPage })));
const AdminSettingsPage = lazy(() => adminPages().then((m) => ({ default: m.AdminSettingsPage })));
const AdminUsersPage = lazy(() => adminPages().then((m) => ({ default: m.AdminUsersPage })));

/**
 * Waits for the session bootstrap before deciding.
 *
 * Without this, every reload would redirect an authenticated user to the login
 * screen: the in-memory access token starts empty and the refresh round-trip has
 * not finished yet.
 */
function RequireAuth({ children }: { children: ReactNode }): ReactElement {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showPostLoginWelcome, setShowPostLoginWelcome] = useState(false);

  useEffect(() => {
    if (consumePostLoginWelcome()) setShowPostLoginWelcome(true);
  }, []);

  useEffect(() => {
    if (!showPostLoginWelcome) return;
    const timeout = window.setTimeout(() => setShowPostLoginWelcome(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [showPostLoginWelcome]);

  if (!isInitialized) return <Loader />;
  return isAuthenticated ? (
    <>
      {children}
      {showPostLoginWelcome && <PostLoginWelcome />}
    </>
  ) : <Navigate to={ROUTES.AUTH.LOGIN} replace />;
}

/**
 * Permissions come from the store, which `/auth/me` keeps current. They were
 * previously read from localStorage, where they were both editable by the user
 * and stale until the next sign-in. This is a usability gate only — the backend
 * enforces every one of these independently.
 */
function RequireOrganizationAdmin({ children }: { children: ReactNode }): ReactElement {
  const permissions = useAuthStore((state) => state.permissions);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) return <Loader />;
  return permissions.includes('whistleblowing_case:admin') ? (
    <>{children}</>
  ) : (
    <Navigate to={ROUTES.WHISTLEBLOWING} replace />
  );
}

function RequireSuperAdmin({ children }: { children: ReactNode }): ReactElement {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) return <Loader />;
  return user?.platformRole === 'SUPER_ADMIN' ? (
    <>{children}</>
  ) : (
    <Navigate to={ROUTES.AUTH.ADMIN_LOGIN} replace />
  );
}

function AppRoutes(): ReactElement {
  // Starts the refresh-cookie exchange, but does NOT gate rendering on it.
  // Public routes — the landing page, sign-in, and above all the reporting
  // portal — must paint immediately. Making a reporter wait on an authentication
  // round-trip they have no part in would be the wrong trade for the one user
  // most likely to be on a slow or borrowed connection.
  //
  // Only `RequireAuth` waits, and only for as long as the bootstrap is in flight.
  useSessionBootstrap();
  // Keeps permissions live while the tab is open, so a role change lands without
  // requiring the user to sign out and back in.
  useSessionSync();

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path={ROUTES.ROOT} element={<LandingPage />} />
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.AUTH.ADMIN_LOGIN} element={<AdminLoginPage />} />
          <Route path={ROUTES.AUTH.ORG_LOGIN} element={<OrgLoginPage />} />
          <Route path={ROUTES.AUTH.MFA_VERIFY} element={<MfaVerifyPage />} />
          <Route path={ROUTES.AUTH.VERIFY_EMAIL} element={<VerifyEmailPage />} />
          <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />
          {/*
            There is no public sign-up route. Self-service tenant creation would
            let anyone provision an organization and grant themselves the full
            whistleblowing permission set; organizations are provisioned from the
            system console instead.
          */}
          <Route path="/auth/signup" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
          <Route path={ROUTES.INVITATION_ACCEPT} element={<InvitationAcceptPage />} />
        </Route>

        <Route element={<RequireAuth><WhistleblowingLayout /></RequireAuth>}>
          <Route path={ROUTES.DASHBOARD} element={<UserOverviewPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.WHISTLEBLOWING} element={<WbDashboardPage />} />
          <Route path={ROUTES.WHISTLEBLOWING_REGISTER} element={<WbCaseRegisterPage />} />
          <Route path={ROUTES.WHISTLEBLOWING_DETAIL()} element={<WbCaseDetailPage />} />
          <Route path={ROUTES.REPORT_CONCERN} element={<WbReportConcernPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path={ROUTES.SETTINGS} element={<Navigate to={ROUTES.MFA_SETTINGS} replace />} />
          <Route path={ROUTES.MFA_SETTINGS} element={<TenantSecurityPage />} />
          <Route path="/cases/new" element={<ManualIntakePage />} />
          <Route path="/cases" element={<WbCaseRegisterPage />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <RequireOrganizationAdmin>
                <OrgAdminWhistleblowingLayout />
              </RequireOrganizationAdmin>
            </RequireAuth>
          }
        >
          <Route path={ROUTES.ORG_ADMIN.ROOT} element={<Navigate to={ROUTES.ORG_ADMIN.DASHBOARD} replace />} />
          <Route path={ROUTES.ORG_ADMIN.DASHBOARD} element={<OrgAdminDashboardPage />} />
          <Route path={ROUTES.ORG_ADMIN.WHISTLEBLOWING} element={<OrgAdminWhistleblowingPage />} />
          <Route path={ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL()} element={<OrgAdminWhistleblowingCasePage />} />
          <Route path={ROUTES.ORG_ADMIN.REPORT_CONCERN} element={<WbReportConcernPage />} />
          <Route path={ROUTES.ORG_ADMIN.NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.ORG_ADMIN.REPORTING} element={<TenantReportingPage />} />
          <Route path={ROUTES.ORG_ADMIN.MEMBERS} element={<TenantMembersPage />} />
          <Route path={ROUTES.ORG_ADMIN.MEMBER_INVITATIONS} element={<TenantMembersPage />} />
          <Route path={ROUTES.ORG_ADMIN.REGIONS} element={<TenantRegionsPage />} />
          <Route path={ROUTES.ORG_ADMIN.PLAN} element={<TenantPlanPage />} />
          <Route path={ROUTES.ORG_ADMIN.SETTINGS} element={<TenantSecurityPage />} />
          <Route path={ROUTES.ORG_ADMIN.PROFILE} element={<TenantProfilePage />} />
          <Route path={ROUTES.ORG_ADMIN.HELP} element={<TenantHelpPage />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <RequireSuperAdmin>
                <AdminConsoleLayout />
              </RequireSuperAdmin>
            </RequireAuth>
          }
        >
          <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboardPage />} />
          <Route path={ROUTES.ADMIN.PERMISSIONS} element={<AdminPermissionsPage />} />
          <Route path={ROUTES.ADMIN.ROLES} element={<AdminRolesPage />} />
          <Route path={ROUTES.ADMIN.ORGANIZATIONS} element={<AdminOrganizationsPage />} />
          <Route path={ROUTES.ADMIN.PLANS} element={<AdminPlansPage />} />
          <Route path={ROUTES.ADMIN.CAPABILITIES} element={<AdminCapabilitiesPage />} />
          <Route path={ROUTES.ADMIN.USERS} element={<AdminUsersPage />} />
          <Route path={ROUTES.ADMIN.SETTINGS} element={<AdminSettingsPage />} />
          <Route path={ROUTES.ADMIN.MFA_SETTINGS} element={<TenantSecurityPage />} />
        </Route>

        <Route path={ROUTES.REPORT.TRACK} element={<ReportTrackPage />} />
        <Route path={ROUTES.REPORT.PORTAL()} element={<ReportPortalPage />} />
        <Route path="/report/credentials" element={<Navigate to={ROUTES.REPORT.TRACK} replace />} />
        <Route path="/login" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.ROOT} replace />} />
      </Routes>
    </Suspense>
  );
}

export function App(): ReactElement {
  useEffect(() => {
    applyThemePreference(readThemePreference());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastViewport />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export { LoginPage as Login };
