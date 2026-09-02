import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import { consumeQueuedToast, toast, useToastStore, type ToastItem } from '@store/toastStore';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
} as const;

function Toast({ item }: { item: ToastItem }): ReactElement {
  const Icon = ICONS[item.type];
  const dismiss = useToastStore((state) => state.dismiss);
  const iconClass = item.type === 'error' ? 'text-destructive' : item.type === 'success' ? 'text-brand-accent' : 'text-muted-foreground';

  return (
    <div
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-lg"
      role={item.type === 'error' ? 'alert' : 'status'}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass} ${item.type === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {item.title && <p className="text-sm font-semibold text-foreground">{item.title}</p>}
        <p className="mt-0.5 break-words text-sm text-muted-foreground">{item.message}</p>
      </div>
      <button type="button" className="-mr-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastViewport(): ReactElement {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const queued = consumeQueuedToast();
    if (queued) toast[queued.type](queued.message, queued.title ? { title: queued.title } : undefined);
  }, []);

  useEffect(() => {
    const timers = toasts
      .filter((item) => item.duration > 0)
      .map((item) => window.setTimeout(() => dismiss(item.id), item.duration));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dismiss, toasts]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[10000] flex flex-col items-center gap-2 px-4 sm:items-end" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => <Toast key={item.id} item={item} />)}
    </div>
  );
}
