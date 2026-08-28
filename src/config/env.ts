import { z } from 'zod';

const booleanLike = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .default('false');

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('Civorah'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  // Absolute http(s) URL (e.g. https://api.example.com/api/v1) OR a same-origin
  // path (e.g. /api/v1) when the dev server proxies /api to the backend.
  VITE_API_BASE_URL: z.string().default('http://localhost:3001/api/v1').refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), {
    message: 'Must be an absolute http(s) URL or a path starting with "/"',
  }),
  VITE_API_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  VITE_AUTH_STORAGE_KEY: z.string().min(1).default('atlyis.auth'),
  VITE_TOKEN_REFRESH_THRESHOLD_SECONDS: z.coerce.number().int().positive().default(60),
  VITE_ENABLE_DEVTOOLS: booleanLike,
  VITE_ENABLE_ANALYTICS: booleanLike,
  VITE_SENTRY_DSN: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  // Fail fast — a misconfigured frontend is a security risk.
  console.error('[env] Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. See console for details.');
}

export const env = Object.freeze({
  appName: parsed.data.VITE_APP_NAME,
  appEnv: parsed.data.VITE_APP_ENV,
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  apiTimeoutMs: parsed.data.VITE_API_TIMEOUT_MS,
  authStorageKey: parsed.data.VITE_AUTH_STORAGE_KEY,
  tokenRefreshThresholdSeconds: parsed.data.VITE_TOKEN_REFRESH_THRESHOLD_SECONDS,
  enableDevtools: parsed.data.VITE_ENABLE_DEVTOOLS,
  enableAnalytics: parsed.data.VITE_ENABLE_ANALYTICS,
  sentryDsn: parsed.data.VITE_SENTRY_DSN,
  isProduction: parsed.data.VITE_APP_ENV === 'production',
  isDevelopment: parsed.data.VITE_APP_ENV === 'development',
});

export type Env = typeof env;
