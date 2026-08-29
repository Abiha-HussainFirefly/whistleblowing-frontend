import { type FormEvent, type ReactElement, type ReactNode, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlarmClock,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe,
  HelpCircle,
  Info,
  Link2,
  Layers,
  FileText,
  LockKeyhole,
  MessageSquareWarning,
  Pencil,
  Plus,
  Package,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Tags,
  Table2,
  Trash2,
  TrendingUp,
  UserCog,
  UserPlus,
  UserRoundCheck,
  UserCircle,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Loader } from '@components/common/Loader';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { PageTitle } from '@components/ui/page-title';
import { Pagination } from '@components/ui/pagination';
import { Sheet } from '@components/ui/sheet';
import { ROUTES } from '@config/routes';
import { getApiErrorMessage } from '@lib/api-error';
import { contextQueryKey } from '@lib/context-query-key';
import { useAuthStore } from '@store/authStore';
import { tenantAdminService, type TenantInvitation, type TenantMember, type TenantRegion } from '@features/org-admin/api/tenant-admin.service';
import { useWbOversightCases, useWbOversightStats } from '@features/org-admin/hooks/whistleblowing-oversight';
import type { InvestigationPriority, WbCaseListItem, WbStats, WhistleblowingCategory, WhistleblowingStatus } from '@features/whistleblowing/types';
import { WB_CATEGORY_LABEL, WB_PRIORITY_LABEL, WB_STATUS_LABEL, formatDate, wbCategoryLabelOf, wbPriorityLabelOf, wbStatusLabelOf } from '@features/whistleblowing/utils/format';

const tenantQueryKey = (name: string) => contextQueryKey(`tenant-${name}`);

function TenantPageHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: ReactElement;
}): ReactElement {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-white">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <PageTitle as="h2" className="text-foreground">{title}</PageTitle>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function DataState({ isLoading, error, empty, children }: { isLoading: boolean; error?: unknown; empty?: boolean; children: ReactNode }): ReactElement {
  if (isLoading) return <Loader label="Loading..." />;
  if (error !== undefined && error !== null) return <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">{getApiErrorMessage(error)}</div>;
  if (empty) return <div className="rounded-lg border border-border bg-white p-10 text-center text-sm text-muted-foreground">No records found.</div>;
  return <>{children}</>;
}

function ConceptCallout({ children }: { children: string }): ReactElement {
  return <div className="mb-6 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" /><span>{children}</span></div>;
}

type ReportingTab = 'overview' | 'matters' | 'contracts' | 'assets' | 'compliance' | 'whistleblowing' | 'users';

const reportingTabs: { key: ReportingTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'matters', label: 'Matters' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'assets', label: 'Assets' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'whistleblowing', label: 'Whistleblowing' },
  { key: 'users', label: 'Users' },
];

interface ReportingUsersData {
  members: TenantMember[];
  invitations: TenantInvitation[];
}

