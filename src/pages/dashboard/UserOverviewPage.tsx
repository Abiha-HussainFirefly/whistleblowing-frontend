import { type ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  LockKeyhole,
  MessageSquare,
  Paperclip,
  ScanSearch,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@components/ui/button';
import { Loader } from '@components/common/Loader';
import { SurfaceCard } from '@components/ui/surface';
import { StatusPill } from '@components/ui/status-pill';
import { StatTile } from '@components/ui/stat-tile';
import { ROUTES } from '@config/routes';
import { useWbCases, useWbStats } from '@features/whistleblowing/hooks';
import type { WhistleblowingCategory, WhistleblowingStatus, WbCaseListItem } from '@features/whistleblowing/types';
import { wbCategoryLabelT, wbStatusLabelT } from '@features/whistleblowing/utils/i18n';
import { formatDate, wbCategoryLabelOf, wbPriorityLabelOf, wbStatusLabelOf, wbStatusTone } from '@features/whistleblowing/utils/format';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, colorAt, colorForTone } from '@features/contracts/components/charts/palette';
import { getApiErrorMessage } from '@lib/api-error';
import { useAuthStore } from '@store/authStore';
import { useTranslation } from 'react-i18next';

const AXIS_STROKE = 'hsl(255 10% 55%)';
const GRID_STROKE = 'hsl(32 16% 89%)';
const STATUS_BREAKDOWN_COLORS: Partial<Record<WhistleblowingStatus, string>> = {
  SUBMITTED: '#A99BDE',
  UNDER_TRIAGE: '#D79A3E',
  UNDER_INVESTIGATION: '#E66E83',
  WB_ESCALATED: '#E66E83',
  RESOLVED: '#3F7564',
  WB_CLOSED: '#3F7564',
  WB_DISMISSED: '#B8B0C7',
};

export function UserOverviewPage(): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const displayName = useAuthStore((state) => state.user?.displayName ?? '');
  const stats = useWbStats();
  const recentCases = useWbCases({ page: 1, pageSize: 5 });
  const [activityOpen, setActivityOpen] = useState(false);

  if (stats.isLoading || recentCases.isLoading) return <Loader label="Loading overview..." />;
  if (stats.error !== null || recentCases.error !== null) {
    return <p className="text-sm text-destructive">{getApiErrorMessage(stats.error ?? recentCases.error)}</p>;
  }
  if (stats.data === undefined) return <p className="text-sm text-muted-foreground">No overview data available.</p>;

  const data = stats.data;
  const statusData = Object.entries(data.byStatus).map(([key, count]) => ({
    key: key as WhistleblowingStatus,
    name: wbStatusLabelT(key as WhistleblowingStatus, t),
    count,
    fill: STATUS_BREAKDOWN_COLORS[key as WhistleblowingStatus] ?? colorForTone(wbStatusTone(key as WhistleblowingStatus)),
  }));
  const categoryData = Object.entries(data.byCategory)
    .map(([key, count], index) => ({ name: key, label: wbCategoryLabelOf(key as WhistleblowingCategory), count, fill: colorAt(index) }))
    .sort((a, b) => b.count - a.count);
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const greeting = displayName.trim().length > 0 ? `${timeGreeting}, ${displayName}` : timeGreeting;
  const recentRows = recentCases.data?.data ?? [];
  const evidenceDocuments = recentRows.reduce((sum, row) => sum + row.attachmentCount, 0);
  const caseMessages = recentRows.reduce((sum, row) => sum + row.messageCount, 0);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your case management workflow.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild><Link to={ROUTES.REPORT_CONCERN}>Raise a concern</Link></Button>
        <Button size="sm" asChild><Link to={ROUTES.WHISTLEBLOWING_REGISTER}>View all reports <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatTile label="Open reports" value={data.open} icon={Inbox} iconClassName="bg-signal-tint text-signal-strong" />
      <StatTile label="Under investigation" value={data.underInvestigation} icon={ScanSearch} iconClassName="bg-courage-tint text-courage-strong" />
      <StatTile label="Resolved" value={data.closed} icon={CheckCircle2} iconClassName="bg-moss-tint text-moss" />
      <StatTile label="SLA at risk" value={data.slaAtRisk} icon={AlertTriangle} iconClassName="bg-courage-tint text-courage-strong" />
      <StatTile label="Avg. time to resolve" value={data.avgResolutionDays === null ? '—' : `${Math.round(data.avgResolutionDays)} days`} icon={Clock3} iconClassName="bg-plum-tint text-plum" />
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)_19rem]">
      <SurfaceCard>
        <OverviewSectionHeader title="Case status breakdown" action="View details" to={ROUTES.WHISTLEBLOWING_REGISTER} />
        {statusData.length === 0 ? <EmptyOverviewChart /> : <StatusBreakdown data={statusData} total={data.total} />}
      </SurfaceCard>
      <SurfaceCard flush>
        <div className="border-b border-border px-5 py-4"><OverviewSectionHeader title="Recent reports" action="View all reports" to={ROUTES.WHISTLEBLOWING_REGISTER} /></div>
        <RecentReports rows={recentRows} />
      </SurfaceCard>
      <SecureFollowUpCard open={data.open} atRisk={data.slaAtRisk} />
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_19rem]">
      <SurfaceCard>
        <OverviewSectionHeader title="Reports received over time" subtitle="Monthly submissions from live case records" />
        {data.submissionsByMonth.length === 0 ? <EmptyOverviewChart /> : <ReportsTrend data={data.submissionsByMonth} />}
      </SurfaceCard>
      <SurfaceCard>
        <OverviewSectionHeader title="Category insights" subtitle="Most common report categories in scope" action="View analytics" to={ROUTES.REPORTING} />
        {categoryData.length === 0 ? <EmptyOverviewChart /> : <CategoryInsights data={categoryData} />}
      </SurfaceCard>
      <EvidenceQueueCard documents={evidenceDocuments} messages={caseMessages} open={data.open} onOpenMessages={() => setActivityOpen(true)} />
    </div>

    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 text-xs text-muted-foreground">
      <ShieldCheck className="h-4 w-4 shrink-0 text-plum" />
      <strong className="text-foreground">Confidential. Secure. Accountable.</strong>
      <span>Activity on cases is recorded and audited. Reporter identities are protected.</span>
    </div>
    {activityOpen && <CaseActivityDialog rows={recentRows} onClose={() => setActivityOpen(false)} />}
  </div>;
}

