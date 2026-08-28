import i18n from '@/i18n';
import { HTTP_STATUS } from '@config/constants';
import { API_SUCCESS_MESSAGE, localizeApiMessage } from '@lib/api-message';
import axios from 'axios';
import { ZodError } from 'zod';

/**
 * Shape of the backend error envelope produced by `HttpExceptionFilter`
 * (atlyis-backend/src/common/filters/http-exception.filter.ts):
 *
 *   { statusCode, message: string | string[], error, path, requestId, timestamp }
 *
 * `message` is a STRING for thrown HttpExceptions (e.g. BadRequestException),
 * and a STRING[] for class-validator failures (one entry per failed rule).
 */
interface BackendErrorBody {
  statusCode?: number;
  message?: unknown;
  error?: unknown;
  code?: unknown;
  details?: unknown;
}

interface BackendErrorDetail {
  field?: unknown;
  code?: unknown;
  message?: unknown;
}

/** HTTP statuses that have a friendly localized fallback copy. */
const LOCALIZED_STATUSES = new Set<number>([
  HTTP_STATUS.BAD_REQUEST,
  HTTP_STATUS.UNAUTHORIZED,
  HTTP_STATUS.FORBIDDEN,
  HTTP_STATUS.NOT_FOUND,
  HTTP_STATUS.CONFLICT,
  HTTP_STATUS.UNPROCESSABLE,
  HTTP_STATUS.TOO_MANY_REQUESTS,
]);

function capitalizeFirst(text: string): string {
  if (text.length === 0) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatFieldName(field: string): string {
  const last = field.split('.').pop() ?? field;
  return last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function extractDetailMessages(details: unknown): string[] {
  if (!Array.isArray(details)) {
    return [];
  }

  return details
    .map((item): string | null => {
      if (typeof item === 'string' && item.trim().length > 0) {
        return capitalizeFirst(item.trim());
      }
      if (item === null || typeof item !== 'object') {
        return null;
      }
      const detail = item as BackendErrorDetail;
      if (typeof detail.message !== 'string' || detail.message.trim().length === 0) {
        return null;
      }
      const message = capitalizeFirst(detail.message.trim());
      if (typeof detail.field !== 'string' || detail.field.trim().length === 0) {
        return message;
      }
      const label = formatFieldName(detail.field.trim());
      const normalized = message.toLowerCase();
      return normalized.startsWith(label.toLowerCase()) ? message : `${label}: ${message}`;
    })
    .filter((item): item is string => item !== null);
}

/**
 * Pull a clean, user-facing message out of the backend error envelope.
 * Returns null when there is no usable server-provided message (the caller
 * then falls back to a status-based message).
 */
export function extractApiErrorMessage(data: unknown): string | null {
  if (data === null || typeof data !== 'object') {
    return null;
  }

  const body = data as BackendErrorBody;
  const detailMessages = extractDetailMessages(body.details);
  if (detailMessages.length > 0) {
    return detailMessages.slice(0, 4).join('. ');
  }

  const message = body.message;

  if (typeof message === 'string' && message.trim().length > 0) {
    return capitalizeFirst(message.trim());
  }

  if (Array.isArray(message)) {
    const parts = message
      .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
      .map((m) => capitalizeFirst(m.trim()));
    if (parts.length > 0) {
      // Join the per-field validation messages into one readable sentence.
      return parts.join('. ');
    }
  }

  return null;
}

/**
 * Translate ANY thrown value (axios error, Zod error, plain Error, unknown)
 * into a single, user-friendly string suitable for display in the UI.
 *
 * Priority:
 *   1. The backend's own `message` (string or class-validator string[]).
 *   2. A friendly per-status fallback.
 *   3. A network/timeout message when no response was received.
 *   4. The caller-supplied `fallback`.
 *
 * Never returns raw axios noise like "Request failed with status code 400".
 */
export function getApiErrorMessage(error: unknown, fallback?: string): string {
  const t = i18n.t.bind(i18n);
  const generic = fallback ?? t('errors.generic');

  // A Zod failure means the RESPONSE didn't match our schema — a contract
  // regression, not user error.
  if (error instanceof ZodError) {
    return t('errors.badResponse');
  }

  if (!axios.isAxiosError(error)) {
    return generic;
  }

  // No response received → connection/timeout problem.
  if (error.response === undefined) {
    return error.code === 'ECONNABORTED' ? t('errors.timeout') : t('errors.network');
  }

  const serverMessage = extractApiErrorMessage(error.response.data);
  if (serverMessage !== null) {
    return localizeApiMessage(serverMessage);
  }

  const status = error.response.status;
  if (LOCALIZED_STATUSES.has(status)) {
    return t(`errors.status.${String(status)}`);
  }
  if (status >= 500) {
    return t('errors.status.500');
  }

  return generic;
}

/**
 * Pull a success `message` out of an API response, when the backend provides
 * one. Today most endpoints return the bare record (no message) and this
 * returns null, so callers fall back to a short action label; once the backend
 * adds `message` to its success envelope, the exact server text shows instead.
 * Accepts either the unwrapped data or a `{ message, data }` envelope.
 */
export function getApiSuccessMessage(payload: unknown): string | null {
  if (payload === null || typeof payload !== 'object') {
    return null;
  }
  const descriptor = Object.getOwnPropertyDescriptor(payload, API_SUCCESS_MESSAGE);
  const headerMessage: unknown = descriptor?.value;
  if (typeof headerMessage === 'string' && headerMessage.trim().length > 0) {
    return localizeApiMessage(headerMessage);
  }
  const message = (payload as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim().length > 0) {
    return localizeApiMessage(message);
  }
  return null;
}
