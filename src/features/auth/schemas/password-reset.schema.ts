import { z } from 'zod';
import { emailSchema, passwordSchema } from '@validators/common';

/* ---------- Forgot password (request reset link) ---------- */

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

/* ---------- Reset password (consume token) ---------- */

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Both endpoints return the same `{ message }` envelope. The forgot endpoint
 * is deliberately generic (no enumeration), so the client only ever shows a
 * confirmation, never a branch on whether the account existed.
 */
export const passwordResetMessageSchema = z.object({
  message: z.string(),
});

export type PasswordResetMessageResponse = z.infer<typeof passwordResetMessageSchema>;
