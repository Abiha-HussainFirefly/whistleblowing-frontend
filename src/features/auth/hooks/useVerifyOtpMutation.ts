import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { authService } from '../api/auth.service';
import type { VerifyOtpRequest, VerifyOtpResponse } from '../schemas/email-verification.schema';
import type { ApiError } from '@lib/axios';

export function useVerifyOtpMutation(): UseMutationResult<
  VerifyOtpResponse,
  ApiError,
  VerifyOtpRequest
> {
  return useMutation<VerifyOtpResponse, ApiError, VerifyOtpRequest>({
    mutationFn: (input) => authService.verifyOtp(input),
  });
}
