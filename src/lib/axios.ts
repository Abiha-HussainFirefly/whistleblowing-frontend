import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@config/env';
import { HTTP_STATUS } from '@config/constants';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';
import { API_SUCCESS_MESSAGE, localizeApiMessage } from '@lib/api-message';
import { loadSession } from '@lib/session-storage';
import { shouldRecoverSessionAfterUnauthorized } from '@lib/session-recovery-paths';
import { notifyMutationError } from '@lib/super-admin-api-feedback';
import type { AuthSessionPayload } from '@/types/auth';
import { csrfHeaders, readCookie } from '@lib/csrf';

/**
 * Hardened Axios instance for the Civorah backend.
 *
 * AUTH MODE (INTERIM): Bearer tokens in body.
 * The backend currently returns access + refresh tokens in `/auth/login`'s
 * JSON body. We attach `Authorization: Bearer <access>` to every outgoing
 * request via the request interceptor below, reading the token from
 * `useAuthStore`. CSRF protection is intrinsic to Bearer auth (no
 * cookie-borne credentials, so no CSRF surface).
 *
 * MIGRATION TO COOKIES (planned): when the backend ships HttpOnly+Secure
 * auth cookies, we will:
 *   - set `withCredentials: true`
 *   - delete the Authorization-header attachment block
 *   - re-enable the CSRF double-submit block kept below as commented code
 *
 * Other choices kept regardless of mode:
 *   - Tokens are never logged. Avoid putting sensitive data in URLs.
 *   - On 401 we clear the auth store so route guards bounce to /auth/login.
 */

function toError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason;
  }
  return new Error(typeof reason === 'string' ? reason : 'Unknown request error');
}

/**
 * Resolve the active UI language (short code) for the `x-lang` request header,
 * so the backend localizes responses/validation/emails to match the user. Reads
 * the document's lang (kept in sync by i18n) and falls back to the persisted
 * preference, then English. Kept dependency-free to avoid an import cycle with
 * the i18n bootstrap.
 */
