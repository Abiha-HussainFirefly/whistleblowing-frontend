import axios from 'axios';
import { apiClient } from '@lib/axios';
import { clearAccessToken, setAccessToken } from '@lib/auth-token';
import { env } from '@config/env';
import type { AuthSessionPayload, MeResponse, PlatformRole } from '@/types/auth';
import { loginRequestSchema, type LoginRequest, type LoginResponse } from '../schemas/login.schema';
import { verifyOtpRequestSchema, type VerifyOtpRequest, type VerifyOtpResponse, resendOtpRequestSchema, type ResendOtpRequest, type ResendOtpResponse } from '../schemas/email-verification.schema';
import { forgotPasswordRequestSchema, resetPasswordRequestSchema, passwordResetMessageSchema, type ForgotPasswordRequest, type ResetPasswordRequest, type PasswordResetMessageResponse } from '../schemas/password-reset.schema';

type TargetAuthResponse = {
  nextStep?: 'authenticated';
  token: string;
  expiresIn?: string | number;
  user: { id: string; email: string; displayName: string | null; platformRole?: PlatformRole };
  organization?: { id: string; name: string; slug: string } | null;
  permissions: string[];
};
type MfaChallengeResponse = Extract<LoginResponse, { nextStep: 'mfa_required' }>;
type EmailVerificationResponse = Extract<LoginResponse, { nextStep: 'email_verification_required' }>;
type AuthenticatedLogin = Extract<LoginResponse, { nextStep: 'authenticated' }>;

function seconds(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(60, value);
  const match = /^(\d+)(s|m|h|d)?$/i.exec(String(value ?? '8h'));
  if (!match) return 8 * 60 * 60;
  const amount = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();
  return amount * (unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1);
}

function normalizeUser(user: TargetAuthResponse['user']): AuthenticatedLogin['user'] {
  const platformRole = user.platformRole ?? 'USER';
  return { ...user, platformRole, kind: 'STANDARD', status: 'ACTIVE', persona: platformRole === 'TENANT' ? 'TENANT' : platformRole === 'SUPER_ADMIN' ? null : 'INTERNAL', mfaEnabled: false, emailVerifiedAt: null, lastLoginAt: null };
}

function normalizeSession(data: TargetAuthResponse | MfaChallengeResponse | EmailVerificationResponse): LoginResponse {
  // MFA and email-verification responses intentionally do not contain a user
  // or access token. They must pass through to the corresponding next step;
  // treating them as authenticated sessions causes a client-side TypeError.
  if (data.nextStep === 'mfa_required' || data.nextStep === 'email_verification_required') {
    return data;
  }

  const expiresIn = seconds(data.expiresIn);
  // The access token is held in memory only; the refresh token arrives as an
  // HttpOnly cookie the browser will not expose to script. Permissions are
  // passed to the in-memory session for the first render, but are never
  // persisted; /auth/me remains the live authorization source of truth.
  setAccessToken(data.token, expiresIn);
  localStorage.setItem('wb.platformRole', data.user.platformRole ?? 'USER');
  if (data.organization !== null && data.organization !== undefined) {
    localStorage.setItem('wb.organizationId', data.organization.id);
    localStorage.setItem('wb.organizationSlug', data.organization.slug);
    localStorage.setItem('wb.organizationName', data.organization.name);
  } else {
    localStorage.removeItem('wb.organizationId');
    localStorage.removeItem('wb.organizationSlug');
    localStorage.removeItem('wb.organizationName');
  }
  localStorage.setItem('wb.userDisplayName', data.user.displayName ?? '');
  localStorage.setItem('wb.userEmail', data.user.email);
  return { nextStep: 'authenticated', accessToken: data.token, tokenType: 'Bearer', expiresIn, refreshTokenExpiresIn: expiresIn, user: normalizeUser(data.user), permissions: data.permissions, activeOrganization: data.organization ?? null, activeRegion: null };
}

function organizationSlug(): string {
  // The standalone deployment has one configured organization. Prefer its
  // configured slug so a stale browser context from another organization
  // cannot make every organization-scoped login fail with a 401.
  const configuredSlug = import.meta.env.VITE_WB_ORGANIZATION_SLUG?.trim();
  return configuredSlug || localStorage.getItem('wb.organizationSlug')?.trim() || '';
}

export const authService = {
  async login(input: LoginRequest): Promise<LoginResponse> {
    const payload = loginRequestSchema.parse(input);
    const { data } = await apiClient.post<TargetAuthResponse>('/auth/login', { ...payload, organizationSlug: organizationSlug() });
    return normalizeSession(data);
  },
  async orgLogin(input: LoginRequest): Promise<LoginResponse> {
    const payload = loginRequestSchema.parse(input);
    const { data } = await apiClient.post<TargetAuthResponse>('/auth/org/login', { ...payload, organizationSlug: organizationSlug() });
    return normalizeSession(data);
  },
  async verifyOtp(input: VerifyOtpRequest): Promise<VerifyOtpResponse> { const { data } = await apiClient.post<VerifyOtpResponse>('/auth/email/verify-otp', verifyOtpRequestSchema.parse(input)); return data; },
  async resendOtp(input: ResendOtpRequest): Promise<ResendOtpResponse> { const { data } = await apiClient.post<ResendOtpResponse>('/auth/email/resend-otp', resendOtpRequestSchema.parse(input)); return data; },
  async forgotPassword(input: ForgotPasswordRequest): Promise<PasswordResetMessageResponse> { const { data } = await apiClient.post<unknown>('/auth/password/forgot', forgotPasswordRequestSchema.parse(input)); return passwordResetMessageSchema.parse(data); },
  async resetPassword(input: ResetPasswordRequest): Promise<PasswordResetMessageResponse> { const { data } = await apiClient.post<unknown>('/auth/password/reset', resetPasswordRequestSchema.parse(input)); return passwordResetMessageSchema.parse(data); },
  async me(accessToken?: string): Promise<MeResponse> { const { data } = await apiClient.get<MeResponse>('/auth/me', accessToken === undefined ? undefined : { headers: { Authorization: `Bearer ${accessToken}` } }); return data; },
  async refresh(): Promise<AuthSessionPayload> { const { data } = await axios.post<AuthSessionPayload>(`${env.apiBaseUrl}/auth/refresh`); return data; },
  async logout(): Promise<void> { clearAccessToken(); localStorage.removeItem('wb.internalToken'); localStorage.removeItem('wb.permissions'); localStorage.removeItem('wb.platformRole'); localStorage.removeItem('wb.organizationId'); localStorage.removeItem('wb.organizationSlug'); localStorage.removeItem('wb.organizationName'); localStorage.removeItem('wb.userDisplayName'); localStorage.removeItem('wb.userEmail'); await apiClient.post('/auth/logout', {}); },
  async adminLogin(input: LoginRequest): Promise<LoginResponse> {
    const payload = loginRequestSchema.parse(input);
    const { data } = await apiClient.post<TargetAuthResponse>('/auth/admin/login', payload);
    return normalizeSession(data);
  },
  async switchContext(..._args: unknown[]): Promise<any> { throw new Error('Region context switching is not part of the standalone project.'); },
  async verifyInvitationOtp(..._args: unknown[]): Promise<any> { throw new Error('Invitation authentication is not part of the standalone project.'); },
  async resendInvitationVerification(..._args: unknown[]): Promise<any> { throw new Error('Invitation authentication is not part of the standalone project.'); },
} as const;
