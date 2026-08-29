/**
 * Durable session persistence (interim Bearer-token mode).
 *
 * Only the OPAQUE refresh token is persisted (never the access token — that
 * stays in memory and is re-minted via `/auth/refresh` on load). The refresh
 * token rotates on every use and the backend detects reuse, so a leaked stored
 * token is single-use and self-revoking. The durable fix is HttpOnly+Secure
 * cookies (planned); until then this is what lets a session survive a reload.
 *
 * Everything else (user, active org/region, permissions) is reconstructed on
 * load from the refreshed access-token claims + `/auth/me`, so nothing
 * security- or context-sensitive is cached here and it can never desync.
 */

const STORAGE_KEY = 'tellara.session.v1';

export interface PersistedSession {
  /** Epoch ms when the refresh token expires. */
  refreshTokenExpiresAt: number;
  /** Read only during the one-time migration from localStorage to HttpOnly cookies. */
  legacyRefreshToken?: string;
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    if (
      typeof parsed.refreshTokenExpiresAt !== 'number'
    ) {
      return null;
    }
    const legacy = (parsed as { refreshToken?: unknown }).refreshToken;
    return {
      refreshTokenExpiresAt: parsed.refreshTokenExpiresAt,
      ...(typeof legacy === 'string' && legacy.length > 0
        ? { legacyRefreshToken: legacy }
        : {}),
    };
  } catch {
    return null;
  }
}

export function saveSession(session: PersistedSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable (private mode / quota) — session simply won't survive
    // a reload; not fatal.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
