import { FormEvent, useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@lib/axios';
import { getApiErrorMessage } from '@lib/api-error';
import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';
import { PasswordInput } from '@components/ui/password-input';

export function SignupPage(): ReactElement {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get('password') !== form.get('confirmPassword')) { setError('Passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      const { data } = await apiClient.post<any>('/auth/bootstrap', { organizationName: form.get('organizationName'), organizationSlug: form.get('organizationSlug'), displayName: form.get('displayName'), email: form.get('email'), password: form.get('password') });
      localStorage.setItem('wb.internalToken', data.token); localStorage.setItem('wb.permissions', JSON.stringify(data.permissions)); localStorage.setItem('wb.organizationId', data.organization.id); localStorage.setItem('wb.organizationSlug', data.organization.slug); localStorage.setItem('wb.organizationName', data.organization.name); localStorage.setItem('wb.userDisplayName', data.user.displayName ?? ''); localStorage.setItem('wb.userEmail', data.user.email);
      useAuthStore.getState().setSession({ user: { ...data.user, platformRole: 'USER', kind: 'STANDARD', status: 'ACTIVE', persona: 'INTERNAL', mfaEnabled: false, emailVerifiedAt: null, lastLoginAt: null }, accessToken: data.token, expiresIn: 28800, refreshTokenExpiresIn: 28800 });
      navigate(ROUTES.WHISTLEBLOWING, { replace: true });
    } catch (reason) { setError(getApiErrorMessage(reason, 'Unable to create organization.')); } finally { setBusy(false); }
  };
  return <div><header className="text-center"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Start securely</span><h1 className="mt-1 text-2xl font-bold text-brand-accent">Create your Civorah organization</h1><p className="mt-1 text-sm text-slate-500">Set up the organization owner account.</p></header><form onSubmit={submit} className="mt-6 space-y-4" noValidate>{[['organizationName','Organization name','Acme Corporation'],['organizationSlug','Organization slug','acme-corporation'],['displayName','Your name','Jane Doe'],['email','Email','you@company.com']].map(([name,label,placeholder]) => <label key={name} className="block text-sm font-medium text-slate-700">{label}<input name={name} type={name === 'email' ? 'email' : 'text'} placeholder={placeholder} required minLength={2} className="mt-1 flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-accent focus:bg-white focus:ring-2 focus:ring-brand-accent/25" /></label>)}<label className="block text-sm font-medium text-slate-700">Password<PasswordInput name="password" required minLength={12} className="mt-1" /></label><label className="block text-sm font-medium text-slate-700">Confirm password<PasswordInput name="confirmPassword" required className="mt-1" /></label>{error && <p className="text-sm text-red-600">{error}</p>}<button className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-accent px-4 text-sm font-medium text-white hover:bg-brand-accent/90" disabled={busy}>{busy ? 'Creating organization…' : 'Create organization'}</button></form><p className="mt-5 text-center text-sm text-slate-500">Already have an account? <Link className="font-medium text-brand-accent hover:underline" to={ROUTES.AUTH.LOGIN}>Sign in</Link></p></div>;
}
