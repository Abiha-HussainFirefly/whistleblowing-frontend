/**
 * Single source of truth for the platform's supported UI languages.
 *
 * Add a language by appending an entry here AND providing the matching
 * `src/i18n/locales/<code>/<namespace>.json` catalogs — no component changes are
 * needed. `dir` drives the document text direction (RTL for Arabic/Urdu).
 */
export interface LocaleConfig {
  /** BCP-47 short language tag (also the translation-folder name). */
  code: string;
  /** English label (for developer/admin contexts). */
  label: string;
  /** The language's own name, shown in the user-facing language switcher. */
  nativeLabel: string;
  /** Text direction for this language. */
  dir: 'ltr' | 'rtl';
  /**
   * ISO 3166-1 alpha-2 country code used to render the language's flag in the
   * switcher (via the `flag-icons` package / {@link FlagIcon}). A language maps
   * to a representative country: English→GB, Arabic→SA, Urdu→PK.
   */
  flagCode: string;
}

export const supportedLocales: readonly LocaleConfig[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr', flagCode: 'gb' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', flagCode: 'sa' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr', flagCode: 'fr' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr', flagCode: 'de' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', dir: 'rtl', flagCode: 'pk' },
];

export const FALLBACK_LOCALE = 'en';

export const DEFAULT_NAMESPACE = 'common';

/**
 * Translation namespaces. These map 1:1 to `locales/<code>/<namespace>.json`.
 * `common` is the default; the rest are loaded for the screens that use them.
 */
export const NAMESPACES = [
  'common',
  'auth',
  'navigation',
  'validation',
  'settings',
  'errors',
  'dashboard',
  'plans',
  'configPacks',
  'capabilities',
  'adminUsers',
  'whistleblowing',
  'orgAdmin',
  'externalAccess',
  'notifications',
  'contracts',
  'tours',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

const RTL_CODES = new Set(supportedLocales.filter((l) => l.dir === 'rtl').map((l) => l.code));
// Extra RTL languages that may still appear in browser/profile preferences.
const EXTRA_RTL_CODES = new Set(['he', 'fa']);

/** Text direction for a locale code. Defaults to LTR for unknown codes. */
export function getDirection(locale: string): 'ltr' | 'rtl' {
  const base = locale.toLowerCase().split('-')[0] ?? '';
  return RTL_CODES.has(base) || EXTRA_RTL_CODES.has(base) ? 'rtl' : 'ltr';
}

/** True when the code is one of the officially supported languages. */
export function isSupportedLocale(code: string): boolean {
  const base = code.toLowerCase().split('-')[0] ?? '';
  return supportedLocales.some((l) => l.code === base);
}
