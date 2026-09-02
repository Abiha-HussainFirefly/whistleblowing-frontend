import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tenantAdminService } from '@features/org-admin/api/tenant-admin.service';
import { useWbOversightScope } from '@features/org-admin/hooks/whistleblowing-oversight';
import { contextQueryKey } from '@lib/context-query-key';

interface RegionOptionData {
  code: string;
  label: string;
}

export function OrgAdminRegionSwitcher(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: scope } = useWbOversightScope();
  const { data: configuredRegions } = useQuery({
    queryKey: contextQueryKey('org-admin-header-regions'),
    queryFn: () => tenantAdminService.regions(),
    staleTime: 60_000,
  });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const params = new URLSearchParams(location.search);
  const selected = params.get('regionCode') ?? '';
  const regionOptions = useMemo<RegionOptionData[]>(() => {
    if (configuredRegions !== undefined) {
      return configuredRegions
        .filter((region) => region.isActive)
        .map((region) => ({ code: region.regionCode, label: `${region.displayName} (${region.regionCode})` }));
    }
    return (scope?.regions ?? []).map((region) => ({
      code: region.regionCode,
      label: `${region.regionCode} (${region.caseCount})`,
    }));
  }, [configuredRegions, scope?.regions]);
  const selectedRegion = regionOptions.find((region) => region.code === selected);
  const label = selectedRegion?.label ?? (selected.length > 0 ? selected : t('regions.all', { defaultValue: 'All regions' }));

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
      <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-2.5 text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted/60" aria-haspopup="listbox" aria-expanded={open}>
        <Globe className="h-4 w-4 text-brand-accent" />
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
      </button>
      {open && (
        <div className="absolute end-0 top-full z-[9999] mt-2 min-w-52 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-xl shadow-brand-primary/10">
          <RegionOption label={t('regions.all', { defaultValue: 'All regions' })} selected={selected.length === 0} onClick={() => choose('')} />
          {regionOptions.map((region) => <RegionOption key={region.code} label={region.label} selected={selected === region.code} onClick={() => choose(region.code)} />)}
        </div>
      )}
    </div>
  );
}

function RegionOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }): ReactElement {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm ${selected ? 'bg-brand-accent/10 font-semibold text-brand-primary' : 'text-muted-foreground hover:bg-muted/60'}`}><span className="flex-1">{label}</span>{selected && <Check className="h-4 w-4 text-brand-accent" />}</button>;
}
