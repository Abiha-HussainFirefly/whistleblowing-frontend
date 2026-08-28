import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { authService } from '../api/auth.service';
import type { LoginRequest, LoginResponse } from '../schemas/login.schema';
import type { ApiError } from '@lib/axios';

/**
 * TanStack Query mutation for `POST /auth/login`.
 *
 * Side effects (storing tokens, navigating, role-gating) are intentionally
 * left to the calling component so the same mutation can be reused by the
 * tenant login, admin login, and any future flows without each path
 * dragging in policy decisions that don't apply to it.
 */
export function useLoginMutation(): UseMutationResult<LoginResponse, ApiError, LoginRequest> {
  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: (input) => authService.login(input),
  });
}
