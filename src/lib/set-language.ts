import i18n, { supportedLocales } from '@/i18n';

export async function setAppLanguage(code: string): Promise<void> {
  if (supportedLocales.some((locale) => locale.code === code)) {
    await i18n.changeLanguage(code);
  }
}