function OverviewSectionHeader({ title, subtitle, action, to }: { title: string; subtitle?: string; action?: string; to?: string }): ReactElement {
  return <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-foreground">{title}</h2>{subtitle !== undefined && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>{action !== undefined && to !== undefined && <Link to={to} className="shrink-0 text-xs font-medium text-brand-accent hover:underline">{action} <ArrowRight className="inline h-3.5 w-3.5" /></Link>}</div>;
}

function EmptyOverviewChart(): ReactElement {
  return <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No data to display yet.</div>;
}

function StatusBreakdown({ data, total }: { data: { key: WhistleblowingStatus; name: string; count: number; fill: string }[]; total: number }): ReactElement {
  const charted = data.reduce((sum, item) => sum + item.count, 0);
  return <div className="mt-5 flex min-h-56 flex-col items-center gap-5 sm:flex-row"><div className="relative h-44 w-44 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="count" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2} stroke="none">{data.map((item) => <Cell key={item.key} fill={item.fill} />)}</Pie><Tooltip contentStyle={CHART_TOOLTIP_STYLE} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl tabular-nums text-foreground">{total}</strong><span className="text-[10px] text-muted-foreground">Total cases</span></div></div><ul className="w-full min-w-0 space-y-2">{data.map((item) => <li key={item.key} className="flex min-w-0 items-center gap-2 text-xs"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} /><span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span><strong className="shrink-0 tabular-nums text-foreground">{item.count}</strong><span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">{charted > 0 ? Math.round((item.count / charted) * 100) : 0}%</span></li>)}</ul></div>;
}

function RecentReports({ rows }: { rows: WbCaseListItem[] }): ReactElement {
  if (rows.length === 0) return <EmptyOverviewChart />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground"><th className="px-5 py-3 font-semibold">Case ID</th><th className="px-3 py-3 font-semibold">Category</th><th className="px-3 py-3 font-semibold">Priority</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Updated</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-muted/40"><td className="px-5 py-3"><Link to={ROUTES.WHISTLEBLOWING_DETAIL(row.id)} className="font-semibold text-brand-primary hover:text-brand-accent hover:underline">{row.caseReferenceNumber}</Link></td><td className="max-w-40 truncate px-3 py-3 text-muted-foreground">{wbCategoryLabelOf(row.category)}</td><td className="px-3 py-3 text-muted-foreground">{wbPriorityLabelOf(row.priority)}</td><td className="px-3 py-3"><StatusPill tone={wbStatusTone(row.status)} showIcon={false}>{wbStatusLabelOf(row.status)}</StatusPill></td><td className="whitespace-nowrap px-5 py-3 text-right text-xs text-muted-foreground">{formatDate(row.updatedAt)}</td></tr>)}</tbody></table></div>;
}

