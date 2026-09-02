import i18n from '@/i18n';
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastItem {
  id: number;
  type: ToastType;
  /** Optional bold heading. When omitted the message is the primary line. */
  title?: string;
  /** The main text; API-driven toasts usually use the server message. */
  message: string;
  /** Auto-dismiss after this many ms; 0 = stays until closed. */
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}

let counter = 0;

/** Cap concurrent toasts so a burst of requests can't flood the screen. */
const MAX_TOASTS = 4;
const API_SUCCESS_FALLBACK_SUPPRESSION_MS = 1200;
let lastApiSuccessToastAt = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const message = toast.message.trim();
    if (message.length === 0) {
      return 0;
    }
    counter += 1;
    const id = counter;
    set((state) => {
      // Collapse an exact duplicate already on screen (same message + type) so
      // e.g. the global X-Success-Message toast and a component's own toast for
      // the same action don't stack. Then cap the total to avoid flooding.
      const withoutDupes = state.toasts.filter(
        (t) => !(t.message === message && t.type === toast.type),
      );
      return { toasts: [...withoutDupes, { ...toast, message, id }].slice(-MAX_TOASTS) };
    });
    return id;
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clear: () => {
    set({ toasts: [] });
  },
}));

/** Per-type defaults (duration in ms; errors linger longer, loading is sticky). */
const DURATION: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  info: 4000,
  warning: 5000,
  loading: 0,
};

/** Default bold heading per type; the message carries the dynamic/server text. */
const DEFAULT_TITLE_KEY: Record<ToastType, string> = {
  success: 'toast.title.success',
  error: 'toast.title.error',
  info: 'toast.title.info',
  warning: 'toast.title.warning',
  loading: 'toast.title.loading',
};

export interface ToastOptions {
  title?: string;
  duration?: number;
  source?: 'api' | 'ui';
}

type PersistedToastType = Exclude<ToastType, 'loading'>;
const PENDING_TOAST_KEY = 'tellara.pendingToast';
const PERSISTED_TOAST_TYPES: PersistedToastType[] = ['success', 'error', 'info', 'warning'];

/** Queue one notification for the next page load (used by full-page logout). */
export function queueToast(type: PersistedToastType, message: string, options?: Pick<ToastOptions, 'title'>): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ type, message, title: options?.title }));
}

export function consumeQueuedToast(): { type: PersistedToastType; message: string; title?: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_TOAST_KEY);
  if (raw === null) return null;
  sessionStorage.removeItem(PENDING_TOAST_KEY);
  try {
    const parsed = JSON.parse(raw) as { type?: PersistedToastType; message?: string; title?: string };
    if (!parsed.type || !PERSISTED_TOAST_TYPES.includes(parsed.type) || !parsed.message) return null;
    return { type: parsed.type, message: parsed.message, ...(parsed.title ? { title: parsed.title } : {}) };
  } catch {
    return null;
  }
}

function show(type: ToastType, message: string, options?: ToastOptions): number {
  if (type === 'success') {
    const now = Date.now();
    if (options?.source === 'api') {
      lastApiSuccessToastAt = now;
    } else if (now - lastApiSuccessToastAt < API_SUCCESS_FALLBACK_SUPPRESSION_MS) {
      return 0;
    }
  }

  const title = options?.title ?? i18n.t(DEFAULT_TITLE_KEY[type]);
  return useToastStore.getState().push({
    type,
    message,
    title,
    duration: options?.duration ?? DURATION[type],
  });
}

/**
 * Fire a toast from anywhere. Messages are localized here as a final safety net
 * for legacy call sites that still pass fallback English strings.
 */
export const toast = {
  success: (message: string, options?: ToastOptions): number => show('success', message, options),
  error: (message: string, options?: ToastOptions): number => show('error', message, options),
  info: (message: string, options?: ToastOptions): number => show('info', message, options),
  warning: (message: string, options?: ToastOptions): number => show('warning', message, options),
  loading: (message: string, options?: ToastOptions): number => show('loading', message, options),
  dismiss: (id: number): void => {
    useToastStore.getState().dismiss(id);
  },
};
