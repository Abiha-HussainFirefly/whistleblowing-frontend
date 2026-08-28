export const APP_NAME = 'Civorah';
export const APP_TAGLINE = 'Legal Operations Platform';

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
});

export const QUERY_DEFAULTS = Object.freeze({
  STALE_TIME_MS: 60_000,
  GC_TIME_MS: 5 * 60_000,
  RETRY: 1,
});

export const STORAGE_KEYS = Object.freeze({
  THEME: 'atlyis.theme',
  LOCALE: 'atlyis.locale',
  /** Namespace prefix for auto-saved, half-finished form drafts. */
  DRAFT_PREFIX: 'atlyis.draft.',
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
});
