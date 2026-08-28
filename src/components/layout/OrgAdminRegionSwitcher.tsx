import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWbOversightScope } from '@features/org-admin/hooks/whistleblowing-oversight';

export function OrgAdminRegionSwitcher(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: scope } = useWbOversightScope();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const params = new URLSearchParams(location.search);
  const selected = params.get('regionCode') ?? '';
  const label = selected.length > 0 ? selected : t('regions.all', { defaultValue: 'All regions' });

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent): void => {
      if (ref.current !== null && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const choose = (code: string): void => {
    if (code.length === 0) params.delete('regionCode');
    else params.set('regionCode', code);
    const query = params.toString();
    navigate(`${location.pathname}${query.length > 0 ? `?${query}` : ''}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50" aria-haspopup="listbox" aria-expanded={open}>
        <Globe className="h-4 w-4 text-brand-accent" />
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute end-0 top-full z-[9999] mt-2 min-w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-brand-primary/10">
          <RegionOption label={t('regions.all', { defaultValue: 'All regions' })} selected={selected.length === 0} onClick={() => choose('')} />
          {(scope?.regions ?? []).map((region) => <RegionOption key={region.regionCode} label={`${region.regionCode} (${region.caseCount})`} selected={selected === region.regionCode} onClick={() => choose(region.regionCode)} />)}
        </div>
      )}
    </div>
  );
}

function RegionOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }): ReactElement {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm ${selected ? 'bg-brand-accent/10 font-semibold text-brand-primary' : 'text-slate-600 hover:bg-slate-50'}`}><span className="flex-1">{label}</span>{selected && <Check className="h-4 w-4 text-brand-accent" />}</button>;
}
