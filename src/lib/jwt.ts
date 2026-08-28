/**
 * Decode (NOT verify) a JWT's payload claims. Used only to read the active
 * org/region context the server already signed into the access token, so the
 * UI can rehydrate after a reload. Signature verification stays on the server —
 * the token is presented back to the API on every call.
 */
export interface AccessTokenClaims {
  sub?: string;
  org?: string | null;
  region?: string | null;
  platformRole?: string;
  [key: string]: unknown;
}

export function decodeJwtClaims(token: string): AccessTokenClaims | null {
  try {
    const payload = token.split('.')[1];
    if (payload === undefined || payload.length === 0) {
      return null;
    }
    // base64url → base64, then decode.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return null;
  }
}
