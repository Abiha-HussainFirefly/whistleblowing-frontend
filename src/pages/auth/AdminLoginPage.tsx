import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { PasswordInput } from '@components/ui/password-input';
import { PrimaryButton } from '@components/ui/primary-button';
import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';
import { markPostLoginWelcome } from '@lib/post-login-welcome';
import { useAdminLoginMutation, loginErrorMessage, loginRequestSchema, type LoginRequest } from '@features/auth';

/**
 * System console sign-in.
 *
 * Deliberately NOT linked from the landing page, the organization sign-in page,
 * or anywhere else in the client. Platform administration is an internal
 * capability; advertising its entry point tells an attacker where the
 * highest-value account lives and invites credential stuffing against it.
 * Operators reach this route by knowing the URL.
 */
export function AdminLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useAdminLoginMutation();
  const clear = useAuthStore((state) => state.clear);
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<LoginRequest>({ resolver: zodResolver(loginRequestSchema), defaultValues: { email: '', password: '' }, mode: 'onTouched' });
  const onSubmit: SubmitHandler<LoginRequest> = (values) => {
    mutation.mutate(values, { onSuccess: (result) => {
      if (result.nextStep !== 'authenticated') { toast.error('Additional authentication is required.'); return; }
      clear(); queryClient.clear();
      setSession({ user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn, refreshTokenExpiresIn: result.refreshTokenExpiresIn, permissions: result.permissions, activeOrganization: result.activeOrganization ?? null, activeRegion: result.activeRegion ?? null });
      markPostLoginWelcome();
      toast.success('System administrator sign-in successful.');
      navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
    }, onError: (error) => { toast.error(loginErrorMessage(error)); form.setFocus('password'); } });
  };
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  return <div><header><span className="inline-flex items-center gap-2 rounded-full bg-plum-tint px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-plum"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />System console</span><h1 className="type-h1 mt-4 text-foreground">System administrator sign in</h1><p className="mt-1.5 text-sm text-muted-foreground">Access the Tellara platform console.</p></header><form className="mt-6" noValidate onSubmit={(event) => { void form.handleSubmit(onSubmit)(event); }}><div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" placeholder="admin@example.com" disabled={mutation.isPending} aria-invalid={emailError !== undefined} {...form.register('email')} />{emailError && <p className="mt-1 text-xs text-destructive">{emailError}</p>}</div><div className="mt-4"><Label htmlFor="password">Password</Label><PasswordInput id="password" autoComplete="current-password" disabled={mutation.isPending} aria-invalid={passwordError !== undefined} {...form.register('password')} />{passwordError && <p className="mt-1 text-xs text-destructive">{passwordError}</p>}</div><PrimaryButton type="submit" className="mt-6" disabled={mutation.isPending}>{mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : 'Sign in to system console'}</PrimaryButton></form><p className="mt-6 border-t border-border pt-5 text-center text-xs text-muted-foreground"><Link className="font-medium text-brand-accent hover:underline" to={ROUTES.AUTH.LOGIN}>Back to organization sign in</Link></p></div>;
}
