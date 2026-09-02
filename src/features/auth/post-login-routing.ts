import { ROUTES } from '@config/routes';
import type { AuthUser } from '@/types/auth';

export function routeAfterTenantAuthentication(): string {
  return ROUTES.DASHBOARD;
}

/** Standalone target equivalent of Tellara's organization-admin portal landing. */
export function routeAfterOrganizationAdminAuthentication(): string {
  return ROUTES.ORG_ADMIN.DASHBOARD;
}

export function routeAfterVerifiedAuthentication(user: Pick<AuthUser, 'platformRole'>): string {
  if (user.platformRole === 'SUPER_ADMIN') {
    return ROUTES.ADMIN.DASHBOARD;
  }
  if (user.platformRole === 'TENANT') {
    return routeAfterOrganizationAdminAuthentication();
  }
  return routeAfterTenantAuthentication();
}