export function TenantReportingPage(): ReactElement {
  const [tab, setTab] = useState<ReportingTab>('overview');
  const wb = useWbOversightStats();
  const tenantStats = useQuery({
    queryKey: tenantQueryKey('reporting-stats'),
    queryFn: () => tenantAdminService.stats(),
    enabled: tab === 'overview' || tab === 'users',
    staleTime: 30_000,
  });
  const users = useQuery<ReportingUsersData>({
    queryKey: tenantQueryKey('reporting-users'),
    queryFn: async () => {
      const [members, invitations] = await Promise.all([tenantAdminService.members(), tenantAdminService.invitations()]);
      return { members: members.data, invitations: invitations.data };
    },
    enabled: tab === 'overview' || tab === 'users',
    staleTime: 30_000,
  });
  return <div>
    <TenantPageHeader icon={BarChart3} title="Reporting & Analytics" subtitle="Cross-module analytics with rich filters and CSV, Excel & PDF exports." />
    <div className="mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border">
      {reportingTabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === item.key ? 'border-brand-accent text-brand-accent' : 'border-transparent text-muted-foreground hover:border-brand-accent hover:text-brand-accent'}`}>{item.label}</button>)}
    </div>
    {tab === 'overview' && <>{wb.isLoading || tenantStats.isLoading ? <Loader label="Loading reporting overview..." /> : wb.error ? <DataState isLoading={false} error={wb.error}>{null}</DataState> : tenantStats.error ? <DataState isLoading={false} error={tenantStats.error}>{null}</DataState> : <ReportingOverview stats={wb.data} users={users} tenantStats={tenantStats.data} onSelect={setTab} />}</>}
    {tab !== 'overview' && tab !== 'whistleblowing' && tab !== 'users' && <ReportingUnavailableView title={reportingTabs.find((item) => item.key === tab)?.label ?? 'Reporting'} />}
    {tab === 'whistleblowing' && <>{wb.isLoading ? <Loader label="Loading Whistleblowing analytics..." /> : wb.error ? <DataState isLoading={false} error={wb.error}>{null}</DataState> : <WhistleblowingReportView stats={wb.data} />}</>}
    {tab === 'users' && <UsersReportView query={users} totalMembers={tenantStats.data?.members} />}
  </div>;
}

function normalizeStatus(value: string): string {
  return value.toLowerCase().replace(/^wb_/, '').replaceAll('_', ' ');
}

function ReportingOverview({ stats, users, tenantStats, onSelect }: { stats: WbStats | undefined; users: UseQueryResult<ReportingUsersData>; tenantStats: { members: number; users: number } | undefined; onSelect: (tab: ReportingTab) => void }): ReactElement {
  const activeUsers = users.data?.members.filter((member) => normalizeStatus(member.status) === 'active').length;
  const cards: { title: string; value: number | string; metrics: { value: number | string; label: string }[]; icon: LucideIcon; tab: ReportingTab }[] = [
    { title: 'Matters', value: '—', metrics: [{ value: '—', label: 'Open' }, { value: '—', label: 'Claim Value' }], icon: Briefcase, tab: 'matters' },
    { title: 'Contracts', value: '—', metrics: [{ value: '—', label: 'Active' }, { value: '—', label: 'Value' }], icon: FileText, tab: 'contracts' },
    { title: 'Assets', value: '—', metrics: [{ value: '—', label: 'Encumbered' }, { value: '—', label: 'Documented' }], icon: Package, tab: 'assets' },
    { title: 'Compliance', value: '—', metrics: [{ value: '—', label: 'Approved' }, { value: '—', label: 'Review Overdue' }], icon: ShieldCheck, tab: 'compliance' },
    { title: 'Whistleblowing', value: stats?.total ?? '—', metrics: [{ value: stats?.open ?? '—', label: 'Open' }, { value: stats?.slaBreached ?? '—', label: 'SLA Breached' }], icon: MessageSquareWarning, tab: 'whistleblowing' },
    { title: 'Users', value: tenantStats?.members ?? users.data?.members.length ?? '—', metrics: [{ value: activeUsers ?? '—', label: 'Active' }], icon: Users, tab: 'users' },
  ];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map((card) => <ReportCard key={card.title} {...card} onClick={() => onSelect(card.tab)} />)}</div>;
}

function ReportCard({ title, value, metrics, icon: Icon, onClick }: { title: string; value: number | string; metrics: { value: number | string; label: string }[]; icon: LucideIcon; tab: ReportingTab; onClick: () => void }): ReactElement {
  return <button type="button" onClick={onClick} className="rounded-lg border border-border bg-white p-4 text-left transition-shadow hover:shadow-md"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-accent/10 text-brand-accent"><Icon className="h-4 w-4" /></span><h3 className="text-sm font-semibold text-brand-primary">{title}</h3></div><ChevronRight className="h-4 w-4 text-muted-foreground/70" /></div><p className="mt-3 text-base font-semibold text-brand-primary">{value}</p><p className="text-xs text-muted-foreground/70">Total records</p>{metrics.length > 0 && <div className="mt-3 flex gap-8 border-t border-border pt-3">{metrics.map((metric) => <div key={metric.label}><p className="text-sm font-semibold text-foreground">{metric.value}</p><p className="text-[11px] text-muted-foreground">{metric.label}</p></div>)}</div>}</button>;
}

function ReportingUnavailableView({ title }: { title: string }): ReactElement {
  return <section className="rounded-lg border border-border bg-white p-10 text-center"><BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/70" /><h3 className="mt-3 font-semibold text-foreground">{title} reporting is unavailable</h3><p className="mt-1 text-sm text-muted-foreground">This standalone Whistleblowing deployment has no live {title.toLowerCase()} data source.</p></section>;
}

function WhistleblowingReportView({ stats }: { stats: WbStats | undefined }): ReactElement {
  const navigate = useNavigate();
  const [view, setView] = useState<'stats' | 'table'>('stats');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WhistleblowingStatus | ''>('');
  const [category, setCategory] = useState<WhistleblowingCategory | ''>('');
  const [priority, setPriority] = useState<InvestigationPriority | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const params = useMemo(() => ({ page, pageSize, ...(search.trim() ? { search: search.trim() } : {}), ...(status ? { status } : {}), ...(category ? { category } : {}), ...(priority ? { priority } : {}), ...(dateFrom ? { dateFrom } : {}), ...(dateTo ? { dateTo } : {}) }), [page, pageSize, search, status, category, priority, dateFrom, dateTo]);
  const cases = useWbOversightCases(params);
  const filteredStats = useWbOversightStats({ ...(dateFrom ? { dateFrom } : {}), ...(dateTo ? { dateTo } : {}) });
  const reportStats = filteredStats.data ?? stats;
  const statusRows = Object.entries(reportStats?.byStatus ?? {});
  const categoryRows = Object.entries(reportStats?.byCategory ?? {});
  const priorityRows = Object.entries(reportStats?.byPriority ?? {});
  const anonymityRows: [string, number][] = [['Anonymous', reportStats?.anonymousCount ?? 0], ['Named', reportStats?.namedCount ?? 0]];
  const hasCases = (reportStats?.total ?? 0) > 0;
  const resetPage = (): void => setPage(1);

  return <div className="space-y-5">
    <div className="flex w-full items-center gap-2 overflow-x-auto pb-1">
      <div className="relative min-w-[9.5rem] flex-1 sm:flex-none"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" /><Input value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder="Search..." className="h-9 w-full bg-white pl-8 text-xs sm:w-28" /></div>
      <ReportSelect ariaLabel="Status" value={status} onChange={(value) => { setStatus(value as WhistleblowingStatus | ''); resetPage(); }}><option value="">Status</option>{Object.entries(WB_STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</ReportSelect>
      <ReportSelect ariaLabel="Category" value={category} onChange={(value) => { setCategory(value as WhistleblowingCategory | ''); resetPage(); }}><option value="">Category</option>{Object.entries(WB_CATEGORY_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</ReportSelect>
      <ReportSelect ariaLabel="Priority" value={priority} onChange={(value) => { setPriority(value as InvestigationPriority | ''); resetPage(); }}><option value="">Priority</option>{Object.entries(WB_PRIORITY_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</ReportSelect>
      <ReportSelect ariaLabel="Submitted Date" value="submittedAt" onChange={() => undefined}><option value="submittedAt">Submitted Date</option></ReportSelect>
      <ReportDateInput ariaLabel="From" value={dateFrom} onChange={(value) => { setDateFrom(value); resetPage(); }} placeholder="From" />
      <ReportDateInput ariaLabel="To" value={dateTo} onChange={(value) => { setDateTo(value); resetPage(); }} placeholder="To" />
      <ReportViewToggle view={view} onChange={setView} tableLabel="Case register" />
    </div>
    {view === 'stats' && <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ReportMetric label="Total Cases" value={reportStats?.total ?? 0} icon={MessageSquareWarning} />
        <ReportMetric label="Open" value={reportStats?.open ?? 0} icon={Activity} />
        <ReportMetric label="Investigating" value={reportStats?.underInvestigation ?? 0} icon={TrendingUp} />
        <ReportMetric label="SLA Breached" value={reportStats?.slaBreached ?? 0} icon={AlarmClock} />
        <ReportMetric label="Avg Resolution" value={reportStats?.avgResolutionDays === null || reportStats?.avgResolutionDays === undefined ? '—' : `${reportStats.avgResolutionDays} d`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportChartCard title="By Status"><ReportDonut rows={statusRows.map(([key, count]) => ({ label: wbStatusLabelOf(key), count }))} /></ReportChartCard>
        <ReportChartCard title="By Category"><ReportHorizontalBars rows={categoryRows.map(([key, count]) => ({ label: wbCategoryLabelOf(key), count }))} /></ReportChartCard>
        <ReportChartCard title="By Risk Rating"><ReportColumns rows={priorityRows.map(([key, count]) => ({ label: wbPriorityLabelOf(key), count }))} /></ReportChartCard>
        <ReportChartCard title="Anonymous vs. Named"><ReportDonut rows={anonymityRows.map(([label, count]) => ({ label, count }))} /></ReportChartCard>
      </div>
       <ReportChartCard title="Reports / Month" subtitle="Trailing 12 months"><ReportTimeSeries points={reportStats?.submissionsByMonth ?? []} /></ReportChartCard>
    </>}
    {view === 'table' && <>
      {cases.isLoading ? <Loader label="Loading Whistleblowing records..." /> : cases.error ? <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">{getApiErrorMessage(cases.error)}</div> : <section className="overflow-hidden rounded-lg border border-border bg-white"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/50"><tr>{['Reference', 'Category', 'Priority', 'Status', 'Region', 'Anonymous', 'Investigator', 'Submitted', 'SLA Deadline', 'SLA Breached', 'Closed'].map((heading) => <th key={heading} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{(cases.data?.data ?? []).length === 0 ? <tr><td colSpan={11} className="px-3 py-10 text-center text-sm text-muted-foreground/70">{hasCases ? 'No records match these filters.' : 'No data yet.'}</td></tr> : cases.data?.data.map((item) => <WbReportRow key={item.id} item={item} onOpen={() => navigate(ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL(item.id))} />)}</tbody></table></div><Pagination meta={cases.data?.meta} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></section>}
    </>}
  </div>;
}

function ReportSelect({ ariaLabel, value, onChange, children }: { ariaLabel: string; value: string; onChange: (value: string) => void; children: ReactNode }): ReactElement {
  return <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 min-w-[6.75rem] shrink-0 rounded-md border border-border bg-white px-2.5 text-xs text-muted-foreground outline-none focus:border-signal">{children}</select>;
}

function ReportDateInput({ ariaLabel, value, onChange, placeholder }: { ariaLabel: string; value: string; onChange: (value: string) => void; placeholder: string }): ReactElement {
  return <div className="relative min-w-[7.25rem] shrink-0"><input aria-label={ariaLabel} type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-md border border-border bg-white px-2.5 text-xs text-muted-foreground outline-none focus:border-signal" />{!value && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">{placeholder}</span>}</div>;
}

function ReportViewToggle({ view, onChange, tableLabel }: { view: 'stats' | 'table'; onChange: (view: 'stats' | 'table') => void; tableLabel: string }): ReactElement {
  return <div className="flex shrink-0 gap-1 border-b border-border"><button type="button" onClick={() => onChange('stats')} className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${view === 'stats' ? 'border-brand-accent text-brand-primary' : 'border-transparent text-muted-foreground hover:text-brand-primary'}`}><BarChart3 className="h-4 w-4" />Stats</button><button type="button" onClick={() => onChange('table')} className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${view === 'table' ? 'border-brand-accent text-brand-primary' : 'border-transparent text-muted-foreground hover:text-brand-primary'}`}><Table2 className="h-4 w-4" />{tableLabel}</button></div>;
}

function ReportMetric({ label, value, icon: Icon = Layers }: { label: string; value: number | string; icon?: LucideIcon }): ReactElement {
  return <div className="rounded-lg border border-border bg-white p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-base font-semibold text-brand-primary">{value}</p></div><span className="shrink-0 rounded-md bg-brand-accent/10 p-1.5 text-brand-accent"><Icon className="h-4 w-4" /></span></div></div>;
}

function ReportChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }): ReactElement {
  return <section className="rounded-lg border border-border bg-white p-4"><h3 className="text-sm font-semibold text-brand-primary">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-muted-foreground/70">{subtitle}</p>}<div className="mt-3">{children}</div></section>;
}

interface ChartRow { label: string; count: number }

function EmptyChart(): ReactElement {
  return <div className="flex h-48 items-center justify-center text-xs text-muted-foreground/70">No data to display yet.</div>;
}

function ReportDonut({ rows }: { rows: ChartRow[] }): ReactElement {
  if (rows.length === 0) return <EmptyChart />;
  return <div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={rows} dataKey="count" nameKey="label" innerRadius={56} outerRadius={82} paddingAngle={2} stroke="#fff" strokeWidth={2}>{rows.map((row, index) => <Cell key={row.label} fill={['#008b95', '#3981ef', '#7c5ce7', '#f59e0b', '#ef6b73', '#6e8ca8'][index % 6]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} /></PieChart></ResponsiveContainer></div>;
}

function ReportColumns({ rows }: { rows: ChartRow[] }): ReactElement {
  if (rows.length === 0) return <EmptyChart />;
  return <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}><CartesianGrid stroke="#edf2f7" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8495ad' }} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8495ad' }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} /><Bar dataKey="count" fill="#008b95" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

function ReportHorizontalBars({ rows }: { rows: ChartRow[] }): ReactElement {
  if (rows.length === 0) return <EmptyChart />;
  return <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}><CartesianGrid stroke="#edf2f7" horizontal={false} /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 10, fill: '#63748d' }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} /><Bar dataKey="count" fill="#008b95" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div>;
}

function ReportTimeSeries({ points }: { points: { month: string; count: number }[] }): ReactElement {
  if (points.length === 0 || points.every((point) => point.count === 0)) return <EmptyChart />;
  return <div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 4 }}><defs><linearGradient id="reportTealFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#008b95" stopOpacity={0.25} /><stop offset="100%" stopColor="#008b95" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#edf2f7" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8495ad' }} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8495ad' }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} /><Area type="monotone" dataKey="count" name="Reports" stroke="#008b95" fill="url(#reportTealFill)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>;
}

function WbReportRow({ item, onOpen }: { item: WbCaseListItem; onOpen: () => void }): ReactElement {
  return <tr className="hover:bg-muted/60"><td className="whitespace-nowrap px-3 py-2"><button type="button" onClick={onOpen} className="font-medium text-brand-accent hover:underline">{item.caseReferenceNumber}</button></td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{wbCategoryLabelOf(item.category)}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{wbPriorityLabelOf(item.priority)}</td><td className="whitespace-nowrap px-3 py-2"><Badge>{wbStatusLabelOf(item.status)}</Badge></td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{item.regionCode ?? '—'}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{item.isAnonymous ? 'Yes' : 'No'}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{item.assignedInvestigator?.displayName ?? item.assignedInvestigator?.email ?? '—'}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDate(item.submittedAt)}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDate(item.slaDeadline)}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{item.slaBreachedAt ? 'Yes' : 'No'}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDate(item.closedAt)}</td></tr>;
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function monthKey(date: string): string {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? '' : `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

