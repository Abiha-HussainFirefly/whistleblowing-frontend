import { type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  CircleDot,
  CircleHelp,
  Clock3,
  EyeOff,
  Globe2,
  Scale,
  Shield,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Loader } from '@components/common/Loader';
import { PageTitle } from '@components/ui/page-title';
import { Badge } from '@components/ui/badge';
import { ROUTES } from '@config/routes';
import { getApiErrorMessage } from '@lib/api-error';
import { contextQueryKey } from '@lib/context-query-key';
import { useAuthStore } from '@store/authStore';
import { tenantAdminService } from '@features/org-admin/api/tenant-admin.service';
import { useWbOversightCases, useWbOversightStats } from '@features/org-admin/hooks/whistleblowing-oversight';
import type { WbStats } from '@features/whistleblowing/types';
import { formatDate, wbCategoryLabelOf, wbPriorityLabelOf, wbStatusLabelOf } from '@features/whistleblowing/utils/format';

const key = (name: string) => contextQueryKey(`tenant-${name}`);
const STATUS_COLORS = ['#6F56D9', '#E3A228', '#D85C6A', '#3F7564', '#9B8CE0', '#9AA5B1'];

function Card({ children, className = '', hoverText }: { children: ReactNode; className?: string; hoverText?: string }): ReactElement {
  return <section className={`group relative rounded-xl border border-border bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-accent/30 hover:shadow-md ${className}`} title={hoverText}>{children}{hoverText !== undefined && <span role="tooltip" className="pointer-events-none absolute left-4 top-full z-30 mt-2 max-w-[min(22rem,calc(100vw-2rem))] -translate-y-1 whitespace-normal rounded-md bg-brand-primary px-3 py-2 text-[11px] font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">{hoverText}</span>}</section>;
}

function Stat({ label, value, hint, icon: Icon, tone = 'brand' }: { label: string; value: string | number; hint: string; icon: LucideIcon; tone?: 'brand' | 'success' | 'warning' | 'danger' }): ReactElement {
  const toneClasses = { brand: 'bg-brand-accent/10 text-brand-accent', success: 'bg-moss-tint text-moss', warning: 'bg-courage-tint text-courage-strong', danger: 'bg-state-priority-surface text-state-priority-text' };
  return <Card className="p-4" hoverText={`${label}: ${String(value)}. ${hint}.`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p><p className="mt-1 truncate text-xs text-muted-foreground/70">{hint}</p></div><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}><Icon className="h-4 w-4" /></span></div></Card>;
}

function CoverageIndicator({ admins, members }: { admins: number; members: number }): ReactElement {
  const coverage = members > 0 ? Math.min(100, Math.round((admins / members) * 100)) : 0;
  const status = members === 0 ? 'No members yet' : coverage >= 75 ? 'Good coverage' : 'Review coverage';
  return <Card className="p-4"><div className="flex items-center gap-3"><div className="relative h-12 w-12 shrink-0 rounded-full" aria-label={`${coverage}% administrator coverage`} style={{ background: `conic-gradient(#3F7564 ${coverage}%, #e2e8f0 0)` }}><div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-white"><CheckCircle2 className="h-5 w-5 text-moss" /></div></div><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">Admin coverage</p><p className="mt-1 text-sm font-semibold text-foreground">{status}</p><p className="mt-0.5 truncate text-xs text-muted-foreground/70">{admins} administrators · {members} members</p></div></div></Card>;
}

function EmptyChart({ children = 'No data yet for this organization.' }: { children?: ReactNode }): ReactElement {
  return <p className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border px-4 text-center text-xs text-muted-foreground">{children}</p>;
}

function StatusBreakdown({ stats }: { stats: WbStats | undefined }): ReactElement {
  const rows = Object.entries(stats?.byStatus ?? {}).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  const total = stats?.total ?? rows.reduce((sum, [, count]) => sum + count, 0);
  let cursor = 0;
  const stops = rows.map(([, count], index) => { const start = cursor; cursor += total > 0 ? (count / total) * 100 : 0; return `${STATUS_COLORS[index % STATUS_COLORS.length]} ${start}% ${cursor}%`; });
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Case status breakdown</h2><p className="mt-1 text-xs text-muted-foreground">Current workflow position of permitted reports.</p></div><BarChart3 className="h-5 w-5 text-brand-accent" /></div>{rows.length && total > 0 ? <div className="mt-6 flex flex-wrap items-center gap-7"><div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }}><div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white"><strong className="text-2xl font-semibold text-foreground">{total}</strong><span className="text-[10px] text-muted-foreground">Total cases</span></div></div><div className="min-w-[12rem] flex-1 space-y-3">{rows.map(([status, count], index) => <div key={status} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }} /><span className="truncate">{wbStatusLabelOf(status)}</span></span><strong className="tabular-nums text-foreground">{count} <span className="font-normal text-muted-foreground">({Math.round((count / total) * 100)}%)</span></strong></div>)}</div></div> : <div className="mt-5"><EmptyChart>No case status data yet.</EmptyChart></div>}</Card>;
}

