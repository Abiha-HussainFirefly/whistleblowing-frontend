import { create } from 'zustand';
import type {
  ActorOrgScope,
  AuthSessionPayload,
  AuthUser,
  MeResponse,
  OrgContextInfo,
  RegionInfo,
} from '@/types/auth';
import { decodeJwtClaims } from '@lib/jwt';
import { clearSession, saveSession } from '@lib/session-storage';

export interface AuthenticatedContext {
  activeOrganization: OrgContextInfo | null;
  activeRegion: string | null;
  /** Accept an atomic token/context replacement only from this current token. */
  expectedAccessToken?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: number | null;
  permissions: string[];
  activeRegion: string | null;
  availableRegions: RegionInfo[];
  activeOrganization: OrgContextInfo | null;
  availableOrganizations: OrgContextInfo[];
  scope: ActorOrgScope;
  isInitialized: boolean;
  isAuthenticated: boolean;
  isAuthorizationReady: boolean;
  sessionRestorationStatus: 'idle' | 'action-required';
  authorizationContextVersion: number;
}

interface AuthActions {
  setSession: (payload: AuthSessionPayload) => void;
  seedSessionTokens: (payload: AuthSessionPayload) => void;

  setTokens: (payload: AuthSessionPayload) => void;
  setPermissions: (permissions: string[]) => void;
  setRegionContext: (
    /** null = "All Regions" mode */
    region: string | null,
    org: OrgContextInfo,
    tokens: AuthSessionPayload,
    permissions: string[],
  ) => void;
  setAvailableRegions: (regions: RegionInfo[]) => void;
  setAvailableOrganizations: (orgs: OrgContextInfo[]) => void;
  setScope: (scope: ActorOrgScope) => void;
  applyAuthenticatedContext: (
    payload: AuthSessionPayload,
    me: MeResponse,
    context: AuthenticatedContext,
  ) => boolean;
  applyAuthorizationContext: (me: MeResponse) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  clear: () => void;
  setInitialized: () => void;
  requireSessionRestorationAction: () => void;
  resetSessionRestoration: (ownerVersion: number) => boolean;
}

export type AuthStore = AuthState & AuthActions;

