import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { validateReporterDraft } from './workflow-logic';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1' });
const errorText = (e: unknown) => axios.isAxiosError(e) ? String(e.response?.data?.message ?? 'Request failed.') : 'Request failed.';
const relationships = ['EMPLOYEE','FORMER_EMPLOYEE','CONTRACTOR','VENDOR_SUPPLIER','CUSTOMER','BUSINESS_PARTNER','OTHER_RELATIONSHIP'];
const durations = ['ONE_TIME','LESS_THAN_MONTH','ONE_TO_THREE_MONTHS','THREE_TO_SIX_MONTHS','SIX_TO_TWELVE_MONTHS','OVER_A_YEAR','ONGOING','UNKNOWN_DURATION'];
const awareness = ['WITNESSED','TOLD_BY_SOMEONE','REVIEWED_DOCUMENTS','RUMOR','INVOLVED','OTHER_SOURCE'];
type Person = { firstName: string; lastName: string; title: string };

export function EnrichedReport() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [organizationSlug, setOrganizationSlug] = useState(slug ?? '');
  const [portal, setPortal] = useState<any>({ categories: [], regions: [], complianceTeam: [] });
  const [named, setNamed] = useState(false);
  const [involved, setInvolved] = useState<Person[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!organizationSlug) return;
    api.get(`/whistleblowing/portal/org/${encodeURIComponent(organizationSlug)}`).then((r) => setPortal(r.data)).catch((e) => setError(errorText(e)));
  }, [organizationSlug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const validation = validateReporterDraft({ category: String(form.get('category') ?? ''), description: String(form.get('description') ?? ''), incidentDate: String(form.get('incidentDate') ?? '') || undefined, acceptedTerms: form.get('terms') === 'on', anonymous: !named, email: named ? String(form.get('email') ?? '') : undefined });
    if (validation) { setError(`Please correct the report form (${validation}).`); return; }
    try {
      const { data } = await api.post('/whistleblowing/portal/reports', {
        organizationSlug, category: form.get('category'), incidentDescription: String(form.get('description') ?? '').trim(), incidentDate: form.get('incidentDate') || undefined,
        incidentLocation: form.get('location') || undefined, locationCity: form.get('city') || undefined, locationState: form.get('state') || undefined, locationPostalCode: form.get('postal') || undefined, locationCountry: form.get('country') || undefined,
        regionCode: form.get('region') || undefined, relationshipToOrg: form.get('relationship') || undefined, personsInvolved: form.get('persons') || undefined,
        involvedPersons: involved.filter((p) => p.firstName.trim() || p.lastName.trim() || p.title.trim()), previouslyReported: form.get('previouslyReported') || undefined, whenLastOccurred: form.get('whenLastOccurred') || undefined,
        conductDuration: form.get('conductDuration') || undefined, awarenessSource: form.get('awarenessSource') || undefined, isAnonymous: !named, reporterEmail: named ? form.get('email') : undefined,
        reporterPhone: named ? form.get('phone') || undefined : undefined, reporterPreferredContact: named ? form.get('preferredContact') || undefined : undefined,
        conflictOfInterestDeclared: form.get('coi') === 'on', hiddenFromUserPublicIds: form.getAll('hiddenReviewer'), acceptedTerms: form.get('terms') === 'on',
      });
      sessionStorage.setItem('wb.reporterToken', data.token);
      navigate('/report/credentials', { state: data });
    } catch (e) { setError(errorText(e)); }
  }

  return <main className="shell"><section className="card form"><p className="eyebrow">Confidential reporting portal</p><h1>Report a concern</h1><p>Secure reporting with enriched intake and conflict-of-interest routing.</p><form onSubmit={submit}>
    <label>Organization slug<input value={organizationSlug} onChange={(e) => setOrganizationSlug(e.target.value)} required /></label>
    <label>Category<select name="category" required><option value="">Select category</option>{portal.categories.map((c: string) => <option key={c} value={c}>{c.replaceAll('_', ' ')}</option>)}</select></label>
    <label>Describe what happened<textarea name="description" minLength={10} maxLength={20000} required /></label>
    <div className="form-grid"><label>Date of incident<input name="incidentDate" type="date" /></label><label>Incident location<input name="location" maxLength={300} /></label><label>City<input name="city" maxLength={120} /></label><label>State<input name="state" maxLength={120} /></label><label>Postal code<input name="postal" maxLength={40} /></label><label>Country<input name="country" maxLength={120} /></label></div>
    <div className="form-grid"><label>Region<select name="region" defaultValue=""><option value="">Not specified</option>{portal.regions.map((r: any) => <option key={r.regionCode} value={r.regionCode}>{r.displayName}</option>)}</select></label><label>Relationship<select name="relationship" defaultValue=""><option value="">Not specified</option>{relationships.map((v) => <option key={v}>{v.replaceAll('_', ' ')}</option>)}</select></label><label>Previously reported<select name="previouslyReported" defaultValue=""><option value="">Not specified</option><option>YES</option><option>NO</option><option>UNKNOWN</option></select></label><label>Conduct duration<select name="conductDuration" defaultValue=""><option value="">Not specified</option>{durations.map((v) => <option key={v}>{v.replaceAll('_', ' ')}</option>)}</select></label><label>How did you become aware?<select name="awarenessSource" defaultValue=""><option value="">Not specified</option>{awareness.map((v) => <option key={v}>{v.replaceAll('_', ' ')}</option>)}</select></label></div>
    <label>People involved<textarea name="persons" maxLength={5000} /></label><fieldset><legend>Structured people involved</legend>{involved.map((person, index) => <div className="form-grid" key={index}><input value={person.firstName} placeholder="First name" onChange={(e) => setInvolved((rows) => rows.map((row, i) => i === index ? { ...row, firstName: e.target.value } : row))} /><input value={person.lastName} placeholder="Last name" onChange={(e) => setInvolved((rows) => rows.map((row, i) => i === index ? { ...row, lastName: e.target.value } : row))} /><input value={person.title} placeholder="Title / role" onChange={(e) => setInvolved((rows) => rows.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} /><button type="button" className="secondary" onClick={() => setInvolved((rows) => rows.filter((_, i) => i !== index))}>Remove</button></div>)}{involved.length < 20 && <button type="button" className="secondary" onClick={() => setInvolved((rows) => [...rows, { firstName: '', lastName: '', title: '' }])}>{involved.length ? 'Add another person' : 'Add a person'}</button>}</fieldset>
    <label>When did it last occur?<input name="whenLastOccurred" maxLength={300} /></label><label className="check"><input type="checkbox" checked={named} onChange={(e) => setNamed(e.target.checked)} /> I want to share my identity</label>{named && <><label>Email<input name="email" type="email" required /></label><label>Phone<input name="phone" maxLength={50} /></label><label>Preferred contact<input name="preferredContact" maxLength={300} /></label></>}
    {portal.complianceTeam.length > 0 && <fieldset><legend>Conflict-of-interest routing</legend><label className="check"><input name="coi" type="checkbox" /> Route to independent review</label>{portal.complianceTeam.filter((r: any) => r.canExclude).map((r: any) => <label className="check" key={r.id}><input name="hiddenReviewer" value={r.id} type="checkbox" /> Exclude {r.displayName}</label>)}</fieldset>}
    <label className="check"><input name="terms" type="checkbox" required /> I accept the reporting terms.</label>{error && <p className="error">{error}</p>}<button>Submit secure report</button>
  </form></section></main>;
}
