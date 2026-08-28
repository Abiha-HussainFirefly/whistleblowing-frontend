import { z } from 'zod';

/**
 * Re-usable Zod primitives. Define field-level constraints here so they
 * stay consistent across every form and request body.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email('Enter a valid email address (e.g. name@company.com)');

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export interface PasswordRule {
  /** Stable key for React lists. */
  readonly id: string;
  /** Human-readable requirement shown in the live checklist. */
  readonly label: string;
  /** True when `value` satisfies this rule. */
  readonly test: (value: string) => boolean;
}

/**
 * Single source of truth for the password policy. The `passwordSchema` below
 * is built from these rules and the same list drives the live requirements
 * checklist (`<PasswordRequirements />`), so what the user sees always matches
 * what is enforced. Kept in lockstep with the backend `IsStrongPassword()`
 * decorator (atlyis-backend/src/common/validators/is-strong-password.decorator.ts).
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'length',
    label: `At least ${String(PASSWORD_MIN_LENGTH)} characters`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  { id: 'uppercase', label: 'One uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lowercase', label: 'One lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'One number (0–9)', test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'One special character (!@#$…)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${String(PASSWORD_MAX_LENGTH)} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/** True iff `value` satisfies every rule in the policy. */
export function isStrongPassword(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export const uuidSchema = z.string().uuid('Invalid identifier');

export const nonEmptyString = (max = 255) => z.string().trim().min(1, 'Required').max(max);
