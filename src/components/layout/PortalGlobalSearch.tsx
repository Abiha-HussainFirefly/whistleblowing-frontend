import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CornerDownLeft, FileSearch, Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@lib/axios';
import { ROUTES } from '@config/routes';
import type { WbCaseListItem } from '@features/whistleblowing/types';

export function PortalGlobalSearch({ admin = false }: { admin?: boolean }): ReactElement {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['whistleblowing', 'global-search', term.trim(), admin],
    queryFn: async () => (await apiClient.get<{ data?: WbCaseListItem[] }>('/whistleblowing/cases', { params: { search: term.trim(), page: 1, pageSize: 10 } })).data.data ?? [],
    enabled: open && term.trim().length >= 2,
    retry: false,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true); }
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 0); else setTerm(''); }, [open]);

  const go = (id: string): void => { setOpen(false); navigate(admin ? ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL(id) : ROUTES.WHISTLEBLOWING_DETAIL(id)); };
  const cases = query.data ?? [];

  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-md p-1.5 text-brand-primary hover:bg-slate-100" aria-label="Search" title="Search"><Search className="h-5 w-5" /></button>
    {open && <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 pt-3 sm:p-4 sm:pt-[10vh]" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Global search">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4"><Search className="h-5 w-5 shrink-0 text-slate-400" /><input ref={inputRef} value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search cases…" className="h-14 min-w-0 flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none" /><button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Close search"><X className="h-5 w-5" /></button></div>
        <div className="min-h-[12rem] overflow-y-auto py-2">
          {term.trim().length < 2 ? <div className="px-4 py-10 text-center"><FileSearch className="mx-auto mb-3 h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">Search across whistleblowing cases.</p></div> : query.isFetching ? <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Searching cases…</div> : query.isError ? <p className="px-4 py-10 text-center text-sm text-red-600">Search is unavailable right now.</p> : cases.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">No cases match “{term.trim()}”.</p> : <div>{cases.map((item) => <button key={item.id} type="button" onClick={() => go(item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-start hover:bg-slate-50"><span className="rounded-md bg-brand-accent/10 p-2 text-brand-accent"><FileSearch className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-900">{item.caseReferenceNumber}</strong><span className="block truncate text-xs text-slate-500">{item.category.replaceAll('_', ' ')} · {item.status.replaceAll('_', ' ')}</span></span></button>)}</div>}
        </div>
        <div className="flex items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-400"><span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" />Navigate</span><span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" />Open</span><span>Esc Close</span></div>
      </div>
    </div>}
  </>;
}
