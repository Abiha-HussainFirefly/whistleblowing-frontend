import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { authService } from '../api/auth.service';
import type { ResendOtpRequest, ResendOtpResponse } from '../schemas/email-verification.schema';
import type { ApiError } from '@lib/axios';

export function useResendOtpMutation(): UseMutationResult<
  ResendOtpResponse,
  ApiError,
  ResendOtpRequest
> {
  return useMutation<ResendOtpResponse, ApiError, ResendOtpRequest>({
    mutationFn: (input) => authService.resendOtp(input),
  });
}
