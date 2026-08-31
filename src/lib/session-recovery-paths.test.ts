import { describe, expect, it } from 'vitest';
import { shouldRecoverSessionAfterUnauthorized } from './session-recovery-paths';

/**
 * Which 401s are allowed to clear the signed-in session.
 *
 * Getting this wrong is not a cosmetic bug: a path wrongly included here turns
 * an unrelated failure into a surprise logout, and on this product that can mean
 * an investigator losing their session mid-case.
 */
describe('session recovery after 401', () => {
  it('recovers the session for ordinary authenticated endpoints', () => {
    for (const path of [
      '/whistleblowing/cases',
      '/whistleblowing/cases/abc123',
      '/whistleblowing/dashboard/stats',
      '/organizations/org-1/members',
    ]) {
      expect(shouldRecoverSessionAfterUnauthorized(path)).toBe(true);
    }
  });

  it('never recovers on authentication and credential-submission endpoints', () => {
    // A mistyped verification code must not log the user out of an existing session.
    for (const path of [
      '/auth/login',
      '/auth/refresh',
      '/auth/mfa/verify',
      '/auth/password/reset',
      '/auth/email/verify-otp',
      '/invitations/accept',
    ]) {
      expect(shouldRecoverSessionAfterUnauthorized(path)).toBe(false);
    }
  });

  describe('reporter portal', () => {
    it('never drives staff session recovery', () => {
      // The reporter portal is a separate, case-scoped session. Treating its
      // expiry as a staff-session expiry would let an expired reporter token in
      // one tab sign an investigator out of another.
      for (const path of [
        '/whistleblowing/portal/me',
        '/whistleblowing/portal/me/comments',
        '/whistleblowing/portal/me/attachments',
        '/whistleblowing/portal/me/data-export',
        '/whistleblowing/portal/login',
      ]) {
        expect(shouldRecoverSessionAfterUnauthorized(path)).toBe(false);
      }
    });

    it('ignores query strings when matching', () => {
      expect(
        shouldRecoverSessionAfterUnauthorized('/whistleblowing/portal/me/comments?page=1&pageSize=20'),
      ).toBe(false);
    });

    it('does not accidentally exclude the internal case routes', () => {
      // `/whistleblowing/cases` must stay recoverable — only `/portal` is special.
      expect(shouldRecoverSessionAfterUnauthorized('/whistleblowing/cases?page=1')).toBe(true);
    });
  });
});