function lastSixMonths(): string[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

function UsersReportView({ query, totalMembers }: { query: UseQueryResult<ReportingUsersData>; totalMembers?: number }): ReactElement {
  const [view, setView] = useState<'stats' | 'table'>('stats');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const data = query.data;
  const members = data?.members ?? [];
  const statuses = useMemo(() => Array.from(new Set(members.map((member) => member.status))), [members]);
  const roles = useMemo(() => Array.from(new Set(members.flatMap((member) => member.roles.map((item) => item.name)))), [members]);
  const accountStatuses = useMemo(() => Array.from(new Set(members.map((member) => member.accountStatus))), [members]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return members.filter((member) => {
      const searchable = `${member.displayName ?? ''} ${member.email}`.toLowerCase();
      const joinedDate = member.joinedAt.slice(0, 10);
      return (!needle || searchable.includes(needle)) && (!status || member.status === status) && (!role || member.roles.some((item) => item.name === role)) && (!accountStatus || member.accountStatus === accountStatus) && (!dateFrom || joinedDate >= dateFrom) && (!dateTo || joinedDate <= dateTo);
    });
  }, [accountStatus, dateFrom, dateTo, members, role, search, status]);
  const points = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((member) => {
      const key = monthKey(member.joinedAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return lastSixMonths().map((month) => ({ month, count: counts.get(month) ?? 0 }));
  }, [members]);
  const statusRows = useMemo(() => countRows(members.map((member) => titleCase(normalizeStatus(member.status)))), [members]);
  const accountRows = useMemo(() => countRows(members.map((member) => titleCase(normalizeStatus(member.accountStatus)))), [members]);
  const roleRows = useMemo(() => countRows(members.flatMap((member) => member.roles.map((role) => role.name))), [members]);
  const regionRows = useMemo(() => countRows(members.map((member) => member.regionCode ?? 'Unassigned')), [members]);
  const active = members.filter((member) => normalizeStatus(member.status) === 'active').length;
  const invited = (data?.invitations ?? []).filter((invitation) => normalizeStatus(invitation.status) !== 'accepted').length;
  const suspended = members.filter((member) => normalizeStatus(member.status) === 'suspended').length;
  const distinctUsers = new Set(members.map((member) => member.userId)).size;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const meta = { page, pageSize, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)) };
  const resetPage = (): void => setPage(1);

  if (query.isLoading) return <Loader label="Loading Users analytics..." />;
  if (query.error) return <DataState isLoading={false} error={query.error}>{null}</DataState>;

  return <div className="space-y-5">
    <div className="flex w-full items-center gap-2 overflow-x-auto pb-1">
      <div className="relative min-w-[9.5rem] flex-1 sm:flex-none"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" /><Input value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder="Search..." className="h-9 w-full bg-white pl-8 text-xs sm:w-28" /></div>
      <ReportSelect ariaLabel="Membership Status" value={status} onChange={(value) => { setStatus(value); resetPage(); }}><option value="">Membership Status</option>{statuses.map((value) => <option key={value} value={value}>{titleCase(normalizeStatus(value))}</option>)}</ReportSelect>
      <ReportSelect ariaLabel="Platform Role" value={role} onChange={(value) => { setRole(value); resetPage(); }}><option value="">Platform Role</option>{roles.map((value) => <option key={value} value={value}>{value}</option>)}</ReportSelect>
      <ReportSelect ariaLabel="Account Status" value={accountStatus} onChange={(value) => { setAccountStatus(value); resetPage(); }}><option value="">Account Status</option>{accountStatuses.map((value) => <option key={value} value={value}>{titleCase(normalizeStatus(value))}</option>)}</ReportSelect>
      <ReportSelect ariaLabel="Active Date" value="joinedAt" onChange={() => undefined}><option value="joinedAt">Active Date</option></ReportSelect>
      <ReportDateInput ariaLabel="From" value={dateFrom} onChange={(value) => { setDateFrom(value); resetPage(); }} placeholder="From" />
      <ReportDateInput ariaLabel="To" value={dateTo} onChange={(value) => { setDateTo(value); resetPage(); }} placeholder="To" />
      <ReportViewToggle view={view} onChange={setView} tableLabel="Table" />
    </div>
    {view === 'stats' && <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ReportMetric label="Memberships" value={totalMembers ?? members.length} icon={Users} />
        <ReportMetric label="Direct Users" value={distinctUsers} icon={Users} />
        <ReportMetric label="Active" value={active} icon={CheckCircle2} />
        <ReportMetric label="Invited" value={invited} icon={UserPlus} />
        <ReportMetric label="Suspended" value={suspended} icon={Shield} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportChartCard title="Membership Status"><ReportColumns rows={statusRows} /></ReportChartCard>
        <ReportChartCard title="Portal Role"><ReportHorizontalBars rows={roleRows} /></ReportChartCard>
        <ReportChartCard title="Account Status"><ReportDonut rows={accountRows} /></ReportChartCard>
        <ReportChartCard title="Region"><ReportHorizontalBars rows={regionRows} /></ReportChartCard>
      </div>
      <ReportChartCard title="New Members / Month" subtitle="Members joined by month"><ReportTimeSeries points={points} /></ReportChartCard>
    </>}
    {view === 'table' && <section className="overflow-hidden rounded-lg border border-border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-muted/50"><tr>{['Email', 'Display Name', 'Region', 'Membership Status', 'Role', 'Account Status', 'MFA', 'Last Login', 'Joined'].map((heading) => <th key={heading} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{pageRows.length === 0 ? <tr><td colSpan={9} className="px-3 py-10 text-center text-sm text-muted-foreground/70">{members.length > 0 ? 'No records match these filters.' : 'No data yet.'}</td></tr> : pageRows.map((member) => <tr key={member.id} className="hover:bg-muted/60"><td className="whitespace-nowrap px-3 py-2 font-medium text-brand-primary">{member.email}</td><td className="whitespace-nowrap px-3 py-2 text-foreground">{member.displayName ?? '—'}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{member.regionCode ?? '—'}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{titleCase(normalizeStatus(member.status))}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{member.roles[0]?.name ?? '—'}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{titleCase(normalizeStatus(member.accountStatus))}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">—</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">—</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDate(member.joinedAt)}</td></tr>)}</tbody></table></div><Pagination meta={meta} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} /></section>}
  </div>;
}

