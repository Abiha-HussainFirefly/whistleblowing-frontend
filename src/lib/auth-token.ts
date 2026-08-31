/**
 * The access token lives in memory, and only in memory.
 *
 * It used to be written to `localStorage`, which meant any script that ever ran
 * on the page — an injected dependency, a reflected payload, a compromised CDN —
 * could read a bearer token for a whistleblowing case system and use it from
 * anywhere. A module-scoped variable is not readable that way: an attacker must
 * already be executing in the page to reach it, and the token dies with the tab.
 *
 * Reloads survive through the refresh token instead, which the server keeps in an
 * HttpOnly cookie that JavaScript cannot read at all. On load, `restoreSession`
 * exchanges it for a fresh access token.
 *
 * The tab-close cost is deliberate. Any storage a script can read is storage an
 * injected script can exfiltrate, so there is no version of "remember me in
 * localStorage" that is safe for this product.
 */

let accessToken: string | null = null;
let accessTokenExpiresAt: number | null = null;

/** Notified on sign-out so open tabs can react. */
type Listener = () => void;
const listeners = new Set<Listener>();

export function setAccessToken(token: string, expiresInSeconds?: number): void {
  accessToken = token;
  accessTokenExpiresAt =
    expiresInSeconds === undefined ? null : Date.now() + expiresInSeconds * 1000;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function hasAccessToken(): boolean {
  return accessToken !== null && accessToken.length > 0;
}

/** True when the token is absent or within `skewSeconds` of expiry. */
export function isAccessTokenExpiring(skewSeconds = 60): boolean {
  if (accessToken === null) return true;
  if (accessTokenExpiresAt === null) return false;
  return accessTokenExpiresAt - Date.now() <= skewSeconds * 1000;
}

export function clearAccessToken(): void {
  accessToken = null;
  accessTokenExpiresAt = null;
  for (const listener of listeners) listener();
}

export function onAccessTokenCleared(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Removes the pre-migration token and the cached authorization data that used to
 * sit beside it.
 *
 * Permissions in particular must not be read from browser storage any more: they
 * are a security-relevant value that the user can edit in devtools, and they go
 * stale the moment an administrator changes a role. `/auth/me` is the source of
 * truth. Only display-level values are still cached, and only to avoid a flash of
 * empty chrome before the first `/auth/me` resolves.
 */
export function purgeLegacyTokenStorage(): void {
  if (typeof localStorage === 'undefined') return;
  for (const key of ['wb.internalToken', 'wb.permissions', 'tellara.session.v1']) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable (private mode). Nothing to purge.
    }
  }
}
