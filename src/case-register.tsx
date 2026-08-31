import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAccessToken } from '@lib/auth-token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1' });
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const statuses = ['SUBMITTED', 'UNDER_TRIAGE', 'UNDER_INVESTIGATION', 'WB_ESCALATED', 'RESOLVED', 'WB_CLOSED', 'WB_DISMISSED'];
const categories = ['FRAUD', 'BRIBERY_CORRUPTION', 'HARASSMENT', 'CONFLICT_OF_INTEREST', 'DATA_PRIVACY', 'HEALTH_SAFETY', 'DISCRIMINATION', 'RETALIATION', 'OTHER_MISCONDUCT', 'INQUIRY'];
const priorities = ['PRIORITY_LOW', 'PRIORITY_MEDIUM', 'PRIORITY_HIGH', 'PRIORITY_CRITICAL'];
const label = (value: string) => value.replaceAll('_', ' ');

type CaseRow = {
  id: string; caseReferenceNumber: string; category: string; priority: string; status: string;
  regionCode?: string | null; reporterAlias?: string; isAnonymous: boolean; submittedAt: string;
  slaDeadline?: string | null; slaBreachedAt?: string | null;
  assignedInvestigator?: { displayName?: string | null; email?: string | null } | null;
  messageCount?: number; attachmentCount?: number; hiddenFromCount?: number;
};
type Page = { data: CaseRow[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

export function CaseRegisterContent() {
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('');
  const [category, setCategory] = useState(''); const [priority, setPriority] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false); const [result, setResult] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { const response = await api.get('/whistleblowing/cases', { params: { page, pageSize, search: search || undefined, status: status || undefined, category: category || undefined, priority: priority || undefined, assignedToMe: assignedToMe || undefined } }); setResult(response.data); }
    catch (e) { setError(axios.isAxiosError(e) ? String(e.response?.data?.message ?? 'Unable to load cases.') : 'Unable to load cases.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [page, pageSize, status, category, priority, assignedToMe]);
  function resetPage(setter: (value: string) => void, value: string) { setter(value); setPage(1); }
  return <>
    <div className="page-titlebar"><div><span className="source-eyebrow">Investigation console</span><h2>Case register</h2></div><div className="actions"><a className="source-button" href="/cases/new">New manual case</a><button className="source-button source-button-outline" onClick={() => void load()} disabled={loading}>Refresh</button></div></div>
    <div className="source-filters case-register-filters"><input placeholder="Search reference / description / persons…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); void load(); } }} /><select aria-label="Status" value={status} onChange={(e) => resetPage(setStatus, e.target.value)}><option value="">All statuses</option>{statuses.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select><select aria-label="Category" value={category} onChange={(e) => resetPage(setCategory, e.target.value)}><option value="">All categories</option>{categories.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select><select aria-label="Priority" value={priority} onChange={(e) => resetPage(setPriority, e.target.value)}><option value="">All risk ratings</option>{priorities.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select><label className="filter-check"><input type="checkbox" checked={assignedToMe} onChange={(e) => { setAssignedToMe(e.target.checked); setPage(1); }} /> Assigned to me</label><button className="source-button" onClick={() => { setPage(1); void load(); }}>Search</button></div>
    {error && <p className="source-error">{error}</p>}
    {loading ? <div className="source-state">Loading cases…</div> : result?.data.length === 0 ? <div className="source-state">No cases match your filters.</div> : <div className="source-table-wrap"><table className="source-table"><thead><tr><th>Reference</th><th>Category</th><th>Risk</th><th>Status</th><th>Reporter</th><th>Activity</th><th>SLA</th><th>Submitted</th></tr></thead><tbody>{result?.data.map((c) => { const days = c.slaDeadline ? Math.ceil((new Date(c.slaDeadline).getTime() - Date.now()) / 86400000) : null; return <tr key={c.id}><td><a href={`/whistleblowing/detail/${c.id}`}>{c.caseReferenceNumber}</a>{c.hiddenFromCount ? <small>COI exclusions: {c.hiddenFromCount}</small> : null}</td><td><span className="source-badge">{label(c.category)}</span></td><td><span className="source-badge source-badge-risk">{label(c.priority)}</span></td><td><span className="source-badge">{label(c.status)}</span></td><td>{c.isAnonymous ? 'Anonymous' : c.reporterAlias}</td><td>{c.messageCount ?? 0} messages · {c.attachmentCount ?? 0} files</td><td className={c.slaBreachedAt ? 'danger' : days !== null && days <= 7 ? 'warning' : ''}>{c.slaBreachedAt ? 'Breached' : days === null ? '—' : `${days}d left`}</td><td>{new Date(c.submittedAt).toLocaleDateString()}</td></tr>; })}</tbody></table></div>}
    {result && <div className="pagination"><button className="secondary" disabled={page <= 1 || loading} onClick={() => setPage((v) => v - 1)}>Previous</button><span>Page {result.meta.page} of {result.meta.totalPages} · {result.meta.total} cases</span><select aria-label="Page size" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}><option value={20}>20 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option></select><button className="secondary" disabled={page >= result.meta.totalPages || loading} onClick={() => setPage((v) => v + 1)}>Next</button></div>}
  </>;
}
