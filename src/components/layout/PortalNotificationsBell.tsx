import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@lib/axios';
import { getApiErrorMessage } from '@lib/api-error';

interface PortalNotification {
  id: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationResponse {
  data?: PortalNotification[];
}

export function PortalNotificationsBell({ route = '/notifications' }: { route?: string }): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const list = useQuery({
    queryKey: ['whistleblowing', 'notifications', 'bell'],
    queryFn: async () => (await apiClient.get<NotificationResponse>('/whistleblowing/notifications', { params: { page: 1, pageSize: 8 } })).data.data ?? [],
    retry: false,
    staleTime: 30_000,
    gcTime: 0,
  });
  const unread = useQuery({
    queryKey: ['whistleblowing', 'notifications', 'unread-count'],
    queryFn: async () => (await apiClient.get<{ count?: number }>('/whistleblowing/notifications/unread-count')).data.count ?? 0,
    retry: false,
    staleTime: 30_000,
    gcTime: 0,
  });
  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/whistleblowing/notifications/${id}/read`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['whistleblowing', 'notifications'] });
    },
  });
  const markAll = useMutation({
    mutationFn: () => apiClient.patch('/whistleblowing/notifications/read-all'),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['whistleblowing', 'notifications'] });
    },
  });

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent): void => {
      if (ref.current !== null && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const items = list.data ?? [];
  const count = unread.data ?? 0;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-md p-1.5 text-brand-primary hover:bg-muted"
        aria-label={t('actions.notifications', { defaultValue: 'Notifications' })}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-[9999] mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-white shadow-xl shadow-brand-primary/10">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <strong className="text-sm text-foreground">Notifications</strong>
            <button type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending || count === 0} className="inline-flex items-center gap-1 text-xs font-medium text-brand-accent disabled:opacity-40">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          {list.isError ? (
            <p className="px-4 py-6 text-sm text-destructive">{getApiErrorMessage(list.error, 'Unable to load notifications.')}</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground/70">No notifications yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.read) markRead.mutate(item.id);
                    setOpen(false);
                    navigate(item.actionUrl ?? route);
                  }}
                  className={`block w-full border-b border-border px-4 py-3 text-start hover:bg-muted/60 ${item.read ? '' : 'bg-brand-accent/5'}`}
                >
                  <span className="flex items-start gap-2">
                    {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-accent" />}
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm text-foreground">{item.title}</strong>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{item.body}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">{new Date(item.createdAt).toLocaleString()}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={() => { setOpen(false); navigate(route); }} className="w-full px-4 py-3 text-center text-xs font-medium text-brand-accent hover:bg-muted/60">View all notifications</button>
        </div>
      )}
    </div>
  );
}
