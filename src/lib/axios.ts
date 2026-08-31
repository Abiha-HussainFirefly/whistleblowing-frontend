import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@config/env';
import { HTTP_STATUS } from '@config/constants';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';
import { API_SUCCESS_MESSAGE, localizeApiMessage } from '@lib/api-message';
import { shouldRecoverSessionAfterUnauthorized } from '@lib/session-recovery-paths';
import { notifyMutationError } from '@lib/super-admin-api-feedback';
import { clearAccessToken, getAccessToken, setAccessToken } from '@lib/auth-token';

/**
 * Hardened Axios instance for the Tellara backend.
 *
 * AUTH MODEL (current):
 *   - The access token is short-lived and held in memory only (`lib/auth-token`).
 *     It is attached as `Authorization: Bearer` on each request.
 *   - The refresh token is an HttpOnly, Secure, SameSite=Lax cookie scoped to
 *     `/api/v1/auth`. JavaScript cannot read it, so it cannot be exfiltrated by
 *     an injected script, and it is only sent to the endpoints that need it.
 *   - `withCredentials` is on so that cookie reaches `/auth/refresh` and
 *     `/auth/logout`.
 *
 * CSRF: the cookie is `SameSite=Lax` and is scoped to the auth path, and every
 * state-changing request is authorized by the Authorization header rather than by
 * the cookie. A cross-site form post therefore carries no usable credential. The
 * double-submit header below is sent when the server sets an `XSRF-TOKEN` cookie,
 * as defence in depth rather than as the primary control.
 *
 * Tokens are never logged, and no case identifier is ever put in a URL.
 */

function toError(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === 'string' ? reason : 'Unknown request error');
}

/**
 * Resolve the active UI language for the `x-lang` header so the backend
 * localizes responses, validation messages and emails to match the user. Kept
 * dependency-free to avoid an import cycle with the i18n bootstrap.
 */
function activeLanguage(): string {
  const fromDoc = typeof document !== 'undefined' ? document.documentElement.lang : '';
  const fromStore =
    typeof localStorage !== 'undefined' ? localStorage.getItem('tellara.lang') : null;
  const raw = (fromDoc.length > 0 ? fromDoc : (fromStore ?? 'en')).toLowerCase();
  const base = raw.split('-')[0];
  return base !== undefined && base.length > 0 ? base : 'en';
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) return decodeURIComponent(value.slice(prefix.length));
  }
  return null;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  // Required so the HttpOnly refresh cookie reaches /auth/refresh and /auth/logout.
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token !== null && token.length > 0 && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    const { activeRegion } = useAuthStore.getState();
    if (activeRegion !== null && activeRegion.length > 0) {
      config.headers.set('X-Region', activeRegion);
    }

    const method = (config.method ?? 'get').toLowerCase();
    if (new Set(['post', 'put', 'patch', 'delete']).has(method)) {
      const csrf = readCookie('XSRF-TOKEN');
      if (csrf !== null) config.headers.set('X-CSRF-Token', csrf);
    }

    config.headers.set('x-lang', activeLanguage());
    return config;
  },
  (error: unknown) => Promise.reject(toError(error)),
);

/**
 * A single in-flight refresh shared by all concurrent 401s.
 *
 * This is not an optimization. The refresh token rotates on every use and the
 * server treats a second presentation of an already-rotated token as theft,
 * revoking the whole session family. Firing N parallel refreshes would make all
 * but the first look exactly like an attack and log the user out. Serializing
 * guarantees exactly one rotation per expiry.
 */
let refreshInFlight: Promise<string | null> | null = null;

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

/** Exchanges the HttpOnly refresh cookie for a new access token. */
async function refreshAccessToken(): Promise<string | null> {
  try {
    // A bare axios call, not `apiClient`, so a 401 here cannot recurse through
    // this same interceptor.
    const { data } = await axios.post<RefreshResponse>(
      `${env.apiBaseUrl}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      },
    );
    setAccessToken(data.accessToken, data.expiresIn);
    return data.accessToken;
  } catch {
    return null;
  }
}

/** Called once at startup to restore a session from the refresh cookie. */
export async function restoreSession(): Promise<string | null> {
  refreshInFlight ??= refreshAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
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
  if (headers === null || typeof headers !== 'object') return null;
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

// The production Axios instance always exposes response interceptors. The guard
// keeps isolated component tests compatible with their deliberately minimal
// Axios mock without changing runtime behavior.
if (apiClient.interceptors.response !== undefined)
  apiClient.interceptors.response.use(
    (response) => {
      const encoded = successHeaderValue(response.headers);
      const url = response.config.url ?? '';
      const skipToast = url.includes('skipSuccessToast=true');

      if (encoded !== null && !skipToast) {
        const message = decodeHeaderMessage(encoded).trim();
        if (message.length > 0) toast.success(localizeApiMessage(message), { source: 'api' });
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

      // On 401, try one silent refresh and replay. Auth and public invitation
      // endpoints are excluded so their own validation failures never loop or
      // clear an unrelated active session.
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
        // Refresh failed — expired, revoked, or reuse was detected server-side.
        clearAccessToken();
        useAuthStore.getState().clear();
      } else if (status === HTTP_STATUS.UNAUTHORIZED && shouldRecoverSession) {
        clearAccessToken();
        useAuthStore.getState().clear();
      }

      notifyMutationError(error, original?.method);
      return Promise.reject(error);
    },
  );

/** Backend error envelope (kept in sync with `src/types/api.ts`). */
export type ApiError = AxiosError<{ message?: string; code?: string; requestId?: string }>;
