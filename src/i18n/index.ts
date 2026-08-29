import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { getDirection, supportedLocales, FALLBACK_LOCALE } from './config';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enErrors from './locales/en/errors.json';
import enSettings from './locales/en/settings.json';
import enWhistleblowing from './locales/en/whistleblowing.json';
import enOrgAdmin from './locales/en/orgAdmin.json';
import frAuth from './locales/fr/auth.json';
import frCommon from './locales/fr/common.json';
import frErrors from './locales/fr/errors.json';
import frSettings from './locales/fr/settings.json';
import frWhistleblowing from './locales/fr/whistleblowing.json';
import frOrgAdmin from './locales/fr/orgAdmin.json';
import deAuth from './locales/de/auth.json';
import deCommon from './locales/de/common.json';
import deErrors from './locales/de/errors.json';
import deSettings from './locales/de/settings.json';
import deWhistleblowing from './locales/de/whistleblowing.json';
import deOrgAdmin from './locales/de/orgAdmin.json';
import arAuth from './locales/ar/auth.json';
import arCommon from './locales/ar/common.json';
import arErrors from './locales/ar/errors.json';
import arSettings from './locales/ar/settings.json';
import arWhistleblowing from './locales/ar/whistleblowing.json';
import arOrgAdmin from './locales/ar/orgAdmin.json';
import urAuth from './locales/ur/auth.json';
import urCommon from './locales/ur/common.json';
import urErrors from './locales/ur/errors.json';
import urSettings from './locales/ur/settings.json';
import urWhistleblowing from './locales/ur/whistleblowing.json';
import urOrgAdmin from './locales/ur/orgAdmin.json';

export { getDirection, supportedLocales } from './config';
export const LANG_STORAGE_KEY = 'tellara.lang';

const resources = {
  en: { auth: enAuth, common: enCommon, errors: enErrors, settings: enSettings, whistleblowing: enWhistleblowing, orgAdmin: enOrgAdmin },
  fr: { auth: frAuth, common: frCommon, errors: frErrors, settings: frSettings, whistleblowing: frWhistleblowing, orgAdmin: frOrgAdmin },
  de: { auth: deAuth, common: deCommon, errors: deErrors, settings: deSettings, whistleblowing: deWhistleblowing, orgAdmin: deOrgAdmin },
  ar: { auth: arAuth, common: arCommon, errors: arErrors, settings: arSettings, whistleblowing: arWhistleblowing, orgAdmin: arOrgAdmin },
  ur: { auth: urAuth, common: urCommon, errors: urErrors, settings: urSettings, whistleblowing: urWhistleblowing, orgAdmin: urOrgAdmin },
} as const;

void i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  fallbackLng: FALLBACK_LOCALE,
  supportedLngs: supportedLocales.map((locale) => locale.code),
  load: 'languageOnly',
  defaultNS: 'common',
  ns: ['common', 'auth', 'errors', 'settings', 'whistleblowing', 'orgAdmin'],
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

export async function changeLanguage(code: string): Promise<void> {
  await i18n.changeLanguage(code);
}

export default i18n;
