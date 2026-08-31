import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ROUTES } from './config/routes';
import { getAccessToken } from '@lib/auth-token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1' });
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const errorText = (e: unknown) => axios.isAxiosError(e) ? String(e.response?.data?.message ?? 'Request failed.') : 'Request failed.';
const categories = ['FRAUD','BRIBERY_CORRUPTION','HARASSMENT','CONFLICT_OF_INTEREST','DATA_PRIVACY','HEALTH_SAFETY','DISCRIMINATION','RETALIATION','OTHER_MISCONDUCT','ACCOUNTING_AUDITING','COMPENSATION_BENEFITS','SGBP_COMPLIANCE','CONFIDENTIAL_INFORMATION','DISCLOSURE_COMMUNICATIONS','DIVERSITY_EQUITY_INCLUSION','DUE_DILIGENCE','ENVIRONMENTAL','FAIR_COMPETITION','GLOBAL_TRADE','HUMAN_RIGHTS','IMMINENT_THREAT','INSIDER_TRADING','INTELLECTUAL_PROPERTY','ASSET_MISUSE','POLITICAL_ACTIVITY','PRODUCT_QUALITY_SAFETY','SUBSTANCE_ABUSE','IT_ELECTRONIC_COMMS','WORKPLACE_CIVILITY','OTHER_BUSINESS_INTEGRITY','OTHER_HUMAN_RESOURCES','INQUIRY'];
const relationships = ['EMPLOYEE','FORMER_EMPLOYEE','CONTRACTOR','VENDOR_SUPPLIER','CUSTOMER','BUSINESS_PARTNER','OTHER_RELATIONSHIP'];
const peopleBlank = { firstName: '', lastName: '', title: '' };

export function ManualIntakePage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [people, setPeople] = useState<{ firstName: string; lastName: string; title: string }[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.post('/whistleblowing/cases/manual', {
        category: form.get('category'), priority: form.get('priority'), caseType: form.get('caseType'), intakeMethod: form.get('intakeMethod'),
        incidentDescription: String(form.get('description') ?? '').trim(), incidentDate: form.get('incidentDate') || undefined,
        incidentLocation: form.get('location') || undefined, regionCode: form.get('regionCode') || undefined,
        personsInvolved: form.get('persons') || undefined, relationshipToOrg: form.get('relationship') || undefined,
        locationCity: form.get('city') || undefined, locationState: form.get('state') || undefined, locationPostalCode: form.get('postal') || undefined, locationCountry: form.get('country') || undefined,
        involvedPersons: people.filter((p) => p.firstName.trim() || p.lastName.trim() || p.title.trim()), previouslyReported: form.get('previouslyReported') || undefined,
        whenLastOccurred: form.get('whenLastOccurred') || undefined, conductDuration: form.get('conductDuration') || undefined, awarenessSource: form.get('awarenessSource') || undefined,
        intakeChannel: form.get('channel') || undefined, isAnonymous: form.get('anonymous') === 'on', reporterEmail: form.get('email') || undefined, reporterPhone: form.get('phone') || undefined,
      });
      navigate(ROUTES.WHISTLEBLOWING_REGISTER);
    } catch (e) { setError(errorText(e)); }
  }

  return <main className="shell"><section className="card form"><p className="eyebrow">Compliance administration</p><h1>Manual intake</h1><p>Record an off-portal report received by hotline, email, phone, mail or in person.</p><form onSubmit={submit}>
    <div className="form-grid"><label>Category<select name="category" defaultValue="FRAUD" required>{categories.map((v) => <option key={v}>{v}</option>)}</select></label><label>Priority<select name="priority" defaultValue="PRIORITY_MEDIUM"><option>PRIORITY_LOW</option><option>PRIORITY_MEDIUM</option><option>PRIORITY_HIGH</option><option>PRIORITY_CRITICAL</option></select></label><label>Case type<select name="caseType" defaultValue="ALLEGATION"><option>ALLEGATION</option><option>INQUIRY</option></select></label><label>Intake method<select name="intakeMethod" defaultValue="PHONE"><option>EMAIL</option><option>PHONE</option><option>IN_PERSON</option><option>MAIL</option><option>OTHER_INTAKE</option></select></label></div>
    <label>Incident description<textarea name="description" minLength={10} maxLength={20000} required /></label>
    <div className="form-grid"><label>Date<input type="date" name="incidentDate" /></label><label>Location<input name="location" maxLength={300} /></label><label>Region code<input name="regionCode" maxLength={10} /></label><label>Channel reference<input name="channel" maxLength={100} /></label><label>City<input name="city" maxLength={120} /></label><label>State<input name="state" maxLength={120} /></label><label>Postal code<input name="postal" maxLength={40} /></label><label>Country<input name="country" maxLength={120} /></label></div>
    <div className="form-grid"><label>Relationship<select name="relationship" defaultValue=""><option value="">Not specified</option>{relationships.map((v) => <option key={v}>{v}</option>)}</select></label><label>Previously reported<select name="previouslyReported" defaultValue=""><option value="">Not specified</option><option>YES</option><option>NO</option><option>UNKNOWN</option></select></label><label>Conduct duration<select name="conductDuration" defaultValue=""><option value="">Not specified</option><option>ONE_TIME</option><option>LESS_THAN_MONTH</option><option>ONE_TO_THREE_MONTHS</option><option>THREE_TO_SIX_MONTHS</option><option>SIX_TO_TWELVE_MONTHS</option><option>OVER_A_YEAR</option><option>ONGOING</option><option>UNKNOWN_DURATION</option></select></label><label>Awareness source<select name="awarenessSource" defaultValue=""><option value="">Not specified</option><option>WITNESSED</option><option>TOLD_BY_SOMEONE</option><option>REVIEWED_DOCUMENTS</option><option>RUMOR</option><option>INVOLVED</option><option>OTHER_SOURCE</option></select></label></div>
    <label>People involved<textarea name="persons" maxLength={5000} /></label><fieldset><legend>Structured people involved</legend>{people.map((person, index) => <div className="form-grid" key={index}><input value={person.firstName} placeholder="First name" onChange={(e) => setPeople((rows) => rows.map((row, i) => i === index ? { ...row, firstName: e.target.value } : row))} /><input value={person.lastName} placeholder="Last name" onChange={(e) => setPeople((rows) => rows.map((row, i) => i === index ? { ...row, lastName: e.target.value } : row))} /><input value={person.title} placeholder="Title / role" onChange={(e) => setPeople((rows) => rows.map((row, i) => i === index ? { ...row, title: e.target.value } : row))} /><button type="button" className="secondary" onClick={() => setPeople((rows) => rows.filter((_, i) => i !== index))}>Remove</button></div>)}{people.length < 20 && <button type="button" className="secondary" onClick={() => setPeople((rows) => [...rows, peopleBlank])}>Add person</button>}</fieldset>
    <div className="form-grid"><label>Last occurrence<input name="whenLastOccurred" maxLength={300} /></label><label>Email (if named)<input name="email" type="email" /></label><label>Phone<input name="phone" maxLength={50} /></label></div><label className="check"><input type="checkbox" name="anonymous" defaultChecked /> Anonymous report</label>{error && <p className="error">{error}</p>}<button>Create case</button>
  </form></section></main>;
}
