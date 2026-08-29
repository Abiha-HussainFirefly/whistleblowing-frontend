import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertTriangle,
  Bell,
  ChartNoAxesColumn,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FileWarning,
  FolderOpen,
  LayoutDashboard,
  Link2,
  Menu,
  MessageSquareWarning,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  UserCircle,
  UsersRound,
} from 'lucide-react';

type DashboardStats = {
  total: number;
  open: number;
  underInvestigation: number;
  escalated: number;
  closed: number;
  slaBreached: number;
  slaAtRisk: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  anonymousCount: number;
  namedCount: number;
  submissionsByMonth: { month: string; count: number }[];
};

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wb.internalToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const apiError = (error: unknown) => axios.isAxiosError(error) ? String(error.response?.data?.message ?? 'Request failed.') : 'Request failed.';

function Logo() {
  return <img className="brand-logo" src="/tellara-logo.png" alt="Tellara" />;
}

function VisualSidebar({ expanded, open, onToggle, onClose }: { expanded: boolean; open: boolean; onToggle: () => void; onClose: () => void }) {
  const location = useLocation();
  const links = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Contracts', icon: FileText },
    { label: 'Matters', icon: Scale },
    { label: 'Compliance', icon: ShieldCheck },
    { label: 'Whistleblowing', icon: MessageSquareWarning },
    { label: 'External Counsel', icon: UsersRound },
    { label: 'Reporting', icon: ChartNoAxesColumn },
  ];
  const displayName = localStorage.getItem('wb.userDisplayName') || 'Authenticated user';
  const email = localStorage.getItem('wb.userEmail') || '';
  const whistleblowingActive = location.pathname === '/whistleblowing' || location.pathname.startsWith('/whistleblowing/');
  return <aside className={`source-sidebar ${expanded ? 'expanded' : 'collapsed'} ${open ? '' : 'closed'}`}>
    <div className="source-sidebar-logo"><Link to="/whistleblowing"><Logo /></Link><button aria-label="Close menu" onClick={onClose}>×</button></div>
    <nav className="source-sidebar-nav">{links.map(({ label, icon: Icon }) => <Link key={label} to={label === 'Whistleblowing' ? '/whistleblowing/cases' : '/whistleblowing'} onClick={onClose} className={label === 'Whistleblowing' && whistleblowingActive ? 'active' : ''}><Icon /><span className={expanded ? '' : 'sr-only'}>{label}</span></Link>)}</nav>
    <div className="source-sidebar-footer"><UserCircle /><span className={expanded ? '' : 'sr-only'}><strong>{displayName}</strong>{email && <small>{email}</small>}</span></div>
    <button className="source-sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">{expanded ? '‹' : '›'}</button>
  </aside>;
}

function VisualShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const organizationSlug = localStorage.getItem('wb.organizationSlug') || import.meta.env.VITE_WB_ORGANIZATION_SLUG || '';
  const displayName = localStorage.getItem('wb.userDisplayName') || 'Authenticated user';
  const organizationLabel = organizationSlug ? organizationSlug.replaceAll('-', ' ') : 'Organization';
  const signOut = () => { localStorage.removeItem('wb.internalToken'); localStorage.removeItem('wb.permissions'); localStorage.removeItem('wb.userDisplayName'); localStorage.removeItem('wb.userEmail'); navigate('/auth/login'); };
  return <div className="source-app-shell">
    <VisualSidebar expanded={expanded} open={sidebarOpen} onToggle={() => setExpanded(value => !value)} onClose={() => setSidebarOpen(false)} />
    {!sidebarOpen && <button className="mobile-menu-button" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu /></button>}
    <div className="source-app-main">
      <header className="source-app-header"><div className="source-header-left"><button className="source-icon-button" aria-label="Toggle sidebar" onClick={() => { setSidebarOpen(true); setExpanded(value => !value); }}><Menu /></button><strong>Atlyis Legal Portal</strong></div><div className="source-header-actions"><button className="source-icon-button" aria-label="Search"><Search /></button><Link className="source-header-action" to="/whistleblowing/report-concern"><ShieldAlert /><span>Report a concern</span></Link><Link className="source-header-action source-upload" to="/whistleblowing/report-concern"><UploadCloud /><span>Upload</span></Link><span className="source-header-context"><span>{organizationLabel} / User</span></span><span className="source-header-status">Organization scoped</span><label className="source-language"><span>🇬🇧</span><select aria-label="Language"><option>English</option></select></label><Link className="source-icon-button" aria-label="Notifications" to="/notifications"><Bell /></Link><button className="source-user-button" onClick={signOut}><UserCircle /><span>{displayName}</span></button></div></header>
      <main className="source-main-content">{children}</main>
    </div>
  </div>;
}

function WbHeader() {
  return <div className="wb-header"><div className="wb-heading"><div className="wb-icon"><MessageSquareWarning /></div><div><h1>Whistleblowing &amp; Incident Management</h1><p>Confidential intake, investigation workflow &amp; board-ready analytics.</p></div></div><nav className="wb-tabs"><Link to="/whistleblowing">Dashboard</Link><Link to="/whistleblowing/cases">Cases</Link></nav></div>;
}

