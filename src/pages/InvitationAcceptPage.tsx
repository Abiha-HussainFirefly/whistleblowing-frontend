import { useEffect, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { apiClient } from '@lib/axios';
import { ROUTES } from '@config/routes';
import { invitationLoginPath } from '@features/auth/invitation-routing';
import { useAuthStore } from '@store/authStore';

interface InvitationPreview { organizationName: string; organizationSlug: string; maskedEmail: string; displayName: string | null; regionCode: string | null; accountExists: boolean }

export function InvitationAcceptPage(): ReactElement {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
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

  const acceptExisting = async (): Promise<void> => {
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post('/invitations/accept-existing', { token });
      localStorage.setItem('wb.organizationSlug', preview?.organizationSlug ?? '');
      navigate(user?.platformRole === 'TENANT' ? ROUTES.ORG_ADMIN.DASHBOARD : ROUTES.DASHBOARD, { replace: true });
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'The invitation could not be accepted.');
    } finally { setSubmitting(false); }
  };

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

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
          Organization access
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-brand-primary">Accept invitation</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your invitation...</p>
      ) : preview ? (
        <>
          <p className="text-sm leading-6 text-muted-foreground">
            Join <span className="font-medium text-foreground">{preview.organizationName}</span> using {preview.maskedEmail}.
          </p>
          {preview.accountExists ? (
            <div className="space-y-4 rounded-lg border border-brand-accent/20 bg-brand-accent/5 p-4">
              <div>
                <p className="text-sm font-semibold text-brand-primary">You already have a Tellara account</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {user === null ? 'Sign in with the invited email to add this organization to your access.' : 'Continue with your signed-in account to add this organization to your access.'}
                </p>
              </div>
              {user === null ? (
                <Button asChild className="w-full">
                  <Link to={invitationLoginPath(token)}>Sign in to accept invitation</Link>
                </Button>
              ) : (
                <Button className="w-full" type="button" onClick={() => void acceptExisting()} disabled={submitting}>
                  {submitting ? 'Accepting...' : 'Accept invitation'}
                </Button>
              )}
              {error && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <Label htmlFor="invitation-name">Display name</Label>
                <Input id="invitation-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="invitation-password">Password *</Label>
                <Input id="invitation-password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="invitation-confirm">Confirm password *</Label>
                <Input id="invitation-confirm" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? 'Accepting...' : 'Create account and accept invitation'}
              </Button>
            </form>
          )}
        </>
      ) : (
        <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