function ReportsTrend({ data }: { data: { month: string; count: number }[] }): ReactElement {
  return <div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 4 }}><CartesianGrid stroke={GRID_STROKE} vertical={false} /><XAxis dataKey="month" stroke={AXIS_STROKE} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} stroke={AXIS_STROKE} tick={{ fontSize: 10 }} /><Tooltip contentStyle={CHART_TOOLTIP_STYLE} /><Line type="monotone" dataKey="count" name="Reports received" stroke={CHART_COLORS.violet} strokeWidth={3} dot={{ r: 3, fill: '#fff', stroke: CHART_COLORS.violet, strokeWidth: 2 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>;
}

function CategoryInsights({ data }: { data: { name: string; label: string; count: number; fill: string }[] }): ReactElement {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return <ul className="mt-5 space-y-4">{data.slice(0, 5).map((item) => { const share = total > 0 ? (item.count / total) * 100 : 0; return <li key={item.name}><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plum-tint text-plum"><MessageSquare className="h-3.5 w-3.5" /></span><span className="min-w-0 truncate text-sm text-foreground">{item.label}</span></div><span className="shrink-0 text-xs tabular-nums text-muted-foreground">{Math.round(share)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(3, share)}%`, backgroundColor: CHART_COLORS.violet }} /></div></li>; })}</ul>;
}

function EvidenceQueueCard({ documents, messages, open, onOpenMessages }: { documents: number; messages: number; open: number; onOpenMessages: () => void }): ReactElement {
  return <SurfaceCard><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-foreground">Evidence queue</h2><p className="mt-1 text-sm text-muted-foreground">Activity from recent permitted reports.</p></div><span className="rounded-md bg-plum-tint px-2 py-1 text-xs font-semibold text-plum">{documents + messages}</span></div><div className="mt-5 space-y-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-signal-tint text-signal-strong"><Paperclip className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-foreground">{documents} documents</p><p className="text-xs text-muted-foreground">Attached to recent reports</p></div></div><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum-tint text-plum"><MessageSquare className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-foreground">{messages} case messages</p><p className="text-xs text-muted-foreground">Recorded in recent reports</p></div></div><div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-courage-tint text-courage-strong"><Inbox className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-foreground">{open} open reports</p><p className="text-xs text-muted-foreground">Awaiting active handling</p></div></div></div><button type="button" onClick={onOpenMessages} className="mt-6 text-sm font-semibold text-brand-accent hover:underline">View case activity <ArrowRight className="inline h-4 w-4" /></button></SurfaceCard>;
}

function CaseActivityDialog({ rows, onClose }: { rows: WbCaseListItem[]; onClose: () => void }): ReactElement {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="max-h-[min(38rem,calc(100vh-2rem))] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="case-activity-title"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent">Secure activity</p><h2 id="case-activity-title" className="mt-1 text-xl font-semibold text-foreground">Recent case messages</h2><p className="mt-1 text-sm text-muted-foreground">Message and evidence counts from reports in your permitted scope.</p></div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button></div><div className="mt-5 space-y-3">{rows.length === 0 ? <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No case activity yet.</p> : rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"><div className="min-w-0"><Link to={ROUTES.WHISTLEBLOWING_DETAIL(row.id)} onClick={onClose} className="font-semibold text-brand-primary hover:text-brand-accent hover:underline">{row.caseReferenceNumber}</Link><p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(row.updatedAt)}</p></div><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{row.messageCount}</span><span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{row.attachmentCount}</span></div></div>)}</div></div></div>;
}

function SecureFollowUpCard({ open, atRisk }: { open: number; atRisk: number }): ReactElement {
  return <SurfaceCard tone="protected" className="relative flex flex-col overflow-hidden"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-courage">Protected follow-up</p><h2 className="mt-2 text-base font-semibold text-porcelain">Keep cases moving securely</h2></div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-courage"><LockKeyhole className="h-4 w-4" /></span></div><p className="mt-3 text-sm leading-relaxed text-porcelain/70">Respond to reports and manage deadlines without exposing reporter identities.</p><div className="mt-6 space-y-4 border-t border-white/10 pt-5"><div className="flex items-center gap-3"><Inbox className="h-4 w-4 text-courage" /><div><p className="text-sm font-semibold text-porcelain">{open} open reports</p><p className="text-xs text-porcelain/55">Require active handling</p></div></div><div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-courage" /><div><p className="text-sm font-semibold text-porcelain">{atRisk} nearing SLA</p><p className="text-xs text-porcelain/55">Review before the deadline</p></div></div></div><Link to={ROUTES.WHISTLEBLOWING_REGISTER} className="mt-auto pt-6 text-sm font-semibold text-courage hover:text-porcelain">Go to case register <ArrowRight className="inline h-4 w-4" /></Link></SurfaceCard>;
}
