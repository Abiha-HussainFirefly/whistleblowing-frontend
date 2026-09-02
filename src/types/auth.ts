/**
 * Auth domain types — mirrored from the NestJS backend Prisma enums.
 *
 * These MUST match the backend exactly. The Prisma schema is the
 * source of truth — see prisma/schema.prisma enums:
 *   PlatformRole, UserKind, UserStatus
 */

export type PlatformRole = 'USER' | 'TENANT' | 'SUPPORT' | 'SUPER_ADMIN';

export type UserKind = 'STANDARD' | 'EXTERNAL_COUNSEL' | 'WHISTLEBLOWER' | 'SERVICE_ACCOUNT';

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'DEACTIVATED';

/** Access persona selected for one organization-region membership. */
export type MembershipPersona = 'INTERNAL' | 'TENANT' | 'EXTERNAL_COUNSEL';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  /** Preferred UI language (en/ar/fr/de/ur). Applied to the SPA on sign-in. */
  locale?: string;
  platformRole: PlatformRole;
  persona?: MembershipPersona | null;
  kind: UserKind;
  status: UserStatus;
  mfaEnabled: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
}

export interface AuthSessionPayload {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
  /** Legacy migration field. New sessions keep the refresh token in an HttpOnly cookie. */
  refreshToken?: string;
  refreshTokenExpiresIn: number;
  /** Authorization returned with an interactive login. */
  permissions?: string[];
  activeOrganization?: OrgContextInfo | null;
  activeRegion?: string | null;
}

export interface EmailVerificationState {
  verificationToken: string;
  verificationExpiresIn: number;
  maskedEmail: string;
  /** Uses the existing code screen to activate a selected pending invitation. */
  verificationKind?: 'account' | 'invitation';
  invitationId?: string;
  /** Invitation continuation retained through first-login email verification. */
  invitationToken?: string;
}

/** Sentinel for "all regions" mode in the region switcher / switch-context API. */
export const ALL_REGIONS_CODE = '*';

export interface RegionInfo {
  regionCode: string;
  displayName: string;
  roles: { id: string; name: string }[];
}

export interface OrgContextInfo {
  id: string;
  name: string;
  slug: string;
  /** White-label branding (per-org). Null/absent → Tellara default palette. */
  logoUrl?: string | null;
  brandColor?: string | null;
  brandAccentColor?: string | null;
}

/** Resolved access scope for the active org. Returned by /auth/me and used
 *  by the region switcher to decide whether to surface the "All Regions"
 *  affordance. */
export interface ActorOrgScope {
  isCrossRegion: boolean;
  regions: string[];
}

export interface MeResponse {
  user: AuthUser;
  permissions: string[];
  activeRegion: string | null;
  availableRegions: RegionInfo[];
  availableOrganizations: OrgContextInfo[];
  scope: ActorOrgScope;
}

export interface UserRegionMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  regionCode: string;
  regionDisplayName: string;
  persona?: MembershipPersona;
  roles: { id: string; name: string; systemRole: 'TENANT' | 'USER' }[];
}

export interface PendingOrganizationInvitation {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  region: string;
  expiresAt: string;
}

export interface InvitationVerificationStart {
  invitationId: string;
  organizationName: string;
  organizationSlug: string;
  region: string;
  maskedEmail: string;
  verificationToken: string;
  verificationExpiresIn: number;
}

export interface InvitationVerificationResponse {
  message: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  region: string;
  persona: MembershipPersona;
  isNewUser: false;
  session: AuthSessionPayload;
}
