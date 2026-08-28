const NON_RECOVERY_CODE_CHARACTER = /[^a-z0-9-]/gi;

/**
 * Recovery codes are generated server-side as lowercase ASCII characters,
 * digits, and a hyphen. Keep credential entry independent of the UI language.
 */
export function normalizeRecoveryCodeInput(value: string): string {
  return value.replace(NON_RECOVERY_CODE_CHARACTER, '');
}
