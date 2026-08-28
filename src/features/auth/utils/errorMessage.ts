import { isAxiosError } from 'axios';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '@config/constants';
import { extractApiErrorMessage } from '@lib/api-error';
import i18n from '@/i18n';

const AUTH_SERVER_MESSAGE_KEYS = new Map<string, string>([
  ['errors.auth.invalidCredentials', 'auth:errors.invalidCredentials'],
  ['errors.auth.accountLocked', 'auth:errors.accountLocked'],
  ['errors.auth.accountNotActive', 'auth:errors.accountNotActive'],
  ['errors.auth.adminPortalRequired', 'auth:errors.adminPortalRequired'],
  ['errors.auth.orgPortalRequired', 'auth:errors.orgPortalRequired'],
  ['errors.auth.activeRoleRequired', 'auth:errors.activeRoleRequired'],
  ['errors.auth.orgAdminOnly', 'auth:errors.orgAdminOnly'],
  ['errors.auth.tenantRoleRequired', 'auth:errors.tenantRoleRequired'],
  ['errors.auth.organizationNotActive', 'auth:errors.organizationNotActive'],
  ['errors.auth.systemAdminOnly', 'auth:errors.systemAdminOnly'],
  ['errors.auth.emailNotVerified', 'auth:errors.emailNotVerified'],
  ['errors.auth.sessionExpired', 'auth:errors.sessionExpired'],
  ['errors.auth.tokenRevoked', 'auth:errors.sessionExpired'],
  ['errors.auth.passwordResetInvalid', 'auth:errors.passwordResetInvalid'],
  ['errors.auth.passwordMustBeDifferent', 'auth:errors.passwordMustBeDifferent'],
  ['errors.auth.invalidCurrentPassword', 'auth:errors.invalidCurrentPassword'],
  ['errors.auth.invalidVerificationCode', 'auth:errors.invalidVerificationCode'],
  ['errors.auth.emailVerificationUnavailable', 'auth:errors.verificationUnavailable'],
  ['errors.auth.verificationSessionInvalid', 'auth:errors.verificationUnavailable'],
  ['errors.auth.verificationSessionExpired', 'auth:errors.verificationUnavailable'],
  ['errors.auth.tooManyVerificationAttempts', 'auth:errors.tooManyVerificationAttempts'],
  ['errors.auth.tooManyVerificationEmails', 'auth:errors.tooManyVerificationEmails'],
  ['invalid email or password.', 'auth:errors.invalidCredentials'],
  ['invalid credentials.', 'auth:errors.invalidCredentials'],
]);

function translateAuthServerMessage(message: string): string {
  const trimmed = message.trim();
  const normalized =
    trimmed.length > 0 ? `${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}` : trimmed;
  const key = AUTH_SERVER_MESSAGE_KEYS.get(normalized) ?? AUTH_SERVER_MESSAGE_KEYS.get(trimmed);
  return key !== undefined ? i18n.t(key) : message;
}

/**
 * Translate an arbitrary error from the auth flow into a user-facing message.
 *
 * Rules of the road:
 *  - 401: prefer the backend's localized generic auth message.
 *  - 429: tell the user to slow down, not the exact backoff (the header may not be set).
 *  - 403: surface the backend's `message` if present (likely "Account disabled" or similar).
 *  - 5xx: generic.
 *  - ZodError: a response shape regression. Treated as a 500-class incident.
 *  - Anything else: the backend `message`, falling back to a generic copy.
 */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return i18n.t('errors:badResponse');
  }

  if (!isAxiosError(error)) {
    return i18n.t('errors:generic');
  }

  const status = error.response?.status;
  const serverMessage = extractApiErrorMessage(error.response?.data);
  if (serverMessage !== null) {
    return translateAuthServerMessage(serverMessage);
  }

  if (status === HTTP_STATUS.UNAUTHORIZED) {
    return i18n.t('auth:errors.invalidCredentials');
  }
  if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return i18n.t('errors:tooManyRequests');
  }
  if (status === HTTP_STATUS.FORBIDDEN) {
    return i18n.t('auth:errors.forbidden');
  }
  if (typeof status === 'number' && status >= 500) {
    return i18n.t('errors:serverError');
  }
  if (status === undefined && error.code === 'ECONNABORTED') {
    return i18n.t('errors:timeout');
  }
  if (status === undefined) {
    return i18n.t('errors:network');
  }

  return i18n.t('auth:errors.genericFailure');
}

/**
 * Translate a password-reset error (request or confirm step) into a
 * user-facing message.
 *
 *  - 400: surface the backend `message` (invalid/expired token, reused
 *    password) — these are safe, non-enumerating messages.
 *  - 429: throttled.
 *  - 5xx / network: generic.
 *
 * Note: the forgot step returns 200 even for unknown emails, so a 4xx here
 * only ever means a malformed request, not "email not found".
 */
export function passwordResetErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return i18n.t('errors:badResponse');
  }

  if (!isAxiosError(error)) {
    return i18n.t('errors:generic');
  }

  const status = error.response?.status;
  const serverMessage = extractApiErrorMessage(error.response?.data);
  if (serverMessage !== null) {
    return translateAuthServerMessage(serverMessage);
  }

  if (status === HTTP_STATUS.BAD_REQUEST) {
    return i18n.t('auth:errors.passwordResetInvalid');
  }
  if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return i18n.t('errors:tooManyRequests');
  }
  if (typeof status === 'number' && status >= 500) {
    return i18n.t('errors:serverError');
  }
  if (status === undefined && error.code === 'ECONNABORTED') {
    return i18n.t('errors:timeout');
  }
  if (status === undefined) {
    return i18n.t('errors:network');
  }

  return i18n.t('errors:generic');
}

/**
 * Translate an OTP verification error into a user-facing message.
 */
export function verificationErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return i18n.t('errors:badResponse');
  }

  if (!isAxiosError(error)) {
    return i18n.t('errors:generic');
  }

  const status = error.response?.status;
  const serverMessage = extractApiErrorMessage(error.response?.data);
  if (serverMessage !== null) {
    return translateAuthServerMessage(serverMessage);
  }

  if (status === HTTP_STATUS.UNAUTHORIZED) {
    return i18n.t('auth:errors.invalidVerificationCode', {
      defaultValue: 'Invalid or expired verification code.',
    });
  }
  if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
    return i18n.t('errors:tooManyRequests');
  }
  if (status === HTTP_STATUS.BAD_REQUEST) {
    return i18n.t('auth:errors.invalidRequest');
  }
  if (status === HTTP_STATUS.FORBIDDEN) {
    return i18n.t('auth:errors.verificationUnavailable');
  }
  if (typeof status === 'number' && status >= 500) {
    return i18n.t('errors:serverError');
  }
  if (status === undefined && error.code === 'ECONNABORTED') {
    return i18n.t('errors:timeout');
  }
  if (status === undefined) {
    return i18n.t('errors:network');
  }

  return i18n.t('errors:generic');
}
