import axios from 'axios';
import { apiClient } from '@lib/axios';
import { env } from '@config/env';
import type { AuthSessionPayload, AuthUser, MeResponse, PlatformRole } from '@/types/auth';
import { loginRequestSchema, type LoginRequest, type LoginResponse } from '../schemas/login.schema';
import { verifyOtpRequestSchema, type VerifyOtpRequest, type VerifyOtpResponse, resendOtpRequestSchema, type ResendOtpRequest, type ResendOtpResponse } from '../schemas/email-verification.schema';
import { forgotPasswordRequestSchema, resetPasswordRequestSchema, passwordResetMessageSchema, type ForgotPasswordRequest, type ResetPasswordRequest, type PasswordResetMessageResponse } from '../schemas/password-reset.schema';

type TargetAuthResponse = {
  token: string;
  expiresIn?: string | number;
  user: { id: string; email: string; displayName: string | null; platformRole?: PlatformRole };
  organization?: { id: string; name: string; slug: string } | null;
  permissions: string[];
};
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
  return { ...user, platformRole, kind: 'STANDARD', status: 'ACTIVE', persona: platformRole === 'SUPER_ADMIN' ? null : 'INTERNAL', mfaEnabled: false, emailVerifiedAt: null, lastLoginAt: null };
}

function normalizeSession(data: TargetAuthResponse): LoginResponse {
  const expiresIn = seconds(data.expiresIn);
  localStorage.setItem('wb.internalToken', data.token);
  localStorage.setItem('wb.permissions', JSON.stringify(data.permissions));
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
  return { nextStep: 'authenticated', accessToken: data.token, tokenType: 'Bearer', expiresIn, refreshTokenExpiresIn: expiresIn, user: normalizeUser(data.user), activeOrganization: data.organization ?? null, activeRegion: null };
}

function organizationSlug(): string {
  return localStorage.getItem('wb.organizationSlug') ?? import.meta.env.VITE_WB_ORGANIZATION_SLUG ?? '';
}

export const authService = {
  async login(input: LoginRequest): Promise<LoginResponse> {
    const payload = loginRequestSchema.parse(input);
    const { data } = await apiClient.post<TargetAuthResponse>('/auth/login', { ...payload, organizationSlug: organizationSlug() });
    return normalizeSession(data);
  },
  async orgLogin(input: LoginRequest): Promise<LoginResponse> { return this.login(input); },
  async verifyOtp(input: VerifyOtpRequest): Promise<VerifyOtpResponse> { const { data } = await apiClient.post<VerifyOtpResponse>('/auth/email/verify-otp', verifyOtpRequestSchema.parse(input)); return data; },
  async resendOtp(input: ResendOtpRequest): Promise<ResendOtpResponse> { const { data } = await apiClient.post<ResendOtpResponse>('/auth/email/resend-otp', resendOtpRequestSchema.parse(input)); return data; },
  async forgotPassword(input: ForgotPasswordRequest): Promise<PasswordResetMessageResponse> { const { data } = await apiClient.post<unknown>('/auth/password/forgot', forgotPasswordRequestSchema.parse(input)); return passwordResetMessageSchema.parse(data); },
  async resetPassword(input: ResetPasswordRequest): Promise<PasswordResetMessageResponse> { const { data } = await apiClient.post<unknown>('/auth/password/reset', resetPasswordRequestSchema.parse(input)); return passwordResetMessageSchema.parse(data); },
  async me(accessToken?: string): Promise<MeResponse> { const { data } = await apiClient.get<MeResponse>('/auth/me', accessToken === undefined ? undefined : { headers: { Authorization: `Bearer ${accessToken}` } }); return data; },
  async refresh(): Promise<AuthSessionPayload> { const { data } = await axios.post<AuthSessionPayload>(`${env.apiBaseUrl}/auth/refresh`); return data; },
  async logout(): Promise<void> { localStorage.removeItem('wb.internalToken'); localStorage.removeItem('wb.permissions'); localStorage.removeItem('wb.platformRole'); localStorage.removeItem('wb.organizationId'); localStorage.removeItem('wb.organizationSlug'); localStorage.removeItem('wb.organizationName'); localStorage.removeItem('wb.userDisplayName'); localStorage.removeItem('wb.userEmail'); await apiClient.post('/auth/logout', {}); },
  async adminLogin(input: LoginRequest): Promise<LoginResponse> {
    const payload = loginRequestSchema.parse(input);
    const { data } = await apiClient.post<TargetAuthResponse>('/auth/admin/login', payload);
    return normalizeSession(data);
  },
  async switchContext(..._args: unknown[]): Promise<any> { throw new Error('Region context switching is not part of the standalone project.'); },
  async verifyInvitationOtp(..._args: unknown[]): Promise<any> { throw new Error('Invitation authentication is not part of the standalone project.'); },
  async resendInvitationVerification(..._args: unknown[]): Promise<any> { throw new Error('Invitation authentication is not part of the standalone project.'); },
} as const;
