/**
 * Reporter portal session — the case-scoped JWT lives only in `sessionStorage`
 * (cleared when the tab closes), never in the global auth store. This keeps the
 * anonymous reporter session fully separate from any platform-user session.
 */
const REPORTER_TOKEN_KEY = 'civorah.wb.reporter';

export function saveReporterToken(token: string): void {
  sessionStorage.setItem(REPORTER_TOKEN_KEY, token);
}

export function getReporterToken(): string | null {
  return sessionStorage.getItem(REPORTER_TOKEN_KEY);
}

export function clearReporterToken(): void {
  sessionStorage.removeItem(REPORTER_TOKEN_KEY);
}

export function hasReporterSession(): boolean {
  const token = getReporterToken();
  return token !== null && token.length > 0;
}