function SubmissionTrend({ stats }: { stats: WbStats | undefined }): ReactElement {
  const trend = stats?.submissionsByMonth ?? [];
  const max = Math.max(...trend.map((point) => point.count), 1);
  const points = trend.map((point, index) => { const x = trend.length === 1 ? 360 : 24 + (index / (trend.length - 1)) * 672; const y = 190 - (point.count / max) * 150; return { ...point, x, y }; });
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Reports over time</h2><p className="mt-1 text-xs text-muted-foreground">Monthly submissions returned by the oversight service.</p></div><Clock3 className="h-5 w-5 text-brand-accent" /></div>{trend.length ? <div className="mt-5"><div className="mb-3 flex items-center gap-2 text-[10px] text-muted-foreground"><span className="h-0.5 w-5 rounded-full bg-brand-accent" />Reports received</div><div className="overflow-hidden"><svg viewBox="0 0 720 235" className="h-48 w-full" role="img" aria-label="Monthly reports received over time"><g className="text-border" stroke="currentColor" strokeWidth="1"><line x1="24" y1="40" x2="696" y2="40" /><line x1="24" y1="90" x2="696" y2="90" /><line x1="24" y1="140" x2="696" y2="140" /><line x1="24" y1="190" x2="696" y2="190" /></g><polyline fill="none" stroke="#6F56D9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={points.map((point) => `${point.x},${point.y}`).join(' ')} />{points.map((point) => <g key={point.month} className="group"><circle cx={point.x} cy={point.y} r="4" fill="white" stroke="#6F56D9" strokeWidth="2" className="cursor-pointer transition-all duration-200 group-hover:stroke-brand-primary" /><g className="pointer-events-none opacity-0 transition-opacity duration-200 group-hover:opacity-100"><rect x={point.x - 37} y={Math.max(5, point.y - 31)} width="74" height="20" rx="4" className="fill-white stroke-border" /><text x={point.x} y={Math.max(19, point.y - 17)} textAnchor="middle" className="fill-foreground text-[9px] font-medium">{`${point.count} reports`}</text></g><title>{`${point.month}: ${point.count} reports`}</title></g>)}{points.map((point) => <text key={`${point.month}-label`} x={point.x} y="214" textAnchor="middle" className="fill-muted-foreground text-[10px]">{point.month}</text>)}</svg></div></div> : <div className="mt-5"><EmptyChart>No monthly submission data yet.</EmptyChart></div>}</Card>;
}

function Distribution({ title, values, label, color }: { title: string; subtitle?: string; values: Record<string, number> | undefined; label: (key: string) => string; color: string }): ReactElement {
  const rows = Object.entries(values ?? {}).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = Object.values(values ?? {}).reduce((sum, count) => sum + count, 0);
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">{title}</h2><Link to={ROUTES.ORG_ADMIN.REPORTING} className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-accent hover:text-brand-primary">View analytics <ArrowRight className="h-3 w-3" /></Link></div>{rows.length && total > 0 ? <div className="mt-5 space-y-3.5">{rows.map(([keyName, count]) => { const percentage = Math.round((count / total) * 100); const Icon = categoryIcon(keyName); return <div key={keyName} className="group grid grid-cols-[1.25rem_minmax(0,1fr)_2.25rem] items-center gap-2.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent transition-colors group-hover:bg-brand-accent group-hover:text-white"><Icon className="h-3 w-3" /></span><div className="min-w-0"><div className="mb-1 flex items-center justify-between gap-2"><span className="truncate text-xs text-foreground">{label(keyName)}</span><span className="sr-only">{percentage}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-all duration-200 group-hover:brightness-110" style={{ width: `${Math.max(6, percentage)}%`, backgroundColor: color }} /></div></div><strong className="text-right text-xs font-medium tabular-nums text-muted-foreground group-hover:text-brand-primary">{percentage}%</strong></div>; })}</div> : <div className="mt-5"><EmptyChart>No {title.toLowerCase()} data yet.</EmptyChart></div>}</Card>;
}

function categoryIcon(category: string): LucideIcon {
  if (category.includes('FRAUD') || category.includes('BRIBERY') || category.includes('ACCOUNTING') || category.includes('COMPENSATION')) return CircleDollarSign;
  if (category.includes('CONFLICT') || category.includes('FAIR_COMPETITION') || category.includes('GLOBAL_TRADE')) return Scale;
  if (category.includes('PRIVACY') || category.includes('CONFIDENTIAL') || category.includes('POLICY')) return ShieldCheck;
  if (category.includes('HARASSMENT') || category.includes('DISCRIMINATION') || category.includes('RETALIATION')) return AlertTriangle;
  return CircleDot;
}

function PriorityMix({ values }: { values: Record<string, number> | undefined }): ReactElement {
  const rows = Object.entries(values ?? {}).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  let cursor = 0;
  const colors = ['#D85C6A', '#E3A228', '#3F7564', '#9AA5B1'];
  const stops = rows.map(([, count], index) => { const start = cursor; cursor += total > 0 ? (count / total) * 100 : 0; return `${colors[index % colors.length]} ${start}% ${cursor}%`; });
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Priority mix</h2><p className="mt-1 text-xs text-muted-foreground">Operational priority assigned to reports in scope.</p></div><AlertTriangle className="h-5 w-5 text-courage" /></div>{rows.length && total > 0 ? <div className="mt-6 flex flex-wrap items-center gap-7"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }}><div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white"><strong className="text-xl text-foreground">{total}</strong><span className="text-[10px] text-muted-foreground">Reports</span></div></div><div className="min-w-[12rem] flex-1 space-y-3">{rows.map(([priority, count], index) => <div key={priority} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />{wbPriorityLabelOf(priority)}</span><strong className="tabular-nums text-foreground">{count} <span className="font-normal text-muted-foreground">({Math.round((count / total) * 100)}%)</span></strong></div>)}</div></div> : <div className="mt-5"><EmptyChart>No priority mix data yet.</EmptyChart></div>}</Card>;
}

function priorityVariant(priority: string): 'default' | 'success' | 'warning' | 'danger' {
  if (priority === 'PRIORITY_CRITICAL' || priority === 'PRIORITY_HIGH') return 'danger';
  if (priority === 'PRIORITY_MEDIUM') return 'warning';
  if (priority === 'PRIORITY_LOW') return 'success';
  return 'default';
}

function statusVariant(status: string): 'default' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'RESOLVED') return 'success';
  if (status === 'UNDER_INVESTIGATION') return 'warning';
  if (status === 'WB_ESCALATED') return 'danger';
  if (status === 'SUBMITTED' || status === 'UNDER_TRIAGE') return 'info';
  return 'default';
}

function RecentReports({ cases, isLoading, error }: { cases: ReturnType<typeof useWbOversightCases>; isLoading: boolean; error: unknown }): ReactElement {
  return <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold text-foreground">Recent reports</h2><p className="mt-1 text-xs text-muted-foreground">Latest permitted activity in the current organization scope.</p></div><Link to={ROUTES.ORG_ADMIN.WHISTLEBLOWING} className="inline-flex items-center gap-1 text-xs font-medium text-brand-accent hover:text-brand-primary">View all reports <ArrowRight className="h-3 w-3" /></Link></div>{isLoading ? <div className="p-6"><Loader label="Loading recent reports..." /></div> : error ? <p className="p-5 text-sm text-destructive">{getApiErrorMessage(error)}</p> : cases.data?.data.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Case ID</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Region</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3 text-right"> </th></tr></thead><tbody className="divide-y divide-border">{cases.data.data.map((item) => <tr key={item.id} className="hover:bg-muted/40"><td className="px-5 py-3 font-medium text-foreground">{item.caseReferenceNumber}</td><td className="px-5 py-3 text-muted-foreground">{wbCategoryLabelOf(item.category)}</td><td className="px-5 py-3"><Badge variant={priorityVariant(item.priority)}>{wbPriorityLabelOf(item.priority)}</Badge></td><td className="px-5 py-3"><Badge variant={statusVariant(item.status)}>{wbStatusLabelOf(item.status)}</Badge></td><td className="px-5 py-3 text-muted-foreground">{item.regionCode ?? 'All regions'}</td><td className="px-5 py-3 text-muted-foreground">{formatDate(item.updatedAt)}</td><td className="px-5 py-3 text-right"><Link to={ROUTES.ORG_ADMIN.WHISTLEBLOWING_CASE_DETAIL(item.id)} className="text-brand-accent hover:text-brand-primary" aria-label={`Open ${item.caseReferenceNumber}`}><ArrowRight className="ml-auto h-4 w-4" /></Link></td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyChart>No permitted reports yet.</EmptyChart></div>}</Card>;
}

export function OrgAdminDashboardPage(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.activeOrganization);
  const activeRegion = useAuthStore((state) => state.activeRegion);
  const stats = useQuery({ queryKey: key('stats'), queryFn: () => tenantAdminService.stats(), enabled: organization !== null });
  const members = useQuery({ queryKey: key('members'), queryFn: () => tenantAdminService.members(), enabled: organization !== null });
  const invitations = useQuery({ queryKey: key('invitations'), queryFn: () => tenantAdminService.invitations(), enabled: organization !== null });
  const regions = useQuery({ queryKey: key('regions'), queryFn: () => tenantAdminService.regions(), enabled: organization !== null });
  const oversight = useWbOversightStats(activeRegion ? { regionCode: activeRegion } : undefined);
  const recentCases = useWbOversightCases({ page: 1, pageSize: 5, ...(activeRegion ? { regionCode: activeRegion } : {}) });
  const loading = stats.isLoading || members.isLoading || invitations.isLoading || regions.isLoading || oversight.isLoading;
  const error = stats.error ?? members.error ?? invitations.error ?? regions.error ?? oversight.error;
  const pendingInvitations = invitations.data?.data.filter((item) => item.status === 'PENDING').length ?? 0;
  const displayName = user?.displayName ?? user?.email ?? 'there';
  const averageResolution = oversight.data?.avgResolutionDays === null || oversight.data?.avgResolutionDays === undefined ? '—' : `${oversight.data.avgResolutionDays}d`;

  return <div className="space-y-6"><div><PageTitle className="text-xl text-brand-primary">Welcome, {displayName}.</PageTitle><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Organization management console for {organization?.name ?? 'your organization'}. Monitor real-time activity, access, and case health from one place.</p>{activeRegion !== null && <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-accent/20 bg-brand-accent/5 px-2.5 py-1 text-[10px] font-medium text-brand-primary"><Globe2 className="h-3 w-3" />Active region: {activeRegion}</span>}</div>{loading && <Loader label="Loading organization overview..." />}{error && <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{getApiErrorMessage(error)}</div>}{!loading && !error && <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"><CoverageIndicator admins={stats.data?.admins ?? 0} members={stats.data?.members ?? 0} /><Stat label="Total members" value={stats.data?.members ?? 0} hint={`${stats.data?.admins ?? 0} admins · ${stats.data?.users ?? 0} users`} icon={Users} /><Stat label="Active regions" value={stats.data?.activeRegions ?? 0} hint={`${regions.data?.length ?? 0} total configured`} icon={Globe2} /><Stat label="Pending invitations" value={pendingInvitations} hint="Awaiting acceptance" icon={CircleHelp} tone={pendingInvitations > 0 ? 'warning' : 'success'} /><Stat label="Enabled modules" value={stats.data?.enabledModules.length ?? 0} hint="Licensed organization services" icon={Shield} /></div><div className="flex gap-5 border-b border-border text-sm"><span className="border-b-2 border-brand-accent px-2 pb-2 font-medium text-brand-accent">Overview</span><Link to={ROUTES.ORG_ADMIN.WHISTLEBLOWING} className="px-2 pb-2 text-sm text-muted-foreground hover:text-brand-accent">Whistleblowing</Link></div><section><div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-brand-accent">Whistleblowing oversight</p><h2 className="mt-1 text-lg font-semibold text-foreground">Case health and activity</h2><p className="mt-1 text-sm text-muted-foreground">Live, permission-filtered reports for {activeRegion ?? 'all accessible regions'}.</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2.5 py-1 text-muted-foreground">{oversight.data?.anonymousCount ?? 0} anonymous</span><span className="rounded-full bg-white px-2.5 py-1 text-muted-foreground">{oversight.data?.namedCount ?? 0} named</span></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"><Stat label="Total reports" value={oversight.data?.total ?? 0} hint="Visible permitted reports" icon={BarChart3} /><Stat label="Open reports" value={oversight.data?.open ?? 0} hint="Require active handling" icon={EyeOff} /><Stat label="Under investigation" value={oversight.data?.underInvestigation ?? 0} hint="Currently being addressed" icon={BarChart3} tone="warning" /><Stat label="SLA at risk" value={oversight.data?.slaAtRisk ?? 0} hint={`${oversight.data?.slaBreached ?? 0} already breached`} icon={AlertTriangle} tone={(oversight.data?.slaAtRisk ?? 0) > 0 ? 'danger' : 'success'} /><Stat label="Avg. resolution" value={averageResolution} hint="For resolved reports" icon={Clock3} /></div></section><div className="grid gap-5 xl:grid-cols-2"><StatusBreakdown stats={oversight.data} /><SubmissionTrend stats={oversight.data} /></div><div className="grid gap-5 lg:grid-cols-2"><Distribution title="Category insights" subtitle="Most common report categories in scope." values={oversight.data?.byCategory} label={wbCategoryLabelOf} color="#6F56D9" /><PriorityMix values={oversight.data?.byPriority} /></div><RecentReports cases={recentCases} isLoading={recentCases.isLoading} error={recentCases.error} /></>}</div>;
}