function countRows(values: string[]): ChartRow[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts, ([label, count]) => ({ label, count }));
}

export function TenantMembersPage(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [membersPage, setMembersPage] = useState(1);
  const [membersPageSize, setMembersPageSize] = useState(20);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const [invitationsPageSize, setInvitationsPageSize] = useState(20);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [roleId, setRoleId] = useState('');
  const [editingMember, setEditingMember] = useState<TenantMember | null>(null);
  const [editingStatus, setEditingStatus] = useState('ACTIVE');
  const [editingRegion, setEditingRegion] = useState('');
  const invitationsTab = location.pathname === ROUTES.ORG_ADMIN.MEMBER_INVITATIONS;
  const stats = useQuery({ queryKey: tenantQueryKey('stats'), queryFn: () => tenantAdminService.stats() });
  const members = useQuery({ queryKey: [...tenantQueryKey('members'), search, membersPage, membersPageSize], queryFn: () => tenantAdminService.members({ page: membersPage, pageSize: membersPageSize, ...(search ? { search } : {}) }), placeholderData: (previous) => previous });
  const invitations = useQuery({ queryKey: [...tenantQueryKey('invitations'), invitationsPage, invitationsPageSize], queryFn: () => tenantAdminService.invitations({ page: invitationsPage, pageSize: invitationsPageSize }), enabled: invitationsTab, placeholderData: (previous) => previous });
  const regions = useQuery({ queryKey: tenantQueryKey('regions'), queryFn: () => tenantAdminService.regions() });
  const roles = useQuery({ queryKey: tenantQueryKey('roles'), queryFn: () => tenantAdminService.roles() });
  const invite = useMutation({ mutationFn: () => tenantAdminService.createInvitation({ email, ...(displayName ? { displayName } : {}), ...(regionCode ? { regionCode } : {}), ...(roleId ? { roleId } : {}) }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: tenantQueryKey('invitations') }); void queryClient.invalidateQueries({ queryKey: tenantQueryKey('stats') }); setInviteOpen(false); setEmail(''); setDisplayName(''); setRegionCode(''); setRoleId(''); } });
  const updateMember = useMutation({
    mutationFn: () => editingMember === null ? Promise.reject(new Error('No member selected.')) : tenantAdminService.updateMember(editingMember.id, { status: editingStatus, regionCode: editingRegion || null }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: tenantQueryKey('members') }); void queryClient.invalidateQueries({ queryKey: tenantQueryKey('stats') }); setEditingMember(null); },
  });
  const revoke = useMutation({ mutationFn: (id: string) => tenantAdminService.revokeInvitation(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: tenantQueryKey('invitations') }) });
  const submitInvite = (event: FormEvent) => { event.preventDefault(); if (email.trim()) invite.mutate(); };
  const memberRows = members.data?.data ?? [];
  const memberMeta = members.data?.meta;
  const invitationRows = invitations.data?.data ?? [];
  const invitationMeta = invitations.data?.meta;
  const openInvite = () => { invite.reset(); setEmail(''); setDisplayName(''); setRegionCode(''); setRoleId(''); setInviteOpen(true); };
  return <div>
    <TenantPageHeader icon={Users} title="Team Members" subtitle="Manage organization members and invitations across your regions." action={<div className="flex flex-wrap items-center gap-3"><div className="hidden items-center divide-x divide-border rounded-xl border border-border bg-white shadow-sm sm:flex"><span className="px-3 py-2 text-xs text-muted-foreground">Admin <strong className="text-foreground">{stats.data?.admins ?? '—'}</strong></span><span className="px-3 py-2 text-xs text-muted-foreground">User <strong className="text-foreground">{stats.data?.users ?? '—'}</strong></span></div><Button className="h-9 rounded-lg px-4 text-xs font-semibold"><HelpCircle className="h-4 w-4" />Take a tour</Button></div>} />
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-brand-accent/25 bg-brand-accent/5 p-4"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" /><div><p className="text-sm font-semibold text-brand-primary">How team access works</p><p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">A member chooses three choices: portal, role, and region. Set them when you invite, and change them later from Edit.</p></div><button type="button" aria-label="Dismiss" className="ml-auto text-muted-foreground/70">×</button></div>
    <div className="mb-5 flex items-center gap-1 border-b border-border"><button type="button" className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${!invitationsTab ? 'border-brand-accent text-brand-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => navigate(ROUTES.ORG_ADMIN.MEMBERS)}>Members</button><button type="button" className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${invitationsTab ? 'border-brand-accent text-brand-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => navigate(ROUTES.ORG_ADMIN.MEMBER_INVITATIONS)}>Invitations</button></div>
    {!invitationsTab && <><div className="mb-4 flex flex-wrap items-center gap-3"><div className="relative max-w-sm flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" /><Input className="pl-9" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setMembersPage(1); }} /></div></div>{members.isLoading ? <Loader label="Loading members..." /> : members.error ? <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">Something went wrong. Please try again.</div> : memberRows.length === 0 ? <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">{search ? 'No members match your search.' : 'No members yet.'}</div> : <><div className="overflow-hidden rounded-lg border border-border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-sm"><thead><tr className="border-b-2 border-brand-accent bg-muted/50"><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name / Email</th><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Regions</th><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</th><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</th><th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th></tr></thead><tbody className="divide-y divide-border">{memberRows.map((member) => <tr key={member.id} className="hover:bg-muted/60"><td className="px-3 py-2.5"><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">{(member.displayName ?? member.email).charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="font-medium text-foreground">{member.displayName ?? <span className="text-muted-foreground/70">No name</span>}</p><p className="text-xs text-muted-foreground">{member.email}</p></div></div></td><td className="px-3 py-2.5"><Badge>{member.regionCode ?? 'All regions'}</Badge></td><td className="px-3 py-2.5"><Badge variant={member.status === 'ACTIVE' ? 'success' : 'danger'}>{member.status}</Badge></td><td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{member.roles.length ? member.roles.map((role) => <Badge key={role.id} variant="info">{role.name}</Badge>) : <span className="text-muted-foreground/70">None</span>}</div></td><td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{formatDate(member.joinedAt)}</td><td className="px-3 py-2.5 text-right"><Button variant="outline" size="sm" onClick={() => { setEditingMember(member); setEditingStatus(member.status); setEditingRegion(member.regionCode ?? ''); }}><Pencil className="h-4 w-4" />Edit</Button></td></tr>)}</tbody></table></div></div><Pagination meta={memberMeta} onPageChange={setMembersPage} onPageSizeChange={(size) => { setMembersPageSize(size); setMembersPage(1); }} disabled={members.isFetching} /></>}</>}
    {invitationsTab && <><div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Pending email invites. They expire after 7 days; revoke any you no longer want.</p><Button onClick={openInvite}><UserPlus className="h-4 w-4" />Invite Member</Button></div>{invitations.isLoading ? <Loader label="Loading invitations..." /> : invitations.error ? <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">Something went wrong. Please try again.</div> : invitationRows.length === 0 ? <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">No pending invitations.</div> : <><div className="overflow-hidden rounded-lg border border-border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b-2 border-brand-accent bg-muted/50"><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</th><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expires</th><th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invited by</th><th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th></tr></thead><tbody className="divide-y divide-border">{invitationRows.map((item) => <tr key={item.id} className="hover:bg-muted/60"><td className="px-3 py-2.5 font-medium text-foreground">{item.email}</td><td className="px-3 py-2.5 text-foreground">{item.regionCode ?? 'All regions'}</td><td className="px-3 py-2.5"><Badge variant={item.status === 'PENDING' ? 'warning' : item.status === 'ACCEPTED' ? 'success' : 'default'}>{item.status}</Badge></td><td className="px-3 py-2.5 text-muted-foreground">{formatDate(item.expiresAt)}</td><td className="px-3 py-2.5 text-foreground">{item.invitedBy?.displayName ?? item.invitedBy?.email ?? '—'}</td><td className="px-3 py-2.5 text-right">{item.status === 'PENDING' && <Button variant="outline" size="sm" onClick={() => revoke.mutate(item.id)} disabled={revoke.isPending}><Trash2 className="h-4 w-4 text-destructive" />Revoke</Button>}</td></tr>)}</tbody></table></div></div><Pagination meta={invitationMeta} onPageChange={setInvitationsPage} onPageSizeChange={(size) => { setInvitationsPageSize(size); setInvitationsPage(1); }} disabled={invitations.isFetching} /></>}</>}
    <Sheet isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Member" description="Invite a person to your organization." width="md" footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button><Button onClick={submitInvite} disabled={invite.isPending || !email.trim()}>{invite.isPending ? 'Sending...' : 'Send Invitation'}</Button></div>}><form className="space-y-4" onSubmit={submitInvite}><div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-muted-foreground">Access is organization-scoped. Assign a region and role when the invitation should be limited to one branch.</div><div><Label htmlFor="invite-email">Email *</Label><Input id="invite-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); invite.reset(); }} placeholder="colleague@example.com" required /></div><div><Label htmlFor="invite-name">Display Name</Label><Input id="invite-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional display name" /></div><div><Label htmlFor="invite-role">Role</Label><select id="invite-role" value={roleId} onChange={(e) => setRoleId(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-border bg-muted/50 px-4 text-sm"><option value="">Select role...</option>{roles.data?.filter((role) => !role.system).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div><div><Label htmlFor="invite-region">Region</Label><select id="invite-region" value={regionCode} onChange={(e) => setRegionCode(e.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-border bg-muted/50 px-4 text-sm"><option value="">All regions</option>{regions.data?.filter((region) => region.isActive).map((region) => <option key={region.id} value={region.regionCode}>{region.displayName}</option>)}</select></div>{invite.error && <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">{getApiErrorMessage(invite.error)}</p>}</form></Sheet>
    <Sheet isOpen={editingMember !== null} onClose={() => setEditingMember(null)} title="Edit Member" description={editingMember?.email ?? 'Update organization access.'} width="md" footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button><Button onClick={() => updateMember.mutate()} disabled={updateMember.isPending}>{updateMember.isPending ? 'Saving...' : 'Save changes'}</Button></div>}><div className="space-y-4"><div><Label htmlFor="member-status">Status</Label><select id="member-status" value={editingStatus} onChange={(event) => setEditingStatus(event.target.value)} className="mt-1 block h-10 w-full rounded-md border border-border bg-white px-3 text-sm"><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></div><div><Label htmlFor="member-region">Region</Label><select id="member-region" value={editingRegion} onChange={(event) => setEditingRegion(event.target.value)} className="mt-1 block h-10 w-full rounded-md border border-border bg-white px-3 text-sm"><option value="">All regions</option>{regions.data?.map((region) => <option key={region.id} value={region.regionCode}>{region.displayName}</option>)}</select></div>{updateMember.error && <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">{getApiErrorMessage(updateMember.error)}</p>}</div></Sheet>
  </div>;
}

export function TenantRolesPage(): ReactElement {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: tenantQueryKey('roles'), queryFn: () => tenantAdminService.roles() });
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<NonNullable<typeof query.data>[number] | null>(null);
  const remove = useMutation({ mutationFn: (id: string) => tenantAdminService.deleteRole(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: tenantQueryKey('roles') }) });
  const roles = (query.data ?? []).filter((role) => role.name.toLowerCase().includes(search.trim().toLowerCase()));
  const customCount = roles.filter((role) => !role.system).length;
  const systemCount = roles.filter((role) => role.system).length;
  const assignedCount = roles.reduce((total, role) => total + role.memberCount, 0);
  return <div><TenantPageHeader icon={Shield} title="Roles & Permissions" subtitle="Create roles for your team and choose exactly what each role can do." action={<Button onClick={() => navigate(ROUTES.ORG_ADMIN.ROLE_CREATE)}><Plus className="h-4 w-4" />Create custom role</Button>} /><ConceptCallout>Roles are organization-level permission bundles. System roles are read-only; custom roles can be assigned to members.</ConceptCallout><DataState isLoading={query.isLoading} error={query.error} empty={!query.isLoading && roles.length === 0}><div className="mb-4 grid gap-3 md:grid-cols-3"><ReportMetric label="Custom Roles" value={customCount} icon={Shield} /><ReportMetric label="System Roles" value={systemCount} icon={Shield} /><ReportMetric label="Assigned Members" value={assignedCount} icon={Users} /></div><div className="mb-5 flex max-w-sm items-center gap-2 rounded-md border border-border bg-white px-3"><Search className="h-4 w-4 text-muted-foreground/70" /><Input className="border-0 px-0 shadow-none focus:ring-0" placeholder="Search roles..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="grid gap-4 lg:grid-cols-3">{roles.map((role) => <article key={role.id} className="rounded-xl border border-border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent"><Shield className="h-4 w-4" /></span><div><h3 className="font-semibold text-foreground">{role.name}</h3><p className="mt-1 text-xs text-muted-foreground/70">{role.memberCount} members</p></div></div><Badge variant={role.system ? 'info' : 'default'}>{role.system ? 'System role' : 'Custom role'}</Badge></div><div className="mt-4 flex flex-wrap gap-1">{role.permissions.map((permission) => <span key={permission.id} className="rounded-full bg-moss-tint px-2 py-0.5 text-[10px] text-emerald-700">{permission.key}</span>)}</div><div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">{!role.system && <Button variant="ghost" size="sm" onClick={() => remove.mutate(role.id)} disabled={remove.isPending}><Trash2 className="h-4 w-4 text-destructive" />Delete</Button>}<Button variant="outline" size="sm" onClick={() => setSelectedRole(role)}>View</Button></div></article>)}</div></DataState><Sheet isOpen={selectedRole !== null} onClose={() => setSelectedRole(null)} title={selectedRole?.name ?? 'Role details'} description={selectedRole?.system ? 'System role permissions are read-only.' : 'Custom role permissions assigned in this organization.'} width="md"><div className="space-y-4"><div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"><span className="text-muted-foreground">Assigned members</span><strong className="text-foreground">{selectedRole?.memberCount ?? 0}</strong></div><div><p className="mb-2 text-sm font-semibold text-foreground">Permissions</p><div className="space-y-2">{selectedRole?.permissions.length ? selectedRole.permissions.map((permission) => <div key={permission.id} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">{permission.key}</div>) : <p className="text-sm text-muted-foreground/70">No permissions assigned.</p>}</div></div></div></Sheet></div>;
}

