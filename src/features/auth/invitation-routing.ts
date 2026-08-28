import { ROUTES } from '@config/routes';
import type { MembershipPersona } from '@/types/auth';

function withToken(path: string, parameter: 'invite' | 'token', token: string): string {
  return `${path}?${new URLSearchParams({ [parameter]: token }).toString()}`;
}

/** Sign-in route that retains the invitation continuation without using arbitrary redirects. */
export function invitationLoginPath(token: string): string {
  return withToken(ROUTES.AUTH.LOGIN, 'invite', token);
}

/** Canonical invite URL used after authentication completes. */
export function invitationAcceptPath(token: string): string {
  return withToken(ROUTES.INVITATION_ACCEPT, 'token', token);
}

/**
 * Invitation continuations always return to this known internal route. This
 * avoids accepting an arbitrary redirect URL from the query string.
 */
export function routeAfterInvitationAuthentication(
  invitationToken: string | null | undefined,
  fallback: string,
): string {
  // Pending invitations are now surfaced by the authenticated organization
  // picker. Selecting one sends the email code; no post-login acceptance page
  // or button is involved.
  return invitationToken !== null && invitationToken !== undefined && invitationToken.length > 0
    ? ROUTES.REGION_PICKER
    : fallback;
}

/** Routes an already-accepted invitation using its regional persona. */
export function routeAfterInvitationAcceptance(persona: MembershipPersona): string {
  if (persona === 'EXTERNAL_COUNSEL') {
    return ROUTES.PORTAL.ROOT;
  }
  if (persona === 'TENANT') {
    return ROUTES.ORG_ADMIN.DASHBOARD;
  }
  return ROUTES.DASHBOARD;
}