function activeLanguage(): string {
  const fromDoc = typeof document !== 'undefined' ? document.documentElement.lang : '';
  const fromStore =
    typeof localStorage !== 'undefined' ? localStorage.getItem('civorah.lang') : null;
  const raw = (fromDoc.length > 0 ? fromDoc : (fromStore ?? 'en')).toLowerCase();
  const base = raw.split('-')[0];
  return base !== undefined && base.length > 0 ? base : 'en';
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  // Set to `true` when the backend migrates to HttpOnly cookies.
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken, activeRegion } = useAuthStore.getState();
    const storedToken = typeof localStorage !== 'undefined'
      ? localStorage.getItem('wb.internalToken')
      : null;
    const bearerToken = accessToken !== null && accessToken.length > 0 ? accessToken : storedToken;
    if (bearerToken !== null && bearerToken.length > 0 && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${bearerToken}`);
    }
    if (activeRegion !== null && activeRegion.length > 0) {
      config.headers.set('X-Region', activeRegion);
    }
    const method = (config.method ?? 'get').toLowerCase();
    if (new Set(['post', 'put', 'patch', 'delete']).has(method)) {
      const csrf = readCookie('XSRF-TOKEN');
      if (csrf !== null) {config.headers.set('X-CSRF-Token', csrf);}
    }
    // Tell the backend which language to localize responses/errors/emails in.
    config.headers.set('x-lang', activeLanguage());

    /*
     * CSRF double-submit (cookie-based auth path). Disabled in Bearer mode
     * because no cookie credentials cross origins. Restore this block as-is
     * when migrating to HttpOnly cookies.
     *
     * const method = (config.method ?? 'get').toLowerCase();
     * if (UNSAFE_METHODS.has(method)) {
     *   const csrf = readCookie('XSRF-TOKEN');
     *   if (csrf !== null && csrf.length > 0) {
     *     config.headers.set('X-CSRF-Token', csrf);
     *   }
     * }
     */

    return config;
  },
  (error: unknown) => Promise.reject(toError(error)),
);

/**
 * Single in-flight refresh shared across all concurrent 401s. Critical: the
 * refresh token rotates on use, so firing N parallel refreshes would make all
 * but the first present a stale token → the backend's reuse-detection revokes
 * the whole family and logs the user out. Serializing guarantees exactly one
 * rotation per expiry.
 */
let refreshInFlight: Promise<string | null> | null = null;

/** Exchange the stored refresh token for a fresh access token. Uses a bare
 *  axios call (not `apiClient`) to avoid recursing through this interceptor. */
async function refreshAccessToken(): Promise<string | null> {
  const persisted = loadSession();
  if (persisted === null || persisted.refreshTokenExpiresAt <= Date.now()) {
    return null;
  }
  try {
    const { data } = await axios.post<AuthSessionPayload>(
      `${env.apiBaseUrl}/auth/refresh`,
      persisted.legacyRefreshToken === undefined
        ? {}
        : { refreshToken: persisted.legacyRefreshToken },
      {
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...csrfHeaders(),
        },
      },
    );
    // Persist the rotated token. The auth store keeps authorization ready only
    // when the JWT still matches the active organization and region.
    useAuthStore.getState().setTokens(data);
    return data.accessToken;
  } catch {
    return null;
  }
}

interface HeaderMapWithGetter {
  get(name: string): unknown;
}

interface SuccessHeaderRecord {
  'x-success-message'?: unknown;
  'X-Success-Message'?: unknown;
}

function hasHeaderGetter(headers: object): headers is HeaderMapWithGetter {
  return typeof (headers as { get?: unknown }).get === 'function';
}

function successHeaderValue(headers: unknown): string | null {
  if (headers === null || typeof headers !== 'object') {
    return null;
  }
  if (hasHeaderGetter(headers)) {
    const value = headers.get(API_SUCCESS_MESSAGE);
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
  const direct =
    (headers as SuccessHeaderRecord)['x-success-message'] ??
    (headers as SuccessHeaderRecord)['X-Success-Message'];
  return typeof direct === 'string' && direct.length > 0 ? direct : null;
}

function decodeHeaderMessage(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// The production Axios instance always exposes response interceptors. The
// guard keeps isolated component tests compatible with their deliberately
// minimal Axios mock without changing runtime behavior.
if (apiClient.interceptors.response !== undefined) apiClient.interceptors.response.use(
  (response) => {
    const encoded = successHeaderValue(response.headers);
    const url = response.config.url ?? '';
    const skipToast = url.includes('skipSuccessToast=true');

    if (encoded !== null && !skipToast) {
      const message = decodeHeaderMessage(encoded).trim();
      if (message.length > 0) {
        toast.success(localizeApiMessage(message), { source: 'api' });
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const url = original?.url ?? '';
    const shouldRecoverSession = shouldRecoverSessionAfterUnauthorized(url);

    // On 401, try a single silent refresh + retry before giving up. Auth
    // and public invitation endpoints are excluded so their own validation
    // failures never loop or clear an unrelated active session.
    if (
      status === HTTP_STATUS.UNAUTHORIZED &&
      original !== undefined &&
      original._retry !== true &&
      shouldRecoverSession
    ) {
      original._retry = true;
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      const newToken = await refreshInFlight;
      if (newToken !== null) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return apiClient(original);
      }
      // Refresh failed — token expired, revoked, or session timed out.
      useAuthStore.getState().clear();
    } else if (status === HTTP_STATUS.UNAUTHORIZED && shouldRecoverSession) {
      useAuthStore.getState().clear();
    }

    notifyMutationError(error, original?.method);
    return Promise.reject(error);
  },
);

/** Backend error envelope (kept in sync with `src/types/api.ts`). */
export type ApiError = AxiosError<{ message?: string; code?: string }>;
