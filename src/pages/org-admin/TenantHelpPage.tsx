import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CircleHelp, Compass, Globe, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { tenantAdminService } from '@features/org-admin/api/tenant-admin.service';
import { Input } from '@components/ui/input';
import { PageTitle } from '@components/ui/page-title';
import { Sheet } from '@components/ui/sheet';
import { contextQueryKey } from '@lib/context-query-key';

interface HelpTopic {
  title: string;
  summary: string;
  steps: string[];
}

const topics: HelpTopic[] = [
  { title: 'Dashboard', summary: 'Read the live case health summary at a glance.', steps: ['Review total, open, investigating, closed, and SLA indicators.', 'Use the status, category, priority, and monthly trend visualizations to spot changes.', 'Select Whistleblowing when you need to move from the summary to the permitted case register.'] },
  { title: 'Whistleblowing', summary: 'Review permitted cases within the organization scope.', steps: ['Choose a permitted region when regional access is available.', 'Use Overview for aggregate patterns and Case register for individual permitted records.', 'Filter by status, category, risk, date, or assignment before opening a case.'] },
  { title: 'Reporting & Analytics', summary: 'Compare case and member activity using live records.', steps: ['Use Overview for organization-level case and member totals.', 'Use Whistleblowing for case status, categories, risk, anonymity, and submission trends.', 'Use Users for membership status, roles, regions, and join trends.', 'Export only the filtered records you are authorized to view.'] },
  { title: 'Members', summary: 'Manage organization access for Whistleblowing staff.', steps: ['Choose the portal that matches the person\'s work: organization administration or module work.', 'Assign a role with the least permissions needed for the person\'s responsibilities.', 'Assign a region when access should be limited to a branch; use All regions only for organization-wide access.', 'Review status, role, and regional scope after responsibilities change, and remove access when it is no longer needed.'] },
  { title: 'Regions & Branches', summary: 'Maintain the regions used for case and member scope.', steps: ['Add each branch with a stable region code and a clear display name.', 'Keep active regions available for member assignment, filtering, and case routing.', 'Remember that region is an access boundary: members only see records in their assigned region or regions.', 'Deactivate a region only when it should no longer receive new access or operational data.'] },
  { title: 'Plan & Limits', summary: 'Review live capacity and enabled Whistleblowing services.', steps: ['Review the current plan and organization status.', 'Check admin and user seat usage against the configured limits before inviting someone.', 'Use enabled modules to confirm which Whistleblowing capabilities are available.'] },
  { title: 'Security / MFA', summary: 'Protect organization administrator sign-in.', steps: ['Start MFA setup and scan the displayed QR code with an authenticator app.', 'Enter the current verification code to enable MFA.', 'Store recovery codes securely and use one only if the authenticator is unavailable.', 'Revisit security settings when an administrator changes device or loses access to the authenticator.'] },
];

const relatedTopics: Record<string, string[]> = {
  Dashboard: ['Whistleblowing', 'Reporting & Analytics'],
  Whistleblowing: ['Dashboard', 'Regions & Branches', 'Reporting & Analytics'],
  'Reporting & Analytics': ['Whistleblowing', 'Members', 'Regions & Branches'],
  Members: ['Regions & Branches', 'Plan & Limits', 'Reporting & Analytics'],
  'Regions & Branches': ['Members', 'Whistleblowing', 'Reporting & Analytics'],
  'Plan & Limits': ['Members', 'Security / MFA'],
  'Security / MFA': ['Members', 'Plan & Limits'],
};

function findTopic(title: string): HelpTopic | undefined {
  return topics.find((topic) => topic.title === title);
}

export function TenantHelpPage(): React.ReactElement {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HelpTopic | null>(null);
  const regions = useQuery({
    queryKey: contextQueryKey('help-active-regions'),
    queryFn: () => tenantAdminService.regions(),
    staleTime: 60_000,
  });
  const filtered = useMemo(() => topics.filter((topic) => `${topic.title} ${topic.summary} ${topic.steps.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase())), [search]);
  const related = selected === null ? [] : (relatedTopics[selected.title] ?? []).map(findTopic).filter((topic): topic is HelpTopic => topic !== undefined);
  const activeRegions = regions.data?.filter((region) => region.isActive) ?? [];
  const selectedRegionCode = new URLSearchParams(location.search).get('regionCode');
  const selectedRegion = activeRegions.find((region) => region.regionCode === selectedRegionCode);
  const regionScopeLabel = selectedRegion !== undefined
    ? `${selectedRegion.displayName} (${selectedRegion.regionCode})`
    : activeRegions.length > 0
      ? activeRegions.map((region) => `${region.displayName} (${region.regionCode})`).join(', ')
      : selectedRegionCode ?? 'All regions';

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-accent text-white"><BookOpen className="h-5 w-5" /></span>
        <div>
          <PageTitle as="h2" className="mt-1 text-foreground">Help &amp; concepts</PageTitle>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Clear guidance for the Org Admin Whistleblowing modules and the actions available in each one.</p>
        </div>
        <div className="ml-auto hidden items-center gap-2 rounded-lg border border-brand-accent/20 bg-brand-accent/5 px-3 py-2 text-xs sm:flex">
          <Globe className="h-4 w-4 text-brand-accent" />
          <span className="text-muted-foreground">{selectedRegion === undefined ? 'Active regions' : 'Active region'}</span>
          <span className="max-w-64 truncate font-semibold text-brand-primary" title={regionScopeLabel}>{regionScopeLabel}</span>
        </div>
      </header>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 bg-white pl-9" placeholder="Search Whistleblowing help..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {filtered.length === 0 ? <div className="rounded-xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">No help topics match your search.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((topic) => <button key={topic.title} type="button" onClick={() => setSelected(topic)} className="group rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:border-brand-accent/40 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent"><CircleHelp className="h-4 w-4" /></span><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent">Follow guidance flow <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span></div><h3 className="mt-4 font-semibold text-foreground">{topic.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{topic.summary}</p></button>)}</div>}

      <Sheet isOpen={selected !== null} onClose={() => setSelected(null)} title={selected?.title ?? 'Help'} description="Follow the guidance flow, then continue through a related topic." width="lg">
        {selected !== null && <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent"><Compass className="h-5 w-5" /></span><p className="text-sm font-medium leading-6 text-foreground">{selected.summary}</p></div>
          <ol className="space-y-3">{selected.steps.map((step, index) => <li key={step} className="flex gap-3 rounded-xl border border-border bg-white p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-semibold text-white">{index + 1}</span><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-accent">Step {index + 1}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{step}</p></div></li>)}</ol>
          {related.length > 0 && <div className="border-t border-border pt-5"><p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Compass className="h-3.5 w-3.5 text-brand-accent" />Continue the guidance flow</p><div className="space-y-2">{related.map((topic) => <button key={topic.title} type="button" onClick={() => setSelected(topic)} className="group flex w-full items-center gap-3 rounded-xl border border-border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-accent/40 hover:shadow-md"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent"><CircleHelp className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{topic.title}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{topic.summary}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand-accent" /></button>)}</div></div>}
        </div>}
      </Sheet>
    </div>
  );
}
