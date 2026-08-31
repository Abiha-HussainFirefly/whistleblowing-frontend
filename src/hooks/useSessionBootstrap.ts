import { useEffect, useState } from 'react';
import { restoreSession } from '@lib/axios';
import { authService } from '@features/auth';
import { useAuthStore } from '@store/authStore';
import { getAccessToken, purgeLegacyTokenStorage, setAccessToken } from '@lib/auth-token';

/**
 * Restores a session on page load.
 *
 * The access token lives in memory, so a reload starts with nothing. The refresh
 * token is an HttpOnly cookie the browser still holds, so the sequence is:
 *
 *   1. Exchange the cookie for a fresh access token (`/auth/refresh`).
 *   2. Fetch the authorization context (`/auth/me`).
 *
 * Route guards must wait for this to settle, otherwise every reload would bounce
 * an authenticated user to the login screen before the refresh had a chance to
 * complete.
 *
 * Failure is not an error state: an expired or absent cookie simply means "not
 * signed in", which is the normal case for a visitor reaching the public
 * reporting portal.
 */
export function useSessionBootstrap(): { isReady: boolean } {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      // Clear anything left by the pre-migration build, which kept a bearer token
      // and a cached permission list in localStorage.
      purgeLegacyTokenStorage();

      try {
        const token = await restoreSession();
        if (cancelled) return;

        if (token !== null) {
          const me = await authService.me();
          if (cancelled) return;
          useAuthStore.getState().applyAuthorizationContext(me);
        }
      } catch {
        // No usable session. Guards will route to the login screen.
      } finally {
        if (!cancelled) {
          useAuthStore.getState().setInitialized();
          setIsReady(true);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isReady };
}

/** Re-exported so callers can seed the token after an interactive sign-in. */
export { getAccessToken, setAccessToken };
