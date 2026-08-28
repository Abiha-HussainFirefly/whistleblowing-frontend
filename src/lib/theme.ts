export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'wb.theme';

export function readThemePreference(): ThemePreference {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'dark' || value === 'system' ? value : 'light';
}

export function applyThemePreference(preference: ThemePreference): void {
  const dark = preference === 'dark' ||
    (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function saveThemePreference(preference: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, preference);
  applyThemePreference(preference);
}