const INITIAL_STATE: AuthState = {
  user: null,
  accessToken: null,
  accessTokenExpiresAt: null,
  refreshToken: null,
  refreshTokenExpiresAt: null,
  permissions: [],
  activeRegion: null,
  availableRegions: [],
  activeOrganization: null,
  availableOrganizations: [],
  scope: { isCrossRegion: false, regions: [] },
  isInitialized: false,
  isAuthenticated: false,
  isAuthorizationReady: false,
  sessionRestorationStatus: 'idle',
  authorizationContextVersion: 0,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...INITIAL_STATE,

  setSession: (payload: AuthSessionPayload): void => {
    const now = Date.now();
    localStorage.setItem('wb.userDisplayName', payload.user.displayName ?? '');
    localStorage.setItem('wb.userEmail', payload.user.email);
    const refreshTokenExpiresAt = now + payload.refreshTokenExpiresIn * 1000;
    const storedPermissions = JSON.parse(localStorage.getItem('wb.permissions') ?? '[]') as unknown;
    const permissions = Array.isArray(storedPermissions)
      ? storedPermissions.filter((value): value is string => typeof value === 'string')
      : [];
    const organizationId = localStorage.getItem('wb.organizationId');
    const organizationSlug = localStorage.getItem('wb.organizationSlug');
    const organizationName = localStorage.getItem('wb.organizationName');
    const activeOrganization = organizationId !== null && organizationSlug !== null
      ? { id: organizationId, name: organizationName ?? organizationSlug, slug: organizationSlug }
      : null;
    set({
      permissions,
      activeRegion: null,
      availableRegions: [],
      activeOrganization,
      availableOrganizations: [],
      scope: { isCrossRegion: false, regions: [] },
      user: payload.user,
      accessToken: payload.accessToken,
      accessTokenExpiresAt: now + payload.expiresIn * 1000,
      refreshToken: 'cookie',
      refreshTokenExpiresAt,
      isAuthenticated: true,
      isInitialized: true,
      isAuthorizationReady: activeOrganization !== null,
      sessionRestorationStatus: 'idle',
      authorizationContextVersion: get().authorizationContextVersion + 1,
    });
    saveSession({ refreshTokenExpiresAt });
    localStorage.removeItem('sidebar-open');
    localStorage.removeItem('sidebar-expanded');
  },

  seedSessionTokens: (payload: AuthSessionPayload): void => {
    const now = Date.now();
    const refreshTokenExpiresAt = now + payload.refreshTokenExpiresIn * 1000;
    set({
      permissions: [],
      activeRegion: null,
      availableRegions: [],
      activeOrganization: null,
      availableOrganizations: [],
      scope: { isCrossRegion: false, regions: [] },
      user: payload.user,
      accessToken: payload.accessToken,
      accessTokenExpiresAt: now + payload.expiresIn * 1000,
      refreshToken: 'cookie',
      refreshTokenExpiresAt,
      isAuthenticated: false,
      isInitialized: false,
      isAuthorizationReady: false,
      sessionRestorationStatus: 'idle',
      authorizationContextVersion: get().authorizationContextVersion + 1,
    });
    saveSession({ refreshTokenExpiresAt });
    localStorage.removeItem('sidebar-open');
    localStorage.removeItem('sidebar-expanded');
  },

  setTokens: (payload: AuthSessionPayload): void => {
    const now = Date.now();
    const refreshTokenExpiresAt = now + payload.refreshTokenExpiresIn * 1000;
    const {
      user,
      activeOrganization,
      activeRegion,
      isAuthorizationReady,
      authorizationContextVersion,
    } = get();
    const claims = decodeJwtClaims(payload.accessToken);
    const tokenOrganizationId = typeof claims?.org === 'string' ? claims.org : null;
    const tokenRegion = typeof claims?.region === 'string' ? claims.region : null;
    const preservesAuthorizationContext =
      user !== null &&
      user.id === payload.user.id &&
      isAuthorizationReady &&
      activeOrganization?.id === tokenOrganizationId &&
      activeRegion === tokenRegion;
    const isSuperAdmin = payload.user.platformRole === 'SUPER_ADMIN';
    set({
      user: payload.user,
      accessToken: payload.accessToken,
      accessTokenExpiresAt: now + payload.expiresIn * 1000,
      refreshToken: 'cookie',
      refreshTokenExpiresAt,
      isAuthenticated: true,
      isAuthorizationReady: isSuperAdmin || preservesAuthorizationContext,
      sessionRestorationStatus: 'idle',
      authorizationContextVersion:
        isSuperAdmin || preservesAuthorizationContext
          ? authorizationContextVersion
          : authorizationContextVersion + 1,
    });
    saveSession({ refreshTokenExpiresAt });
  },

  setPermissions: (permissions: string[]): void => {
    set({ permissions });
  },

  setRegionContext: (
    region: string | null,
    org: OrgContextInfo,
    tokens: AuthSessionPayload,
    permissions: string[],
  ): void => {
    const now = Date.now();
    const refreshTokenExpiresAt = now + tokens.refreshTokenExpiresIn * 1000;
    set({
      user: tokens.user,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: now + tokens.expiresIn * 1000,
      refreshToken: 'cookie',
      refreshTokenExpiresAt,
      activeRegion: region,
      activeOrganization: org,
      permissions,
      isAuthenticated: true,
      isInitialized: true,
      sessionRestorationStatus: 'idle',
    });
    saveSession({ refreshTokenExpiresAt });
  },

  setAvailableRegions: (regions: RegionInfo[]): void => {
    set({ availableRegions: regions });
  },

  setAvailableOrganizations: (orgs: OrgContextInfo[]): void => {
    set({ availableOrganizations: orgs });
  },

  setScope: (scope: ActorOrgScope): void => {
    set({ scope });
  },

  applyAuthenticatedContext: (
    payload: AuthSessionPayload,
    me: MeResponse,
    context: AuthenticatedContext,
  ): boolean => {
    const current = get();
    const currentSessionMatches =
      current.accessToken === payload.accessToken ||
      (context.expectedAccessToken !== undefined &&
        current.accessToken === context.expectedAccessToken);
    const belongsToCurrentSession =
      currentSessionMatches &&
      current.user?.id === payload.user.id &&
      me.user.id === payload.user.id;

    if (!belongsToCurrentSession) {
      // A slower bootstrap/login request from a previous identity must never
      // replace a newer session. Its response is valid, but no longer current.
      return false;
    }

    const now = Date.now();
    const refreshTokenExpiresAt = now + payload.refreshTokenExpiresIn * 1000;
    set({
      user: me.user,
      accessToken: payload.accessToken,
      accessTokenExpiresAt: now + payload.expiresIn * 1000,
      refreshToken: 'cookie',
      refreshTokenExpiresAt,
      activeOrganization: context.activeOrganization,
      activeRegion: context.activeRegion,
      permissions: me.permissions,
      availableRegions: me.availableRegions,
      availableOrganizations: me.availableOrganizations,
      scope: me.scope,
      isAuthenticated: true,
      isInitialized: true,
      isAuthorizationReady: true,
      sessionRestorationStatus: 'idle',
    });
    saveSession({ refreshTokenExpiresAt });
    return true;
  },

  applyAuthorizationContext: (me: MeResponse): void => {
    const { accessToken, activeOrganization, user } = get();
    if (me.user.id !== user?.id) {
      return;
    }
    const claims = accessToken === null ? null : decodeJwtClaims(accessToken);
    const tokenOrganizationId = typeof claims?.org === 'string' ? claims.org : null;
    const activeRegion = typeof claims?.region === 'string' ? claims.region : me.activeRegion;
    const organization =
      tokenOrganizationId === null
        ? activeOrganization
        : (me.availableOrganizations.find((o) => o.id === tokenOrganizationId) ?? null);

    set({
      user: me.user,
      activeOrganization: organization,
      activeRegion,
      permissions: me.permissions,
      availableRegions: me.availableRegions,
      availableOrganizations: me.availableOrganizations,
      scope: me.scope,
      isAuthorizationReady: true,
    });
  },

  updateUser: (partial: Partial<AuthUser>): void => {
    const { user } = get();
    if (user === null) {
      return;
    }
    set({ user: { ...user, ...partial } });
  },

  clear: (): void => {
    clearSession();
    set({
      ...INITIAL_STATE,
      isInitialized: true,
      authorizationContextVersion: get().authorizationContextVersion + 1,
    });
  },

  setInitialized: (): void => {
    set({ isInitialized: true });
  },

  requireSessionRestorationAction: (): void => {
    set({
      isInitialized: true,
      isAuthenticated: false,
      isAuthorizationReady: false,
      sessionRestorationStatus: 'action-required',
    });
  },

  resetSessionRestoration: (ownerVersion: number): boolean => {
    const current = get();
    if (
      current.authorizationContextVersion !== ownerVersion ||
      current.sessionRestorationStatus !== 'action-required'
    ) {
      return false;
    }

    clearSession();
    set({
      ...INITIAL_STATE,
      isInitialized: true,
      authorizationContextVersion: current.authorizationContextVersion + 1,
    });
    return true;
  },
}));

