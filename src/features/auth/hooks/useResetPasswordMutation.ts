import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { authService } from '../api/auth.service';
import type {
  ResetPasswordRequest,
  PasswordResetMessageResponse,
} from '../schemas/password-reset.schema';
import type { ApiError } from '@lib/axios';

export function useResetPasswordMutation(): UseMutationResult<
  PasswordResetMessageResponse,
  ApiError,
  ResetPasswordRequest
> {
  return useMutation<PasswordResetMessageResponse, ApiError, ResetPasswordRequest>({
    mutationFn: (input) => authService.resetPassword(input),
  });
}
