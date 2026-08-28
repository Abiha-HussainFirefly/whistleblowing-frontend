import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { authService } from '../api/auth.service';
import type { LoginRequest, LoginResponse } from '../schemas/login.schema';
import type { ApiError } from '@lib/axios';

export function useAdminLoginMutation(): UseMutationResult<LoginResponse, ApiError, LoginRequest> {
  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: (input) => authService.adminLogin(input),
  });
}
