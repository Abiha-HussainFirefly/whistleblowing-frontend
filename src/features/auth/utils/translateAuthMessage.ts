import type { TFunction } from 'i18next';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@validators/common';

export function translateAuthMessage(message: string | undefined, t: TFunction): string {
  if (message === undefined || message.length === 0) {
    return '';
  }

  const exact = new Map<string, string>([
    ['Enter a valid email address (e.g. name@company.com)', 'auth.validation.validEmailExample'],
    ['Enter a valid email address', 'auth.validation.validEmail'],
    ['Password is required', 'auth.validation.passwordRequired'],
    [
      `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters`,
      'auth.validation.passwordMin',
    ],
    [
      `Password must be at most ${String(PASSWORD_MAX_LENGTH)} characters`,
      'auth.validation.passwordMax',
    ],
    ['Password must contain at least one uppercase letter', 'auth.validation.passwordUppercase'],
    ['Password must contain at least one lowercase letter', 'auth.validation.passwordLowercase'],
    ['Password must contain at least one number', 'auth.validation.passwordNumber'],
    ['Password must contain at least one special character', 'auth.validation.passwordSpecial'],
    ['Add at least one uppercase letter', 'auth.validation.addUppercase'],
    ['Add at least one lowercase letter', 'auth.validation.addLowercase'],
    ['Add at least one number', 'auth.validation.addNumber'],
    ['Add at least one special character', 'auth.validation.addSpecial'],
    ['Passwords do not match', 'auth.validation.passwordsDoNotMatch'],
  ]);

  const key = exact.get(message);
  return key !== undefined
    ? t(key, {
        min: PASSWORD_MIN_LENGTH,
        max: PASSWORD_MAX_LENGTH,
      })
    : message;
}