export function TenantRoleCreatePage(): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: tenantQueryKey('permission-catalog'), queryFn: () => tenantAdminService.permissionCatalog() });
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const create = useMutation({ mutationFn: () => tenantAdminService.createRole({ name, permissionIds: selected }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: tenantQueryKey('roles') }); navigate(ROUTES.ORG_ADMIN.ROLES); } });
  return <div className="mx-auto max-w-4xl"><Link to={ROUTES.ORG_ADMIN.ROLES} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-accent">← Roles</Link><section className="rounded-lg border border-border bg-white shadow-sm"><div className="border-b border-border p-5"><PageTitle as="h2" className="text-foreground">Create role</PageTitle><p className="mt-1 text-sm text-muted-foreground">Define a role and pick exactly what its members can do.</p></div><form className="space-y-5 p-5" onSubmit={(event) => { event.preventDefault(); if (name.trim()) create.mutate(); }}><div><Label htmlFor="role-name">Role name *</Label><Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Whistleblowing Reviewer" required /></div><div><p className="mb-3 text-sm font-semibold text-foreground">Permissions</p><div className="grid gap-2 sm:grid-cols-2">{catalog.data?.map((permission) => <label key={permission.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm hover:bg-muted/60"><input type="checkbox" checked={selected.includes(permission.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, permission.id] : current.filter((id) => id !== permission.id))} />{permission.key}</label>)}</div></div><div className="flex justify-end gap-3 border-t border-border pt-5"><Button type="button" variant="outline" onClick={() => navigate(ROUTES.ORG_ADMIN.ROLES)}>Cancel</Button><Button type="submit" disabled={create.isPending || !name.trim()}>{create.isPending ? 'Creating...' : 'Create role'}</Button></div></form></section></div>;
}

export function TenantRegionsPage(): ReactElement {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tenantQueryKey('regions'), queryFn: () => tenantAdminService.regions(), refetchOnMount: 'always', retry: 2, retryDelay: 500 });
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const create = useMutation({ mutationFn: () => tenantAdminService.createRegion({ regionCode: code, displayName: name }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: tenantQueryKey('regions') }); setOpen(false); setCode(''); setName(''); }, onError: () => { void queryClient.invalidateQueries({ queryKey: tenantQueryKey('regions') }); } });
  const deactivate = useMutation({ mutationFn: (id: string) => tenantAdminService.deactivateRegion(id), onSuccess: () => void queryClient.invalidateQueries({ queryKey: tenantQueryKey('regions') }) });
  return <div><TenantPageHeader icon={Globe} title="Regions & Branches" subtitle="Manage the geographic regions and branches within your organization." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add Region</Button>} /><ConceptCallout>A region is an organization access boundary. Members and Whistleblowing cases can be associated with an active region.</ConceptCallout><DataState isLoading={query.isLoading} error={query.error} empty={!query.isLoading && query.data?.length === 0}><div className="overflow-x-auto rounded-lg border border-border bg-white"><table className="w-full min-w-[760px] text-sm"><thead className="border-b-2 border-brand-accent text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Region Code</th><th className="px-4 py-3">Display Name</th><th className="px-4 py-3">Timezone</th><th className="px-4 py-3">Currency</th><th className="px-4 py-3">HQ</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Members</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{query.data?.map((region) => <tr key={region.id} className="hover:bg-muted/60"><td className="px-4 py-3 font-medium text-foreground">{region.regionCode}</td><td className="px-4 py-3">{region.displayName}</td><td className="px-4 py-3 text-muted-foreground">{region.timezone}</td><td className="px-4 py-3 text-muted-foreground">{region.currency ?? '—'}</td><td className="px-4 py-3">{region.isHeadquarter && <Badge variant="info">HQ</Badge>}</td><td className="px-4 py-3"><Badge variant={region.isActive ? 'success' : 'default'}>{region.isActive ? 'Active' : 'Inactive'}</Badge></td><td className="px-4 py-3">{region.memberCount}</td><td className="px-4 py-3 text-right">{region.isActive && !region.isHeadquarter ? <Button variant="ghost" size="sm" onClick={() => deactivate.mutate(region.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button> : <Pencil className="ml-auto h-4 w-4 text-muted-foreground/70" />}</td></tr>)}</tbody></table></div></DataState><Sheet isOpen={open} onClose={() => setOpen(false)} title="New Region" description="Create a new geographic region or branch for your organization." width="md" footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { if (code.trim() && name.trim()) create.mutate(); }} disabled={create.isPending || !code.trim() || !name.trim()}>Add Region</Button></div>}><div className="space-y-4"><div><Label htmlFor="region-code">Country / Region *</Label><Input id="region-code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); if (create.error) create.reset(); }} placeholder="e.g. PK" /></div><div><Label htmlFor="region-name">Display Name *</Label><Input id="region-name" value={name} onChange={(e) => { setName(e.target.value); if (create.error) create.reset(); }} placeholder="e.g. Pakistan - Head Office" /></div>{create.error && <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">{getApiErrorMessage(create.error)}</p>}<p className="text-xs text-muted-foreground">Timezone and currency are retained by the organization configuration when available.</p></div></Sheet></div>;
}

