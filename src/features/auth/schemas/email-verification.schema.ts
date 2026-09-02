import { z } from 'zod';
import { authUserSchema, orgContextSchema } from './login.schema';

/* ---------- Verify OTP ---------- */

export const verifyOtpRequestSchema = z.object({
  verificationToken: z.string().min(1),
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
});

export type VerifyOtpRequest = z.infer<typeof verifyOtpRequestSchema>;

export const verifyOtpResponseSchema = z.object({
  nextStep: z.literal('authenticated'),
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().min(1).optional(),
  refreshTokenExpiresIn: z.number().int().positive(),
  user: authUserSchema,
  permissions: z.array(z.string()).default([]),
  activeOrganization: orgContextSchema.nullable().optional(),
  activeRegion: z.string().nullable().optional(),
});

export type VerifyOtpResponse = z.infer<typeof verifyOtpResponseSchema>;

/* ---------- Resend OTP ---------- */

export const resendOtpRequestSchema = z.object({
  verificationToken: z.string().min(1),
});

export type ResendOtpRequest = z.infer<typeof resendOtpRequestSchema>;

export const resendOtpResponseSchema = z.object({
  message: z.string(),
  nextResendAt: z.string(),
});

export type ResendOtpResponse = z.infer<typeof resendOtpResponseSchema>;
