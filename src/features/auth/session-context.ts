import { useAuthStore, type AuthenticatedContext } from '@store/authStore';
import type { AuthSessionPayload, MeResponse } from '@/types/auth';

/**
 * Commits a newly authenticated session only after its server-authoritative
 * authorization context is available. Keeping this as one store transition
 * prevents route guards from evaluating partial permissions during navigation.
 */
export function applyAuthenticatedContext(
  payload: AuthSessionPayload,
  me: MeResponse,
  context: AuthenticatedContext,
): boolean {
  return useAuthStore.getState().applyAuthenticatedContext(payload, me, context);
}
