import { useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '@config/constants';
import { useAuthStore } from '@store/authStore';

/**
 * Auto-saves a half-finished form to `localStorage` so a user who gets pulled
 * away (or has to stop mid-form to create a missing prerequisite) doesn't lose
 * their work. Drafts are namespaced per signed-in user + org so they never leak
 * across accounts on a shared machine.
 *
 *   const { restoredDraft, clearDraft } = useFormDraft({
 *     key: 'contract-create',
 *     value: form,
 *     enabled: isOpen && !isEdit,
 *     isEmpty: isContractFormPristine,
 *   });
 *
 * The hook never mutates the form itself — `restoredDraft` is the draft that
 * existed when the form mounted (or null), and the caller decides whether to
 * apply it. Call `clearDraft()` on successful submit (or an explicit discard).
 */
interface UseFormDraftArgs<T> {
  /** Stable logical key for this form, e.g. `'contract-create'`. */
  key: string;
  /** Current form value — persisted (debounced) while `enabled`. */
  value: T;
  /** Only read/write the draft while true (e.g. create-mode + sheet open). */
  enabled?: boolean;
  /** Debounce window for writes, ms. Default 800. */
  debounceMs?: number;
  /** Skip persisting a pristine/untouched form so we don't store empty drafts. */
  isEmpty?: (value: T) => boolean;
}

interface UseFormDraftResult<T> {
  /**
   * Synchronously read the persisted draft (or null). Stable across renders, so
   * it can seed initial form state the moment a form opens — no effect lag.
   */
  readDraft: () => T | null;
  /** Remove the persisted draft (call on submit success or explicit discard). */
  clearDraft: () => void;
}

function safeGet(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function safeSet(storageKey: string, raw: string): void {
  try {
    window.localStorage.setItem(storageKey, raw);
  } catch {
    /* private mode / quota — drafts are best-effort, never fatal */
  }
}

function safeRemove(storageKey: string): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

export function useFormDraft<T>({
  key,
  value,
  enabled = true,
  debounceMs = 800,
  isEmpty,
}: UseFormDraftArgs<T>): UseFormDraftResult<T> {
  const userId = useAuthStore((s) => s.user?.id ?? 'anon');
  const orgId = useAuthStore((s) => s.activeOrganization?.id ?? 'no-org');
  const storageKey = `${STORAGE_KEYS.DRAFT_PREFIX}${userId}.${orgId}.${key}`;

  const readDraft = useCallback((): T | null => {
    const raw = safeGet(storageKey);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      safeRemove(storageKey);
      return null;
    }
  }, [storageKey]);

  // Debounced persistence of the live form while enabled.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (isEmpty?.(value) === true) {
      // Nothing worth keeping — drop any stale draft so the banner clears too.
      safeRemove(storageKey);
      return;
    }
    const handle = window.setTimeout(() => {
      safeSet(storageKey, JSON.stringify(value));
    }, debounceMs);
    return () => {
      window.clearTimeout(handle);
    };
  }, [enabled, value, storageKey, debounceMs, isEmpty]);

  const clearDraft = useCallback(() => {
    safeRemove(storageKey);
  }, [storageKey]);

  return { readDraft, clearDraft };
}
