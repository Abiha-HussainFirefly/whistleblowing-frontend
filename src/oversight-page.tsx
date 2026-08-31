import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getAccessToken } from '@lib/auth-token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1' });
api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const errorText = (e: unknown) => axios.isAxiosError(e) ? String(e.response?.data?.message ?? 'Request failed.') : 'Request failed.';
const badge = (value: string) => value.replaceAll('_', ' ');
const statuses = ['SUBMITTED', 'UNDER_TRIAGE', 'UNDER_INVESTIGATION', 'WB_ESCALATED', 'RESOLVED', 'WB_CLOSED', 'WB_DISMISSED'];
const categories = ['FRAUD', 'BRIBERY_CORRUPTION', 'HARASSMENT', 'CONFLICT_OF_INTEREST', 'DATA_PRIVACY', 'HEALTH_SAFETY', 'DISCRIMINATION', 'RETALIATION', 'OTHER_MISCONDUCT', 'INQUIRY'];

export function OversightPageFull() {
  const org = localStorage.getItem('wb.organizationId') ?? '';
  const navigate = useNavigate();
  const routeParams = useParams<{ id?: string }>();
  const [params, setParams] = useSearchParams();
  const selected = params.get('caseId') ?? routeParams.id;
  const [tab, setTab] = useState<'overview' | 'register'>('overview');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState('');

  async function load() {
    if (!org) return;
    setError('');
    try {
      const filters = { page: 1, pageSize: 100, ...(region ? { regionCode: region } : {}), ...(status ? { status } : {}), ...(category ? { category } : {}) };
      const [s, r, c] = await Promise.all([
        api.get(`/organizations/${org}/whistleblowing/stats`, { params: region ? { regionCode: region } : undefined }),
        api.get(`/organizations/${org}/whistleblowing/regions`),
        api.get(`/organizations/${org}/whistleblowing/cases`, { params: filters }),
      ]);
      setStats(s.data); setRegions(r.data.regions ?? []); setCases(c.data.data ?? []);
    } catch (e) { setError(errorText(e)); }
  }

  useEffect(() => { void load(); }, [org, region, status, category]);
  useEffect(() => {
    if (!selected || !org) { setDetail(null); return; }
    setError('');
    api.get(`/organizations/${org}/whistleblowing/cases/${selected}`).then(r => setDetail(r.data)).catch(e => setError(errorText(e)));
  }, [org, selected]);

  if (!org) return <main className="shell"><p className="error">Organization context is unavailable. Sign in again.</p></main>;
  if (selected && detail) return <main className="shell"><button className="secondary" onClick={() => routeParams.id ? navigate('/org-admin/whistleblowing') : setParams({})}>Back to oversight</button><section className="card"><p className="eyebrow">{detail.caseReferenceNumber}</p><h1>Oversight case detail</h1><dl className="details"><dt>Category</dt><dd>{badge(detail.category)}</dd><dt>Status</dt><dd>{badge(detail.status)}</dd><dt>Priority</dt><dd>{badge(detail.priority)}</dd><dt>Region</dt><dd>{detail.regionCode ?? '—'}</dd><dt>Description</dt><dd>{detail.incidentDescription}</dd><dt>Submitted</dt><dd>{new Date(detail.submittedAt).toLocaleString()}</dd></dl></section></main>;

  return <main className="shell"><div className="titlebar"><div><p className="eyebrow">Organization oversight</p><h1>Whistleblowing oversight</h1></div><button onClick={() => void load()}>Refresh</button></div><p className="notice">Oversight is read-only and always applies conflict-of-interest visibility restrictions.</p><div className="actions"><button className={tab === 'overview' ? '' : 'secondary'} onClick={() => setTab('overview')}>Overview</button><button className={tab === 'register' ? '' : 'secondary'} onClick={() => setTab('register')}>Case register ({cases.length})</button><select aria-label="Region" value={region} onChange={e => setRegion(e.target.value)}><option value="">All regions</option>{regions.map(r => <option key={r.regionCode} value={r.regionCode}>{r.regionCode} ({r.caseCount})</option>)}</select></div>{error && <p className="error">{error}</p>}{tab === 'overview' && stats && <><section className="stats">{[['Total', stats.total], ['Open', stats.open], ['Under investigation', stats.underInvestigation], ['Escalated', stats.escalated], ['SLA breached', stats.slaBreached], ['SLA at risk', stats.slaAtRisk], ['Closed', stats.closed], ['Average resolution days', stats.avgResolutionDays ?? '—']].map(([label, value]) => <div className="card" key={String(label)}><span>{String(label)}</span><strong>{String(value)}</strong></div>)}</section><section className="card"><h2>Six-month submission trend</h2>{(stats.submissionsByMonth ?? []).map((item: any) => <p key={item.month}><span>{item.month}</span> <strong>{item.count}</strong></p>)}</section><section className="analytics-grid"><div className="card"><h2>By status</h2>{Object.entries(stats.byStatus ?? {}).map(([key, value]) => <p key={key}>{badge(key)}: <strong>{String(value)}</strong></p>)}</div><div className="card"><h2>By category</h2>{Object.entries(stats.byCategory ?? {}).map(([key, value]) => <p key={key}>{badge(key)}: <strong>{String(value)}</strong></p>)}</div><div className="card"><h2>By priority</h2>{Object.entries(stats.byPriority ?? {}).map(([key, value]) => <p key={key}>{badge(key)}: <strong>{String(value)}</strong></p>)}</div></section></>}{tab === 'register' && <section className="card"><div className="filter"><select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(v => <option key={v}>{v}</option>)}</select><select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(v => <option key={v}>{v}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Category</th><th>Status</th><th>Priority</th><th>Region</th></tr></thead><tbody>{cases.map(c => <tr key={c.id}><td><button className="link-button" onClick={() => setParams({ caseId: c.id })}>{c.caseReferenceNumber}</button></td><td>{badge(c.category)}</td><td>{badge(c.status)}</td><td>{badge(c.priority)}</td><td>{c.regionCode ?? '—'}</td></tr>)}</tbody></table></div>{!cases.length && <p>No oversight cases are visible.</p>}</section>}</main>;
}