function ChartCard({ title, description, values }: { title: string; description: string; values: Record<string, number> }) {
  const entries = Object.entries(values).filter(([, value]) => value > 0);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return <section className="source-chart-card"><header><h3>{title}</h3><p>{description}</p></header>{entries.length === 0 ? <p className="source-chart-empty">No data to display yet.</p> : entries.map(([label, value]) => <div className="chart-row" key={label}><div><span>{label.replaceAll('_', ' ')}</span><strong>{value}</strong></div><i style={{ width: `${Math.max(4, value / max * 100)}%` }} /></div>)}</section>;
}

export function VisualDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const slug = localStorage.getItem('wb.organizationSlug') || import.meta.env.VITE_WB_ORGANIZATION_SLUG || '';
  const publicLink = slug ? `${window.location.origin}/report/${slug}` : `${window.location.origin}/report`;
  useEffect(() => { api.get('/whistleblowing/dashboard/stats').then(response => setStats(response.data)).catch(errorResponse => setError(apiError(errorResponse))); }, []);
  const exportCsv = async () => { setExporting(true); try { const response = await api.get('/whistleblowing/dashboard/export.csv', { responseType: 'blob' }); const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = 'whistleblowing-cases.csv'; link.click(); URL.revokeObjectURL(url); } catch (errorResponse) { setError(apiError(errorResponse)); } finally { setExporting(false); } };
  const copyLink = async () => { try { await navigator.clipboard.writeText(publicLink); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch (errorResponse) { setError(apiError(errorResponse)); } };
  const cards = stats ? [{ label: 'TOTAL REPORTS', value: stats.total, hint: `${stats.closed} closed`, icon: FolderOpen, iconClass: 'stat-blue' }, { label: 'OPEN REPORTS', value: stats.open, hint: '', icon: FileWarning, iconClass: 'stat-amber' }, { label: 'UNDER INVESTIGATION', value: stats.underInvestigation, hint: stats.slaAtRisk > 0 ? `${stats.slaAtRisk} at risk` : 'On track', icon: Clock3, iconClass: 'stat-green' }, { label: 'ESCALATED', value: stats.escalated, hint: `${stats.slaBreached} SLA breached`, icon: AlertTriangle, iconClass: 'stat-purple' }] : [];
  return <VisualShell><WbHeader /><div className="source-dashboard-title"><h2>Board-ready overview</h2><div className="actions"><Link className="source-button source-button-outline" to="/whistleblowing/report-concern">Submit a report</Link><button className="source-button source-button-outline" onClick={() => void exportCsv()} disabled={exporting}><Download />{exporting ? 'Exporting...' : 'Export CSV'}</button><Link className="source-button" to="/whistleblowing/cases">View all cases</Link></div></div><section className="source-public-link"><div className="source-public-link-heading"><span className="source-link-icon"><Link2 /></span><div><h3>Public reporting link</h3><p>Share this with employees, contractors, vendors, or external reporters.</p></div></div><div className="source-public-link-body"><code title={publicLink}>{publicLink}</code><div className="source-public-link-actions"><button className="source-button source-button-full" onClick={() => void copyLink()}><Copy />{copied ? 'Copied' : 'Copy link'}</button><a className="source-button source-button-outline source-button-full" href={publicLink} target="_blank" rel="noreferrer"><ExternalLink />Open public form</a></div><ul><li><CheckCircle2 />No account is required to submit.</li><li><CheckCircle2 />Anonymous reporting stays available.</li><li><CheckCircle2 />Reports route to the same secure intake flow.</li></ul></div></section>{error && <p className="source-error">{error}</p>}{!error && !stats && <div className="source-state">Loading dashboard...</div>}{stats && <><section className="source-stat-grid source-stat-grid-four">{cards.map(({ label, value, hint, icon: Icon, iconClass }) => <article className="source-stat-card" key={label}><div><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div><i className={iconClass}><Icon /></i></article>)}</section><div className="source-chart-grid source-chart-grid-two"><ChartCard title="Reports by Category" description="Distribution across the lifecycle" values={stats.byCategory} /><ChartCard title="Open vs Escalated" description="Current intake against escalations" values={{ OPEN: stats.open, ESCALATED: stats.escalated }} /><ChartCard title="Reports by Priority" description="Risk distribution" values={stats.byPriority} /><ChartCard title="Reports by Status" description="Lifecycle distribution" values={stats.byStatus} /><ChartCard title="Anonymous vs Named" description="Reporter identity preference" values={{ Anonymous: stats.anonymousCount, Named: stats.namedCount }} /></div><section className="source-chart-card source-trend-card"><header><h3>Submissions Trend</h3><p>Monthly intake (last 6 months)</p></header>{stats.submissionsByMonth.length === 0 ? <p className="source-chart-empty">No data to display yet.</p> : <div className="trend-grid">{stats.submissionsByMonth.map(item => <div key={item.month}><span>{item.month}</span><i style={{ height: `${Math.max(8, item.count * 16)}px` }} /><strong>{item.count}</strong></div>)}</div>}</section></>}</VisualShell>;
}
