import type { MembershipPersona } from '@/types/auth';

export type PortalRole = 'TENANT' | 'USER';

export const PORTAL_INTENT_STORAGE_KEY = 'atlyis:portal-intent';

export function setPortalIntent(portal: PortalRole): void {
  window.sessionStorage.setItem(PORTAL_INTENT_STORAGE_KEY, portal);
}

export function readPortalIntent(): PortalRole {
  return window.sessionStorage.getItem(PORTAL_INTENT_STORAGE_KEY) === 'TENANT' ? 'TENANT' : 'USER';
}

export function filterMembershipsForPortal<
  T extends { persona?: MembershipPersona; roles: { systemRole: PortalRole; name?: string }[] },
>(memberships: T[], portal: PortalRole): T[] {
  return memberships.filter((membership) => {
    if (membership.persona !== undefined) {
      return portal === 'TENANT'
        ? membership.persona === 'TENANT'
        : membership.persona === 'INTERNAL' || membership.persona === 'EXTERNAL_COUNSEL';
    }
    return membership.roles.some((role) => role.systemRole === portal);
  });
}

/**
 * Resolves a requested portal against the memberships actually returned by
 * the server. Login entry points may leave a stale portal intent behind, so
 * an invitation accepted as USER must not disappear from a Tenant picker.
 */
export function resolvePortalForMemberships(
  memberships: {
    persona?: MembershipPersona;
    roles: { id?: string; systemRole: PortalRole; name?: string }[];
  }[],
  requestedPortal: PortalRole,
): PortalRole {
  if (filterMembershipsForPortal(memberships, requestedPortal).length > 0) {
    return requestedPortal;
  }

  const alternatePortal: PortalRole = requestedPortal === 'TENANT' ? 'USER' : 'TENANT';
  return filterMembershipsForPortal(memberships, alternatePortal).length > 0
    ? alternatePortal
    : requestedPortal;
}
