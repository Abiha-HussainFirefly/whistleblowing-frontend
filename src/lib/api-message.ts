import i18n from '@/i18n';

export const API_SUCCESS_MESSAGE = 'X-Success-Message';

const NAMESPACE_KEY = /^([a-z][\w-]*)\.(.+)$/i;

function lowercaseFirst(value: string): string {
  return value.length === 0 ? value : `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function candidateKeys(message: string): string[] {
  const normalized = lowercaseFirst(message.trim());
  const match = NAMESPACE_KEY.exec(normalized);
  if (match === null) {
    return [normalized];
  }
  const [, namespace, key] = match;
  if (namespace === undefined || key === undefined) {
    return [normalized];
  }
  return [`${namespace}:${key}`, normalized];
}

export function localizeApiMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  for (const key of candidateKeys(trimmed)) {
    if (i18n.exists(key)) {
      return i18n.t(key);
    }
  }

  return trimmed;
}
