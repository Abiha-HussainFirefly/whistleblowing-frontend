import { z } from 'zod';
import { emailSchema, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@validators/common';
import type { MembershipPersona, PlatformRole, UserKind, UserStatus } from '@/types/auth';

/* ---------- Request ---------- */

/**
 * Login password field. Beyond presence, this enforces the full password
 * format — minimum length plus the four character-class rules — so the form,
 * and `auth.service` (which re-parses this schema), block the request until the
 * password is in the correct format. Errors surface one at a time (login is not
 * a creation flow, so there is no requirements checklist). Kept in lockstep
 * with the shared `passwordSchema` / backend `IsStrongPassword()`.
 */
const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${String(PASSWORD_MAX_LENGTH)} characters`)
  .regex(/[A-Z]/, 'Add at least one uppercase letter')
  .regex(/[a-z]/, 'Add at least one lowercase letter')
  .regex(/[0-9]/, 'Add at least one number')
  .regex(/[^A-Za-z0-9]/, 'Add at least one special character');

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/* ---------- Response ---------- */

const platformRoleSchema: z.ZodType<PlatformRole> = z.enum([
  'USER',
  'TENANT',
  'SUPPORT',
  'SUPER_ADMIN',
]);

const userKindSchema: z.ZodType<UserKind> = z.enum([
  'STANDARD',
  'EXTERNAL_COUNSEL',
  'WHISTLEBLOWER',
  'SERVICE_ACCOUNT',
]);

const userStatusSchema: z.ZodType<UserStatus> = z.enum([
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'LOCKED',
  'DEACTIVATED',
]);

const membershipPersonaSchema: z.ZodType<MembershipPersona> = z.enum([
  'INTERNAL',
  'TENANT',
  'EXTERNAL_COUNSEL',
]);

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().nullable(),
  platformRole: platformRoleSchema,
  persona: membershipPersonaSchema.nullable(),
  kind: userKindSchema,
  status: userStatusSchema,
  mfaEnabled: z.boolean(),
  emailVerifiedAt: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
});

export const orgContextSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
  brandAccentColor: z.string().nullable().optional(),
});

const authenticatedResponseSchema = z.object({
  nextStep: z.literal('authenticated'),
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().min(1).optional(),
  refreshTokenExpiresIn: z.number().int().positive(),
  user: authUserSchema,
  activeOrganization: orgContextSchema.nullable().optional(),
  activeRegion: z.string().nullable().optional(),
});

const mfaRequiredResponseSchema = z.object({
  nextStep: z.literal('mfa_required'),
  challengeToken: z.string().min(1),
  challengeExpiresIn: z.number().int().positive(),
});

const emailVerificationRequiredResponseSchema = z.object({
  nextStep: z.literal('email_verification_required'),
  verificationToken: z.string().min(1),
  verificationExpiresIn: z.number().int().positive(),
  maskedEmail: z.string().min(1),
});

export const loginResponseSchema = z.discriminatedUnion('nextStep', [
  authenticatedResponseSchema,
  mfaRequiredResponseSchema,
  emailVerificationRequiredResponseSchema,
]);

export type LoginResponse = z.infer<typeof loginResponseSchema>;

/* ---------- Refresh ---------- */

/** `POST /auth/refresh` — rotates the refresh token and re-mints an access
 *  token. Shape matches {@link AuthSessionPayload}. */
export const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().min(1).optional(),
  refreshTokenExpiresIn: z.number().int().positive(),
  user: authUserSchema,
});

export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
