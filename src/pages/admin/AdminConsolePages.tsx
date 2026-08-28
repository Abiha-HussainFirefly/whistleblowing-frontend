import { useQuery } from '@tanstack/react-query';
import { Activity, Building2, CheckCircle2, KeyRound, Layers3, Plus, Shield, Users } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { adminService, type AdminDashboardStats, type AdminOrganization, type AdminPermission, type AdminRole, type AdminSettings, type AdminUser } from '@features/admin/api/admin.service';
import { Loader } from '@components/common/Loader';
import { PageTitle } from '@components/ui/page-title';
import { Button } from '@components/ui/button';
import { getApiErrorMessage } from '@lib/api-error';
import { ROUTES } from '@config/routes';

function useAdminQuery<T>(key: string, queryFn: () => Promise<T>) {
  return useQuery({ queryKey: ['platform-admin', key], queryFn, retry: false });
}

function Frame({ eyebrow, title, subtitle, action, children }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode; children: ReactNode }): ReactElement {
  return <div className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div>{eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent">{eyebrow}</p>}<PageTitle className="mt-1 text-xl text-brand-primary">{title}</PageTitle>{subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>}</div>{action}</div>{children}</div>;
}

function State({ loading, error, children }: { loading: boolean; error: unknown; children: ReactNode }): ReactElement {
  if (loading) return <Loader label="Loading system data..." />;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{getApiErrorMessage(error)}</div>;
  return <>{children}</>;
}

function Metric({ label, value, icon: Icon, tone = 'teal' }: { label: string; value: string | number; icon: typeof Users; tone?: 'teal' | 'blue' | 'purple' | 'amber' }): ReactElement {
  const tones = { teal: 'bg-[#e5f4f5] text-brand-accent', blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600' };
  return <article className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p></div><span className={`flex h-8 w-8 items-center justify-center rounded-md ${tones[tone]}`}><Icon className="h-4 w-4" /></span></div></article>;
}

function Empty({ label }: { label: string }): ReactElement { return <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-400">{label}</div>; }

function Table({ children }: { children: ReactNode }): ReactElement { return <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full min-w-[720px] text-sm">{children}</table></div>; }

function TableHead({ children }: { children: ReactNode }): ReactElement { return <thead className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-400"><tr>{children}</tr></thead>; }

export function AdminDashboardPage(): ReactElement {
  const q = useAdminQuery<AdminDashboardStats>('dashboard', adminService.dashboard);
  return <Frame eyebrow="System Console" title="Welcome" subtitle="Platform-wide administration, organizations, licensing and access controls."><State loading={q.isLoading} error={q.error}>{q.data && <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Total organizations" value={q.data.organizations} icon={Building2} /><Metric label="Total users" value={q.data.users} icon={Users} tone="blue" /><Metric label="Active permissions" value={q.data.permissions} icon={KeyRound} tone="purple" /><Metric label="Roles" value={q.data.roles} icon={Shield} tone="amber" /><Metric label="Whistleblowing cases" value={q.data.cases} icon={Activity} /></div><div className="grid gap-4 lg:grid-cols-2"><section className="rounded-lg border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center gap-2"><Layers3 className="h-4 w-4 text-brand-accent" /><h2 className="text-sm font-semibold text-slate-900">Executive overview</h2></div><p className="text-sm leading-relaxed text-slate-500">Live counts are sourced from this standalone Whistleblowing database. Organization boundaries remain enforced by the application API.</p></section><section className="rounded-lg border border-slate-200 bg-white p-5"><div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-accent" /><h2 className="text-sm font-semibold text-slate-900">Quick links</h2></div><div className="flex flex-wrap gap-2"><Link className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-brand-accent hover:text-brand-accent" to={ROUTES.ADMIN.ORGANIZATIONS}>Organizations</Link><Link className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-brand-accent hover:text-brand-accent" to={ROUTES.ADMIN.USERS}>Users</Link><Link className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-brand-accent hover:text-brand-accent" to={ROUTES.ADMIN.PERMISSIONS}>Permissions</Link></div></section></div></>}</State></Frame>;
}

export function AdminOrganizationsPage(): ReactElement {
  const q = useAdminQuery<AdminOrganization[]>('organizations', adminService.organizations);
  return <Frame eyebrow="System Console" title="Organizations" subtitle="Manage organizations and their platform footprint." action={<Button disabled className="gap-1"><Plus className="h-4 w-4" />Create organization</Button>}><State loading={q.isLoading} error={q.error}>{q.data && (q.data.length === 0 ? <Empty label="No organizations are available." /> : <Table><TableHead><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Members</th><th className="px-4 py-3">Cases</th><th className="px-4 py-3">Created</th></TableHead><tbody className="divide-y divide-slate-100">{q.data.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{row.name}</td><td className="px-4 py-3 text-slate-500">{row.slug}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{row.status}</span></td><td className="px-4 py-3 text-slate-600">{row.members}</td><td className="px-4 py-3 text-slate-600">{row.cases}</td><td className="px-4 py-3 text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</td></tr>)}</tbody></Table>)}</State></Frame>;
}

export function AdminPermissionsPage(): ReactElement {
  const q = useAdminQuery<AdminPermission[]>('permissions', adminService.permissions);
  return <Frame eyebrow="Access control" title="Permissions" subtitle="Manage platform permissions for portal resources and actions." action={<Button disabled className="gap-1"><Plus className="h-4 w-4" />Create permission</Button>}><State loading={q.isLoading} error={q.error}>{q.data && (q.data.length === 0 ? <Empty label="No active permissions are available." /> : <Table><TableHead><th className="px-4 py-3">Key</th><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Roles</th></TableHead><tbody className="divide-y divide-slate-100">{q.data.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-mono text-xs text-slate-700">{row.key}</td><td className="px-4 py-3 text-slate-600">{row.resource}</td><td className="px-4 py-3 text-slate-600">{row.action}</td><td className="px-4 py-3 text-slate-600">{row.roles}</td></tr>)}</tbody></Table>)}</State></Frame>;
}

export function AdminRolesPage(): ReactElement {
  const q = useAdminQuery<AdminRole[]>('roles', adminService.roles);
  return <Frame eyebrow="Access control" title="Roles" subtitle="Review system and organization roles across the platform." action={<Button disabled className="gap-1"><Plus className="h-4 w-4" />Create role</Button>}><State loading={q.isLoading} error={q.error}>{q.data && (q.data.length === 0 ? <Empty label="No roles are available." /> : <Table><TableHead><th className="px-4 py-3">Role</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Permissions</th></TableHead><tbody className="divide-y divide-slate-100">{q.data.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{row.name}</td><td className="px-4 py-3 text-slate-600">{row.scope}</td><td className="px-4 py-3 text-slate-600">{row.system ? 'System' : 'Custom'}</td><td className="px-4 py-3 text-slate-600">{row.permissions}</td></tr>)}</tbody></Table>)}</State></Frame>;
}

export function AdminUsersPage(): ReactElement {
  const q = useAdminQuery<AdminUser[]>('users', adminService.users);
  return <Frame eyebrow="System Console" title="Users" subtitle="Manage platform users, status and organization membership." action={<Button disabled className="gap-1"><Plus className="h-4 w-4" />Create user</Button>}><State loading={q.isLoading} error={q.error}>{q.data && (q.data.length === 0 ? <Empty label="No users are available." /> : <Table><TableHead><th className="px-4 py-3">User</th><th className="px-4 py-3">Platform role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Organizations</th><th className="px-4 py-3">Created</th></TableHead><tbody className="divide-y divide-slate-100">{q.data.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="font-medium text-slate-900">{row.displayName ?? '—'}</p><p className="text-xs text-slate-400">{row.email}</p></td><td className="px-4 py-3 text-slate-600">{row.platformRole}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{row.status}</span></td><td className="px-4 py-3 text-slate-600">{row.organizations}</td><td className="px-4 py-3 text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</td></tr>)}</tbody></Table>)}</State></Frame>;
}

function ReadonlyEmptyPage({ title, subtitle }: { title: string; subtitle: string }): ReactElement { return <Frame eyebrow="System Console" title={title} subtitle={subtitle}><Empty label="This standalone Whistleblowing deployment does not persist this Civorah platform resource." /></Frame>; }
export function AdminPlansPage(): ReactElement { const q = useAdminQuery('plans', adminService.plans); return <State loading={q.isLoading} error={q.error}><ReadonlyEmptyPage title="Licensing Plans" subtitle="Review plan definitions and entitlements." /></State>; }
export function AdminConfigPacksPage(): ReactElement { const q = useAdminQuery('config-packs', adminService.configPacks); return <State loading={q.isLoading} error={q.error}><ReadonlyEmptyPage title="Config Packs" subtitle="Review reusable organization configuration packs." /></State>; }
export function AdminCapabilitiesPage(): ReactElement { const q = useAdminQuery('capabilities', adminService.capabilities); return <Frame eyebrow="System Console" title="Capabilities" subtitle="Permission capabilities available in the standalone deployment."><State loading={q.isLoading} error={q.error}>{q.data && (q.data.length === 0 ? <Empty label="No capabilities are available." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{q.data.map((row) => <article key={row.id} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm font-semibold text-slate-900">{row.resource}</p><p className="mt-1 text-xs text-slate-500">{row.action}</p><p className="mt-3 font-mono text-[11px] text-brand-accent">{row.key}</p></article>)}</div>)}</State></Frame>;
}
export function AdminSettingsPage(): ReactElement { const q = useAdminQuery<AdminSettings>('settings', adminService.settings); return <Frame eyebrow="System Console" title="Settings" subtitle="Platform configuration and live deployment information."><State loading={q.isLoading} error={q.error}>{q.data && <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold text-slate-900">System information</h2><dl className="mt-4 divide-y divide-slate-100">{[['Product', q.data.product], ['Environment', q.data.apiEnvironment]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-800">{value}</dd></div>)}</dl></section><section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold text-slate-900">Live totals</h2><dl className="mt-4 divide-y divide-slate-100">{[['Organizations', q.data.organizations], ['Users', q.data.users], ['Whistleblowing cases', q.data.cases]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-slate-500">{label}</dt><dd className="font-semibold text-brand-accent">{String(value)}</dd></div>)}</dl></section></div>}</State></Frame>; }
