import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { getDirection, supportedLocales, FALLBACK_LOCALE } from './config';

// English is the fallback locale, so it is the only one bundled eagerly: every
// other language resolves through it for any missing key, and it must be present
// before the first render.
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enErrors from './locales/en/errors.json';
import enSettings from './locales/en/settings.json';
import enWhistleblowing from './locales/en/whistleblowing.json';
import enOrgAdmin from './locales/en/orgAdmin.json';
import enTours from './locales/en/tours.json';

export { getDirection, supportedLocales } from './config';
export const LANG_STORAGE_KEY = 'tellara.lang';

const NAMESPACES = ['auth', 'common', 'errors', 'settings', 'whistleblowing', 'orgAdmin', 'tours'] as const;
type Namespace = (typeof NAMESPACES)[number];

/**
 * Non-English locales are fetched on demand.
 *
 * All five used to be bundled into the main chunk, which meant an English-only
 * reporter downloaded Arabic, Urdu, French and German translations — roughly
 * 20,000 lines of JSON — before the reporting form could paint. Vite turns these
 * globs into separate chunks, so each visitor pays only for the language they
 * actually read.
 *
 * English stays static above so there is never a moment with no strings at all.
 */
const localeLoaders: Record<string, () => Promise<Record<Namespace, unknown>>> = {
  fr: async () => ({
    auth: (await import('./locales/fr/auth.json')).default,
    common: (await import('./locales/fr/common.json')).default,
    errors: (await import('./locales/fr/errors.json')).default,
    settings: (await import('./locales/fr/settings.json')).default,
    whistleblowing: (await import('./locales/fr/whistleblowing.json')).default,
    orgAdmin: (await import('./locales/fr/orgAdmin.json')).default,
    tours: (await import('./locales/fr/tours.json')).default,
  }),
  de: async () => ({
    auth: (await import('./locales/de/auth.json')).default,
    common: (await import('./locales/de/common.json')).default,
    errors: (await import('./locales/de/errors.json')).default,
    settings: (await import('./locales/de/settings.json')).default,
    whistleblowing: (await import('./locales/de/whistleblowing.json')).default,
    orgAdmin: (await import('./locales/de/orgAdmin.json')).default,
    tours: (await import('./locales/de/tours.json')).default,
  }),
  ar: async () => ({
    auth: (await import('./locales/ar/auth.json')).default,
    common: (await import('./locales/ar/common.json')).default,
    errors: (await import('./locales/ar/errors.json')).default,
    settings: (await import('./locales/ar/settings.json')).default,
    whistleblowing: (await import('./locales/ar/whistleblowing.json')).default,
    orgAdmin: (await import('./locales/ar/orgAdmin.json')).default,
    tours: (await import('./locales/ar/tours.json')).default,
  }),
  ur: async () => ({
    auth: (await import('./locales/ur/auth.json')).default,
    common: (await import('./locales/ur/common.json')).default,
    errors: (await import('./locales/ur/errors.json')).default,
    settings: (await import('./locales/ur/settings.json')).default,
    whistleblowing: (await import('./locales/ur/whistleblowing.json')).default,
    orgAdmin: (await import('./locales/ur/orgAdmin.json')).default,
    tours: (await import('./locales/ur/tours.json')).default,
  }),
};

const loaded = new Set<string>(['en']);

/**
 * Loads a locale's bundles if they are not already present.
 *
 * Failure is non-fatal on purpose: the user keeps the English strings rather than
 * an untranslated blank interface. On this product an empty screen mid-report is
 * worse than a screen in the wrong language.
 */
export async function ensureLocaleLoaded(locale: string): Promise<void> {
  const base = locale.split('-')[0] ?? FALLBACK_LOCALE;
  if (loaded.has(base)) return;

  const loader = localeLoaders[base];
  if (loader === undefined) return;

  try {
    const bundles = await loader();
    for (const namespace of NAMESPACES) {
      i18n.addResourceBundle(base, namespace, bundles[namespace], true, true);
    }
    loaded.add(base);
  } catch {
    // Keep the fallback language rather than rendering nothing.
  }
}

const resources = {
  en: {
    auth: enAuth,
    common: enCommon,
    errors: enErrors,
    settings: enSettings,
    whistleblowing: enWhistleblowing,
    orgAdmin: enOrgAdmin,
    tours: enTours,
  },
} as const;

void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  fallbackLng: FALLBACK_LOCALE,
  supportedLngs: supportedLocales.map((locale) => locale.code),
  load: 'languageOnly',
  defaultNS: 'common',
  ns: ['common', 'auth', 'errors', 'settings', 'whistleblowing', 'orgAdmin', 'tours'],
  returnNull: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  detection: { order: ['localStorage', 'navigator', 'htmlTag'], lookupLocalStorage: LANG_STORAGE_KEY, caches: ['localStorage'] },
});

function applyDirection(language: string): void {
  document.documentElement.lang = language;
  document.documentElement.dir = getDirection(language);
}
applyDirection(i18n.resolvedLanguage ?? FALLBACK_LOCALE);
i18n.on('languageChanged', applyDirection);

// The detector may resolve to a non-English language before any component
// mounts, so its bundles have to be fetched immediately rather than only on an
// explicit switch.
void ensureLocaleLoaded(i18n.resolvedLanguage ?? FALLBACK_LOCALE);

export async function changeLanguage(code: string): Promise<void> {
  // Load first, then switch: changing language before the strings exist causes a
  // visible flash of fallback text mid-form.
  await ensureLocaleLoaded(code);
  await i18n.changeLanguage(code);
}

export default i18n;