function TenantPlanPageLegacy(): ReactElement {
  const query = useQuery({ queryKey: tenantQueryKey('plan'), queryFn: () => tenantAdminService.plan() });
  return <div><TenantPageHeader icon={Link2} title="Plan & Limits" subtitle="Your organization's active configuration and current usage." /><DataState isLoading={query.isLoading} error={query.error}><><section className="rounded-lg bg-[#07345b] p-5 text-white shadow-sm"><p className="text-xs uppercase tracking-wide text-white/60">Current configuration</p><h3 className="mt-2 text-lg font-semibold">{query.data?.name}</h3><p className="mt-1 text-sm text-white/70">Organization-scoped Whistleblowing services</p><Badge variant="success" className="mt-3">{query.data?.status}</Badge></section><div className="mt-5 grid gap-4 md:grid-cols-3">{Object.entries(query.data?.limits ?? {}).map(([key, limit]) => <div key={key} className="rounded-lg border border-border bg-white p-4"><p className="text-sm text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</p><p className="mt-2 text-2xl font-semibold text-foreground">{limit.used}{limit.max === null ? '' : ` / ${limit.max}`}</p><div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brand-accent" style={{ width: limit.max ? `${Math.min(100, (limit.used / limit.max) * 100)}%` : '8%' }} /></div></div>)}</div><section className="mt-5 rounded-lg border border-border bg-white p-5"><h3 className="font-semibold text-foreground">Included modules</h3><div className="mt-3 flex flex-wrap gap-2">{query.data?.enabledModules.map((module) => <span key={module} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700">{module}</span>)}</div></section></></DataState></div>;
}

function PlanUsageCard({ title, icon: Icon, usage, unit }: { title: string; icon: LucideIcon; usage: { used: number; max: number | null }; unit: string }): ReactElement {
  const percent = usage.max === null || usage.max <= 0 ? 0 : Math.min(100, Math.round((usage.used / usage.max) * 100));
  return <section className="rounded-xl border border-border bg-white p-5"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Icon className="h-4 w-4 text-brand-accent" />{title}</span>{usage.max !== null && <Badge variant={percent >= 90 ? 'danger' : percent >= 70 ? 'warning' : 'success'}>{percent}% used</Badge>}</div><div className="mt-3 flex items-baseline gap-1.5"><strong className="text-3xl font-semibold text-foreground">{usage.used}</strong><span className="text-sm text-muted-foreground/70">{usage.max === null ? unit : `/ ${usage.max} ${unit}`}</span></div>{usage.max !== null && <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-accent" style={{ width: `${percent}%` }} /></div>}<p className="mt-2 text-xs text-muted-foreground/70">{usage.max === null ? 'No configured organization limit.' : `${Math.max(0, usage.max - usage.used)} ${unit} remaining`}</p></section>;
}

export function TenantPlanPage(): ReactElement {
  const query = useQuery({ queryKey: tenantQueryKey('plan'), queryFn: () => tenantAdminService.plan() });
  const adminSeats = query.data?.limits.adminSeats ?? { used: 0, max: null };
  const userSeats = query.data?.limits.userSeats ?? { used: 0, max: null };
  return <div><TenantPageHeader icon={Link2} title="Plan & Limits" subtitle="Your organization's subscription, enabled Whistleblowing services, and current organization usage." /><DataState isLoading={query.isLoading} error={query.error}><><section className="rounded-xl border border-border bg-gradient-to-br from-brand-primary to-[#063150] p-6 text-white"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-medium uppercase tracking-wider text-white/60">Current configuration</span><p className="mt-1 text-2xl font-semibold">{query.data?.name}</p><p className="mt-1 max-w-2xl text-sm text-white/70">Organization-scoped configuration for Whistleblowing.</p></div><Badge variant="success">{query.data?.status}</Badge></div></section><div className="mt-5 grid gap-4 md:grid-cols-2"><PlanUsageCard title="Admin seats" icon={UserCog} usage={adminSeats} unit="seats" /><PlanUsageCard title="User seats" icon={Users} usage={userSeats} unit="seats" /></div><section className="mt-5 rounded-xl border border-border bg-white p-5"><h3 className="font-semibold text-foreground">Included modules</h3><p className="mt-1 text-xs text-muted-foreground/70">Modules enabled for this organization.</p><div className="mt-4 flex flex-wrap gap-2">{query.data?.enabledModules.length ? query.data.enabledModules.map((module) => <span key={module} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700">{module}</span>) : <span className="text-sm text-muted-foreground/70">No modules are enabled.</span>}</div></section></></DataState></div>;
}

export function TenantIntegrationsPage(): ReactElement {
  const query = useQuery({ queryKey: tenantQueryKey('integrations'), queryFn: () => tenantAdminService.integrations() });
  return <div><TenantPageHeader icon={Link2} title="Integrations" subtitle="Connect provider accounts or run each capability manually with a full audit trail." /><DataState isLoading={query.isLoading} error={query.error}>{query.data?.integrations.length ? <div className="space-y-4">{query.data.integrations.map((integration) => <section key={integration.key} className="rounded-xl border border-border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-foreground">{integration.name}</h3><p className="mt-1 text-xs text-muted-foreground">Live organization integration status.</p></div><Badge variant={integration.status === 'READY' ? 'success' : 'default'}>{integration.status}</Badge></div></section>)}</div> : <section className="rounded-xl border border-border bg-white p-10 text-center"><Link2 className="mx-auto h-8 w-8 text-muted-foreground/70" /><h3 className="mt-3 font-semibold text-foreground">No integrations configured</h3><p className="mt-1 text-sm text-muted-foreground">No Whistleblowing provider connection is configured for this organization.</p></section>}</DataState></div>;
}

function TenantSettingsPageLegacy(): ReactElement {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tenantQueryKey('settings'), queryFn: () => tenantAdminService.settings() });
  const [name, setName] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const update = useMutation({ mutationFn: () => tenantAdminService.updateSettings({ name: name ?? query.data?.name, brandColor: brandColor ?? query.data?.brandColor }), onSuccess: (data) => { queryClient.setQueryData(tenantQueryKey('settings'), data); setName(null); setBrandColor(null); } });
  const currentName = name ?? query.data?.name ?? '';
  return <div><TenantPageHeader icon={Settings} title="Settings" subtitle="Manage your organization configuration and account security." /><div className="mb-5 flex gap-5 border-b border-border text-sm"><span className="border-b-2 border-brand-accent px-2 pb-2 font-medium text-brand-accent">Organization</span><span className="px-2 pb-2 text-muted-foreground">Terminology</span><span className="px-2 pb-2 text-muted-foreground">Features</span><span className="px-2 pb-2 text-muted-foreground">Security</span></div><DataState isLoading={query.isLoading} error={query.error}><><section className="overflow-hidden rounded-lg border border-border bg-white"><div className="border-b border-border p-5"><h3 className="font-semibold text-foreground">Organization Info</h3><p className="mt-1 text-xs text-muted-foreground">These values are managed by organization administrators.</p></div><dl className="divide-y divide-border text-sm"><div className="grid grid-cols-[10rem_1fr] px-5 py-3"><dt className="text-muted-foreground">Name</dt><dd className="font-medium text-foreground">{query.data?.name}</dd></div><div className="grid grid-cols-[10rem_1fr] px-5 py-3"><dt className="text-muted-foreground">Slug</dt><dd className="font-mono text-muted-foreground">{query.data?.slug}</dd></div><div className="grid grid-cols-[10rem_1fr] px-5 py-3"><dt className="text-muted-foreground">Status</dt><dd><Badge variant="success">{query.data?.status}</Badge></dd></div></dl></section><section className="mt-5 rounded-lg border border-border bg-white p-5"><h3 className="font-semibold text-foreground">Editable Settings</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label htmlFor="organization-name">Organization name</Label><Input id="organization-name" value={currentName} onChange={(e) => setName(e.target.value)} /></div><div><Label htmlFor="brand-color">Brand color</Label><Input id="brand-color" value={brandColor ?? query.data?.brandColor ?? ''} onChange={(e) => setBrandColor(e.target.value)} placeholder="#6F56D9" /></div></div><div className="mt-5 flex justify-end"><Button onClick={() => update.mutate()} disabled={update.isPending || !currentName.trim()}>{update.isPending ? 'Saving...' : 'Save changes'}</Button></div></section></></DataState></div>;
}

