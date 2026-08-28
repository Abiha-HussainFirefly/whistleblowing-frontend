import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@features/auth';
import { useAuthStore } from '@store/authStore';
import type { MeResponse } from '@/types/auth';

const ME_QUERY_KEY = ['auth', 'me'] as const;
const STALE_MS = 60_000; // /me data considered fresh for 1 minute
const REFETCH_INTERVAL_MS = 5 * 60_000; // background refetch every 5 minutes
const REFETCH_INTERVAL_BG_MS = false as const; // only when tab is visible

/**
 * Keeps the in-memory auth store in lockstep with the server's view of
 * the current user — their permissions, accessible regions, scope, and
 * org list.
 *
 * Why this matters:
 *   - Permissions are captured at `switch-context` time and otherwise
 *     never refresh. If an org admin grants or revokes a role while the
 *     user is logged in, their UI would stay stale until the next manual
 *     re-login — modules they should suddenly have access to stay
 *     locked, modules they were just removed from stay clickable.
 *   - The cache key includes an in-memory authorization-context version, so a
 *     token rotation that changes scope always triggers a fresh `/auth/me`.
 *
 * Behavior:
 *   - Disabled when not authenticated — won't fire from public pages.
 *   - Refetches on window focus so admins changing your roles in
 *     another tab take effect when you return.
 *   - Polls every 5 minutes as a heartbeat. The interval pauses when
 *     the tab is in the background to avoid useless work.
 *   - Each successful fetch atomically restores the authorization context, so
 *     every existing consumer (sidebar, dashboard tiles, region switcher)
 *     re-renders without further plumbing.
 */
export function useSessionSync(): void {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const authorizationContextVersion = useAuthStore((s) => s.authorizationContextVersion);
  const applyAuthorizationContext = useAuthStore((s) => s.applyAuthorizationContext);

  const { data } = useQuery<MeResponse>({
    queryKey: [...ME_QUERY_KEY, authorizationContextVersion],
    queryFn: () => authService.me(),
    // Don't hammer /me from the login screen — only when we have a token.
    enabled: isInitialized && isAuthenticated && accessToken !== null,
    staleTime: STALE_MS,
    refetchOnWindowFocus: true,
    refetchInterval: REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: REFETCH_INTERVAL_BG_MS,
    // Failed /me usually means the token went bad. Don't spam retries —
    // the 401 interceptor in axios will clear the session and route
    // guards will push the user to /auth/login.
    retry: false,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    applyAuthorizationContext(data);
  }, [data, applyAuthorizationContext]);
}

export const SESSION_QUERY_KEY = ME_QUERY_KEY;
