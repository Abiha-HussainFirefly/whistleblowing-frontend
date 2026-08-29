import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { apiClient } from '@lib/axios';
import { ROUTES } from '@config/routes';

interface InvitationPreview { organizationName: string; organizationSlug: string; maskedEmail: string; displayName: string | null; regionCode: string | null }

export function InvitationAcceptPage(): ReactElement {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setError('This invitation link is missing a valid token.'); setLoading(false); return; }
    apiClient.post<InvitationPreview>('/invitations/preview', { token }).then(({ data }) => { setPreview(data); setDisplayName(data.displayName ?? ''); }).catch(() => setError('This invitation may be expired, invalid, or already accepted.')).finally(() => setLoading(false));
  }, [token]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true); setError('');
    try {
      await apiClient.post('/invitations/accept', { token, password, ...(displayName.trim() ? { displayName: displayName.trim() } : {}) });
      localStorage.setItem('wb.organizationSlug', preview?.organizationSlug ?? '');
      navigate(`${ROUTES.AUTH.LOGIN}?organization=${encodeURIComponent(preview?.organizationSlug ?? '')}`, { replace: true });
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'The invitation could not be accepted.');
    } finally { setSubmitting(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10"><section className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-sm"><h1 className="text-2xl font-semibold text-brand-primary">Accept Invitation</h1>{loading ? <p className="mt-3 text-sm text-muted-foreground">Loading your invitation...</p> : preview ? <><p className="mt-2 text-sm text-muted-foreground">Join {preview.organizationName} using {preview.maskedEmail}.</p><form className="mt-6 space-y-4" onSubmit={submit}><div><Label htmlFor="invitation-name">Display Name</Label><Input id="invitation-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" /></div><div><Label htmlFor="invitation-password">Password *</Label><Input id="invitation-password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div><div><Label htmlFor="invitation-confirm">Confirm Password *</Label><Input id="invitation-confirm" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>{error && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}<Button className="w-full" type="submit" disabled={submitting}>{submitting ? 'Accepting...' : 'Create Account and Accept Invitation'}</Button></form></> : <p role="alert" className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}</section></main>;
}
