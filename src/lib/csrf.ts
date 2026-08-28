const CSRF_COOKIE = 'XSRF-TOKEN';

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {return null;}
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(';')) {
    const value = part.trim();
    if (value.startsWith(prefix)) {return decodeURIComponent(value.slice(prefix.length));}
  }
  return null;
}

export function csrfHeaders(): Record<string, string> {
  const token = readCookie(CSRF_COOKIE);
  return token === null ? {} : { 'X-CSRF-Token': token };
}