type TenantSettingsTab = 'organization' | 'terminology' | 'features' | 'custom-fields' | 'layouts' | 'lifecycle' | 'security';

const tenantSettingsTabs: { key: TenantSettingsTab; label: string; icon: LucideIcon }[] = [
  { key: 'organization', label: 'Organization', icon: Building2 },
  { key: 'terminology', label: 'Terminology', icon: Tags },
  { key: 'features', label: 'Features', icon: Settings },
  { key: 'custom-fields', label: 'Custom Fields', icon: Layers },
  { key: 'layouts', label: 'Layouts', icon: Table2 },
  { key: 'lifecycle', label: 'Lifecycle', icon: TrendingUp },
  { key: 'security', label: 'Security (MFA)', icon: LockKeyhole },
];

export function TenantSettingsPage(): ReactElement {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tenantQueryKey('settings'), queryFn: () => tenantAdminService.settings() });
  const [activeTab, setActiveTab] = useState<TenantSettingsTab>('organization');
  const [name, setName] = useState('');
  const [brandColor, setBrandColor] = useState('');
  const update = useMutation({ mutationFn: () => tenantAdminService.updateSettings({ name: name.trim() || undefined, brandColor: brandColor.trim() || null }), onSuccess: (data) => { queryClient.setQueryData(tenantQueryKey('settings'), data); setName(''); setBrandColor(''); } });
  const settings = query.data;
  return <div><TenantPageHeader icon={Settings} title="Settings" subtitle="Manage your organization configuration and account security." /><div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border">{tenantSettingsTabs.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${activeTab === key ? 'border-brand-accent text-brand-accent' : 'border-transparent text-muted-foreground hover:text-brand-accent'}`}><Icon className="h-4 w-4" />{label}</button>)}</div><DataState isLoading={query.isLoading} error={query.error}>{activeTab === 'organization' ? <div className="space-y-5"><section className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b border-border p-5"><h3 className="font-semibold text-foreground">Organization Info</h3><p className="mt-1 text-xs text-muted-foreground">These values are managed by organization administrators and are organization-scoped.</p></div><div className="grid grid-cols-[10rem_1fr] border-b border-border px-5 py-3 text-sm"><span className="text-muted-foreground">Name</span><strong className="text-foreground">{settings?.name}</strong></div><div className="grid grid-cols-[10rem_1fr] border-b border-border px-5 py-3 text-sm"><span className="text-muted-foreground">Slug</span><span className="font-mono text-muted-foreground">{settings?.slug}</span></div><div className="grid grid-cols-[10rem_1fr] px-5 py-3 text-sm"><span className="text-muted-foreground">Status</span><span><Badge variant={settings?.status === 'ACTIVE' ? 'success' : 'default'}>{settings?.status}</Badge></span></div></section><section className="overflow-hidden rounded-xl border border-border bg-white"><div className="border-b border-border p-5"><h3 className="font-semibold text-foreground">Editable Settings</h3><p className="mt-1 text-xs text-muted-foreground">Update the organization fields supported by the Whistleblowing backend.</p></div><form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); if (name.trim() || brandColor.trim()) update.mutate(); }}><div><Label htmlFor="tenant-setting-name">Organization name</Label><Input id="tenant-setting-name" value={name || settings?.name || ''} onChange={(event) => setName(event.target.value)} /></div><div><Label htmlFor="tenant-setting-brand">Brand color</Label><Input id="tenant-setting-brand" value={brandColor || settings?.brandColor || ''} onChange={(event) => setBrandColor(event.target.value)} placeholder="#6F56D9" /></div>{update.error && <p className="sm:col-span-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">{getApiErrorMessage(update.error)}</p>}<div className="flex justify-end sm:col-span-2"><Button type="submit" disabled={update.isPending || (!name.trim() && !brandColor.trim())}>{update.isPending ? 'Saving...' : 'Save changes'}</Button></div></form></section></div> : <section className="rounded-xl border border-border bg-white p-10 text-center"><BookOpen className="mx-auto h-8 w-8 text-muted-foreground/70" /><h3 className="mt-3 font-semibold text-foreground">No additional Whistleblowing settings</h3><p className="mt-1 text-sm text-muted-foreground">This organization has no live configuration for {tenantSettingsTabs.find((item) => item.key === activeTab)?.label ?? 'this section'}.</p></section>}</DataState></div>;
}

