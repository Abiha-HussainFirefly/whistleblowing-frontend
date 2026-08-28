import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { authService } from '../api/auth.service';
import type {
  ForgotPasswordRequest,
  PasswordResetMessageResponse,
} from '../schemas/password-reset.schema';
import type { ApiError } from '@lib/axios';

export function useForgotPasswordMutation(): UseMutationResult<
  PasswordResetMessageResponse,
  ApiError,
  ForgotPasswordRequest
> {
  return useMutation<PasswordResetMessageResponse, ApiError, ForgotPasswordRequest>({
    mutationFn: (input) => authService.forgotPassword(input),
  });
}
