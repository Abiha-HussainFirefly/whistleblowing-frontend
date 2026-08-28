const SESSION_INDEPENDENT_PATHS = new Set([
  '/auth/refresh',
  '/auth/login',
  '/auth/logout',
  '/auth/org/login',
  '/auth/admin/login',
  '/auth/email/verify-otp',
  '/auth/email/resend-otp',
  '/auth/mfa/verify',
  '/auth/mfa/recovery',
  '/auth/mfa/enroll/verify',
  '/auth/mfa/disable',
  '/auth/password/forgot',
  '/auth/password/reset',
  '/invitations/preview',
  '/invitations/accept',
]);

function pathWithoutQuery(url: string): string {
  const queryIndex = url.search(/[?#]/);
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

/**
 * Public, authentication, verification, and credential-submission endpoints
 * report their own 401 errors (e.g. invalid OTP code or wrong MFA token).
 * Retrying or clearing the current user session for those responses would turn
 * a simple mistyped verification code into an unrelated logout.
 */
export function shouldRecoverSessionAfterUnauthorized(url: string): boolean {
  const path = pathWithoutQuery(url);
  if (SESSION_INDEPENDENT_PATHS.has(path)) {
    return false;
  }
  // Exclude all authentication, verification, MFA, and invitation endpoints
  if (path.includes('/auth/') || path.includes('/invitations/')) {
    return false;
  }
  return true;
}
