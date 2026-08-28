import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import type { ReactElement } from 'react';
import { apiClient } from '@lib/axios';
import { getApiErrorMessage } from '@lib/api-error';

type Notification = { id: string; title: string; body: string; createdAt: string; read: boolean };

export function NotificationsPage(): ReactElement {
  const query = useQuery({
    queryKey: ['whistleblowing', 'notifications'],
    queryFn: async () => (await apiClient.get<{ data?: Notification[] }>('/whistleblowing/notifications', {})).data.data ?? [],
    retry: false,
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
  });
  return <section className="space-y-5"><header className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent text-white"><Bell className="h-5 w-5" /></div><div><h1 className="text-2xl font-semibold text-brand-primary">Notifications</h1><p className="text-sm text-slate-500">Whistleblowing activity and workflow updates.</p></div></header>{query.isLoading && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading notifications…</div>}{query.isError && <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{getApiErrorMessage(query.error, 'Request failed.')}</div>}{query.data?.length === 0 && !query.isLoading && !query.isError && <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">No notifications yet.</div>}{query.data && query.data.length > 0 && <div className="space-y-3">{query.data.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="font-semibold text-brand-primary">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.body}</p></article>)}</div>}</section>;
}