export function TenantHelpPage(): ReactElement {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<[string, string] | null>(null);
  const cards = [
    ['How access works: Portal → Role → Region', 'Three organization access choices: portal, role, and region.'],
    ['Portals', 'Choose whether someone uses the tenant administrator or user portal.'],
    ['Roles & permissions', 'A role is a named bundle of permissions members can hold.'],
    ['Regions', 'A region is an organization branch and access boundary.'],
    ['Departments', 'Use departments to organize internal reporting and approvals.'],
    ['Whistleblowing', 'Confidential reports are restricted by organization and permissions.'],
    ['Seats & licensing', 'Usage is calculated from live organization membership records.'],
    ['Integrations', 'Connect providers or run supported capabilities manually.'],
  ];
  const filteredCards = cards.filter(([title, text]) => `${title} ${text}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div><TenantPageHeader icon={BookOpen} title="Help & Concepts" subtitle="Plain-language explanations of how the platform fits together — portals, roles, regions, approvals, and Whistleblowing." /><div className="relative mb-5 max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" /><Input className="bg-white pl-9" placeholder="Search topics..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>{filteredCards.length === 0 ? <div className="rounded-xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">No topics match your search.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredCards.map(([title, text]) => <button key={title} type="button" onClick={() => setSelectedTopic([title, text])} className="group rounded-xl border border-border bg-white p-5 text-left shadow-sm transition hover:border-brand-accent/40 hover:shadow-md"><div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent"><Info className="h-4 w-4" /></div><ChevronRight className="h-4 w-4 text-muted-foreground/70 transition group-hover:text-brand-accent" /></div><h3 className="mt-4 font-semibold text-foreground">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></button>)}</div>}<Sheet isOpen={selectedTopic !== null} onClose={() => setSelectedTopic(null)} title={selectedTopic?.[0] ?? 'Help'} description="Organization-scoped Whistleblowing guidance." width="md"><p className="text-sm leading-6 text-muted-foreground">{selectedTopic?.[1]}</p></Sheet></div>;
}

export function TenantProfilePage(): ReactElement {
  const user = useAuthStore((state) => state.user);
  return <div><TenantPageHeader icon={UserCircle} title="Profile" subtitle="View your organization portal account details." /><section className="max-w-2xl overflow-hidden rounded-xl border border-border bg-white"><div className="flex items-center gap-4 border-b border-border p-6"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent text-white"><UserCircle className="h-8 w-8" /></span><div><h3 className="text-lg font-semibold text-foreground">{user?.displayName ?? user?.email}</h3><p className="text-sm text-muted-foreground">{user?.email}</p></div></div><dl className="divide-y divide-border text-sm"><div className="grid grid-cols-[10rem_1fr] px-6 py-4"><dt className="text-muted-foreground">Account status</dt><dd className="font-medium text-foreground">{user?.status}</dd></div><div className="grid grid-cols-[10rem_1fr] px-6 py-4"><dt className="text-muted-foreground">Portal</dt><dd className="font-medium text-foreground">Organization admin</dd></div><div className="grid grid-cols-[10rem_1fr] px-6 py-4"><dt className="text-muted-foreground">Email verification</dt><dd className="font-medium text-foreground">{user?.emailVerifiedAt ? 'Verified' : 'Pending'}</dd></div></dl></section></div>;
}
