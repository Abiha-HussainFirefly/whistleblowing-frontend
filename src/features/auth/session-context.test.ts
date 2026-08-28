import { afterEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@store/authStore';
import { applyAuthenticatedContext } from './session-context';
import type {
  AuthSessionPayload,
  AuthUser,
  MeResponse,
  OrgContextInfo,
} from '@/types/auth';

const user: AuthUser = {
  id: 'user-1',
  email: 'tenant-admin@example.com',
  displayName: 'Tenant Admin',
  platformRole: 'TENANT',
  kind: 'STANDARD',
  status: 'ACTIVE',
  mfaEnabled: false,
  emailVerifiedAt: '2026-07-14T00:00:00.000Z',
  lastLoginAt: null,
};

const payload: AuthSessionPayload = {
  user,
  accessToken: 'access-token',
  expiresIn: 900,
  refreshToken: 'refresh-token',
  refreshTokenExpiresIn: 86_400,
};

const organization: OrgContextInfo = {
  id: 'org-1',
  name: 'Example Organization',
  slug: 'example-organization',
};

const me: MeResponse = {
  user,
  permissions: ['contract:read'],
  activeRegion: 'PK-SIN',
  availableRegions: [
    {
      regionCode: 'PK-SIN',
      displayName: 'Sindh',
      roles: [{ id: 'role-1', name: 'Org admin' }],
    },
  ],
  availableOrganizations: [organization],
  scope: { isCrossRegion: false, regions: ['PK-SIN'] },
};

function accessTokenFor(claims: Record<string, string>): string {
  const encodedClaims = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${encodedClaims}.signature`;
}

afterEach(() => {
  useAuthStore.getState().clear();
});

describe('applyAuthenticatedContext', () => {
  it('keeps a new tenant session unauthorized until /auth/me context is applied', () => {
    useAuthStore.getState().setSession(payload);

    expect(useAuthStore.getState().isAuthorizationReady).toBe(false);

    applyAuthenticatedContext(payload, me, {
      activeOrganization: organization,
      activeRegion: 'PK-SIN',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthorizationReady).toBe(true);
    expect(state.permissions).toEqual(['contract:read']);
    expect(state.activeOrganization).toEqual(organization);
    expect(state.activeRegion).toBe('PK-SIN');
    expect(state.availableRegions).toEqual(me.availableRegions);
    expect(state.availableOrganizations).toEqual(me.availableOrganizations);
    expect(state.scope).toEqual(me.scope);
  });

  it('seeds tokens for a public auth flow without completing authentication', () => {
    useAuthStore.getState().seedSessionTokens(payload);

    const pendingState = useAuthStore.getState();
    expect(pendingState.accessToken).toBe(payload.accessToken);
    expect(pendingState.isAuthenticated).toBe(false);
    expect(pendingState.isAuthorizationReady).toBe(false);

    applyAuthenticatedContext(payload, me, {
      activeOrganization: organization,
      activeRegion: 'PK-SIN',
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isAuthorizationReady).toBe(true);
  });

  it('uses the authoritative /auth/me role when completing authentication', () => {
    const staleRolePayload: AuthSessionPayload = {
      ...payload,
      user: { ...user, platformRole: 'USER' },
    };
    useAuthStore.getState().seedSessionTokens(staleRolePayload);

    applyAuthenticatedContext(staleRolePayload, me, {
      activeOrganization: organization,
      activeRegion: 'PK-SIN',
    });

    const state = useAuthStore.getState();
    expect(state.user?.platformRole).toBe('TENANT');
    expect(state.isAuthenticated).toBe(true);
  });

  it('ignores a late context response belonging to an older session', () => {
    const previousUser: AuthUser = {
      ...user,
      id: 'previous-user',
      email: 'previous@example.com',
      platformRole: 'USER',
    };
    const previousPayload: AuthSessionPayload = {
      ...payload,
      user: previousUser,
      accessToken: 'previous-access-token',
      refreshToken: 'previous-refresh-token',
    };
    const previousMe: MeResponse = { ...me, user: previousUser };

    useAuthStore.getState().seedSessionTokens(payload);
    applyAuthenticatedContext(previousPayload, previousMe, {
      activeOrganization: null,
      activeRegion: null,
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe(payload.accessToken);
    expect(state.isAuthenticated).toBe(false);
    expect(state.isAuthorizationReady).toBe(false);
  });

  it('preserves a ready authorization context while rotating tokens', () => {
    useAuthStore.getState().seedSessionTokens(payload);
    applyAuthenticatedContext(payload, me, {
      activeOrganization: organization,
      activeRegion: 'PK-SIN',
    });

    useAuthStore.getState().setTokens({
      ...payload,
      accessToken: accessTokenFor({ org: 'org-1', region: 'PK-SIN' }),
      refreshToken: 'rotated-refresh-token',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthorizationReady).toBe(true);
    expect(state.permissions).toEqual(['contract:read']);
    expect(state.activeOrganization).toEqual(organization);
    expect(state.activeRegion).toBe('PK-SIN');
    expect(state.availableRegions).toEqual(me.availableRegions);
    expect(state.availableOrganizations).toEqual(me.availableOrganizations);
    expect(state.scope).toEqual(me.scope);
  });

  it('marks authorization unresolved when a rotation changes organization context', () => {
    useAuthStore.getState().seedSessionTokens(payload);
    applyAuthenticatedContext(payload, me, {
      activeOrganization: organization,
      activeRegion: 'PK-SIN',
    });

    useAuthStore.getState().setTokens({
      ...payload,
      accessToken: accessTokenFor({ org: 'org-2', region: 'PK-PUN' }),
      refreshToken: 'rotated-refresh-token',
    });

    expect(useAuthStore.getState().isAuthorizationReady).toBe(false);
  });

});