/**
 * Rehydrate the lightweight internal session used by this standalone target.
 *
 * The route guard deliberately checks the durable token so a reload does not
 * send an already signed-in administrator back to the login page.  The
 * Zustand store, however, is in-memory and used to remain empty after that
 * reload.  That left the tenant pages mounted while their API calls had no
 * bearer token or organization context.  Restore the same context that was
 * written by authService before React renders any protected routes.
 */
export function restoreStoredInternalSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const token = localStorage.getItem('wb.internalToken');
  const organizationId = localStorage.getItem('wb.organizationId');
  const organizationSlug = localStorage.getItem('wb.organizationSlug');
  const platformRole = localStorage.getItem('wb.platformRole');
  if (token === null || token.length === 0 || (platformRole !== 'SUPER_ADMIN' && (organizationId === null || organizationSlug === null))) {
    return;
  }

  const claims = decodeJwtClaims(token);
  const expiresAt = typeof claims?.exp === 'number' ? claims.exp * 1000 : null;
  if (expiresAt !== null && expiresAt <= Date.now()) {
    localStorage.removeItem('wb.internalToken');
    useAuthStore.getState().clear();
    return;
  }

  const permissions = (() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('wb.permissions') ?? '[]');
      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === 'string')
        : [];
    } catch {
      return [];
    }
  })();
  const expiresIn = expiresAt === null
    ? 8 * 60 * 60
    : Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));
  const email = localStorage.getItem('wb.userEmail') ?? '';
  const displayName = (localStorage.getItem('wb.userDisplayName') ?? email) || null;
  const userId = typeof claims?.sub === 'string' ? claims.sub : 'authenticated-user';
  const isSuperAdmin = platformRole === 'SUPER_ADMIN';

  useAuthStore.getState().setSession({
    user: {
      id: userId,
      email,
      displayName,
      platformRole: isSuperAdmin ? 'SUPER_ADMIN' : 'TENANT',
      persona: isSuperAdmin ? null : 'TENANT',
      kind: 'STANDARD',
      status: 'ACTIVE',
      mfaEnabled: false,
      emailVerifiedAt: null,
      lastLoginAt: null,
    },
    accessToken: token,
    expiresIn,
    refreshTokenExpiresIn: expiresIn,
  });
  useAuthStore.getState().setPermissions(permissions);
}
