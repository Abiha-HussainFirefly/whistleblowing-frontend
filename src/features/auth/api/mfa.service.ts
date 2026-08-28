import { apiClient } from '@lib/axios';

export interface MfaStatus {
  enabled: boolean;
  enrolledAt: string | null;
  remainingRecoveryCodes: number;
}

export interface MfaEnrollResult {
  otpauthUri: string;
  qrCodeDataUrl: string;
  secret: string;
}

export interface MfaVerifyEnrollResult {
  recoveryCodes: string[];
}

export const mfaService = {
  getStatus: () => apiClient.get<MfaStatus>('/auth/mfa/status').then((r) => r.data),

  enroll: () => apiClient.post<MfaEnrollResult>('/auth/mfa/enroll').then((r) => r.data),

  verifyEnrollment: (code: string) =>
    apiClient.post<MfaVerifyEnrollResult>('/auth/mfa/enroll/verify', { code }).then((r) => r.data),

  // Returns the login-response envelope; the caller validates it with
  // loginResponseSchema, so it is typed as `unknown` here.
  verify: (challengeToken: string, code: string) =>
    apiClient.post<unknown>('/auth/mfa/verify', { challengeToken, code }).then((r) => r.data),

  verifyRecovery: (challengeToken: string, recoveryCode: string) =>
    apiClient
      .post<unknown>('/auth/mfa/recovery', { challengeToken, recoveryCode })
      .then((r) => r.data),

  disable: (code: string) =>
    apiClient.post<unknown>('/auth/mfa/disable', { code }).then((r) => r.data),

  regenerateRecoveryCodes: (code: string) =>
    apiClient
      .post<MfaVerifyEnrollResult>('/auth/mfa/recovery-codes/regenerate', { code })
      .then((r) => r.data),
} as const;
