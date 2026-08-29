import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, BarChart3, CircleHelp, Globe2, Shield, Users } from 'lucide-react';
import { Loader } from '@components/common/Loader';
import { PageTitle } from '@components/ui/page-title';
import { Badge } from '@components/ui/badge';
import { ROUTES } from '@config/routes';
import { getApiErrorMessage } from '@lib/api-error';
import { contextQueryKey } from '@lib/context-query-key';
import { useAuthStore } from '@store/authStore';
import { tenantAdminService } from '@features/org-admin/api/tenant-admin.service';
import { useWbOversightStats } from '@features/org-admin/hooks/whistleblowing-oversight';

const key = (name: string) => contextQueryKey(`tenant-${name}`);

function Card({ children, className = '' }: { children: ReactElement | ReactElement[]; className?: string }): ReactElement {
  return <section className={`rounded-lg border border-border bg-white ${className}`}>{children}</section>;
}

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint: string; icon: typeof Users }): ReactElement {
  return <Card className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{label}</p><p className="mt-2 text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground/70">{hint}</p></div><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e5f4f5] text-brand-accent"><Icon className="h-4 w-4" /></span></div></Card>;
}

function Pie({ percent, label, value }: { percent: number; label: string; value: string }): ReactElement {
  const safe = Math.min(100, Math.max(0, percent));
  return <div className="flex items-center gap-5"><div className="relative h-24 w-24 shrink-0 rounded-full" style={{ background: `conic-gradient(#078995 ${safe}%, #e7edf3 0)` }}><div className="absolute inset-3 rounded-full bg-white" /></div><div className="min-w-0"><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-brand-accent" />{label}</div><p className="mt-1 text-sm font-semibold text-foreground">{value}</p></div></div>;
}

function Donut({ admins, users }: { admins: number; users: number }): ReactElement {
  const total = admins + users;
  const adminPercent = total === 0 ? 0 : Math.round((admins / total) * 100);
  return <div className="flex items-center gap-5"><div className="relative h-24 w-24 shrink-0 rounded-full" style={{ background: `conic-gradient(#078995 ${adminPercent}%, #3f7fec 0)` }}><div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white"><strong className="text-lg text-foreground">{total}</strong><span className="text-[9px] text-muted-foreground/70">Total</span></div></div><div className="space-y-2 text-xs text-muted-foreground"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-accent" />Admins {admins} ({adminPercent}%)</div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#3f7fec]" />Users {users} ({total === 0 ? 0 : 100 - adminPercent}%)</div></div></div>;
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
  const loading = stats.isLoading || members.isLoading || invitations.isLoading || regions.isLoading || oversight.isLoading;
  const error = stats.error ?? members.error ?? invitations.error ?? regions.error ?? oversight.error;
  const memberRows = members.data?.data ?? [];
  const regionCounts = memberRows.reduce<Record<string, number>>((result, member) => { const region = member.regionCode ?? 'Unassigned'; result[region] = (result[region] ?? 0) + 1; return result; }, {});
  const firstRegion = Object.entries(regionCounts)[0];
  const health = stats.data?.members ? Math.max(0, Math.min(100, Math.round((stats.data.admins / stats.data.members) * 100))) : 0;
  const displayName = user?.displayName ?? user?.email ?? 'there';

  return <div className="space-y-5">
    <div><PageTitle className="text-xl text-brand-primary">Welcome, {displayName}.</PageTitle><p className="mt-1 text-sm text-muted-foreground">Organization management console for {organization?.name ?? 'your organization'}. Manage members, oversight, roles, regions, and settings from here.</p>{activeRegion !== null && <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] text-muted-foreground">Active region: {activeRegion}</span>}</div>
    {loading && <Loader label="Loading organization overview..." />}
    {error && <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{getApiErrorMessage(error)}</div>}
    {!loading && !error && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Card className="flex items-center gap-3 p-4"><div className="relative h-12 w-12 shrink-0 rounded-full" style={{ background: `conic-gradient(#078995 ${health}%, #edf2f6 0)` }}><div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-white text-[10px] font-semibold text-brand-accent">{health}%</div></div><div><p className="text-sm font-semibold text-brand-primary">Organization Health</p><Badge variant="success" className="mt-1">{health >= 75 ? 'Healthy' : 'Needs attention'}</Badge></div></Card><Stat label="Admin Seats" value={stats.data?.admins ?? 0} hint="Active administrators" icon={Users} /><Stat label="User Seats" value={stats.data?.users ?? 0} hint="Active portal users" icon={Users} /><Stat label="AI Credits" value="0" hint="Not configured" icon={Activity} /></div>
      <div className="flex gap-5 border-b border-border text-xs"><span className="border-b-2 border-brand-accent px-2 pb-2 font-medium text-brand-accent">Overview</span><Link to={ROUTES.ORG_ADMIN.WHISTLEBLOWING} className="px-2 pb-2 text-muted-foreground hover:text-brand-accent">Whistleblowing</Link></div>
      <div><p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Organization overview</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total Members" value={stats.data?.members ?? 0} hint={`Admins: ${stats.data?.admins ?? 0} · Users: ${stats.data?.users ?? 0}`} icon={Users} /><Stat label="Pending Invitations" value={invitations.data?.data.filter((item) => item.status === 'PENDING').length ?? 0} hint="Awaiting acceptance" icon={CircleHelp} /><Stat label="Active Regions" value={stats.data?.activeRegions ?? 0} hint={`Total regions: ${regions.data?.length ?? 0}`} icon={Globe2} /><Stat label="Modules Enabled" value={stats.data?.enabledModules.length ?? 0} hint="Licensed modules" icon={Shield} /></div></div>
      <div className="grid gap-4 xl:grid-cols-2"><Card className="p-4"><h2 className="text-sm font-semibold text-foreground">Members by Region</h2><div className="mt-5 flex min-h-28 items-center justify-center">{firstRegion ? <Pie percent={(firstRegion[1] / Math.max(memberRows.length, 1)) * 100} label={firstRegion[0]} value={`${firstRegion[1]} (${Math.round((firstRegion[1] / memberRows.length) * 100)}%)`} /> : <p className="text-xs text-muted-foreground/70">No member region data yet.</p>}</div></Card><Card className="p-4"><h2 className="text-sm font-semibold text-foreground">Members by Role Type</h2><div className="mt-5 flex min-h-28 items-center justify-center"><Donut admins={stats.data?.admins ?? 0} users={stats.data?.users ?? 0} /></div></Card></div>
      <Card className="p-4"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-foreground">Whistleblowing overview</h2><p className="mt-1 text-xs text-muted-foreground/70">Live organization-scoped incident reporting totals.</p></div><Link to={ROUTES.ORG_ADMIN.WHISTLEBLOWING} className="inline-flex items-center gap-1 text-xs font-medium text-brand-accent">Open module <ArrowRight className="h-3 w-3" /></Link></div><div className="mt-4 grid gap-3 sm:grid-cols-4"><Stat label="Total Cases" value={oversight.data?.total ?? 0} hint="Visible reports" icon={BarChart3} /><Stat label="Open" value={oversight.data?.open ?? 0} hint="Open cases" icon={BarChart3} /><Stat label="Escalated" value={oversight.data?.escalated ?? 0} hint="Escalated cases" icon={BarChart3} /><Stat label="SLA Breached" value={oversight.data?.slaBreached ?? 0} hint="Requires attention" icon={BarChart3} /></div></Card>
    </>}
  </div>;
}
