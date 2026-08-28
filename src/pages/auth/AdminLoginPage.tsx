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
import { useAdminLoginMutation, loginErrorMessage, loginRequestSchema, type LoginRequest } from '@features/auth';

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
      setSession({ user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn, refreshTokenExpiresIn: result.refreshTokenExpiresIn });
      navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
    }, onError: (error) => { toast.error(loginErrorMessage(error)); form.setFocus('password'); } });
  };
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  return <div><header className="text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-brand-accent text-white"><ShieldCheck className="h-6 w-6" /></div><h1 className="mt-3 text-2xl font-bold text-brand-accent">System administrator sign in</h1><p className="mt-1 text-sm text-slate-500">Access the Civorah platform console.</p></header><form className="mt-6" noValidate onSubmit={(event) => { void form.handleSubmit(onSubmit)(event); }}><div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" placeholder="admin@example.com" disabled={mutation.isPending} aria-invalid={emailError !== undefined} {...form.register('email')} />{emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}</div><div className="mt-4"><Label htmlFor="password">Password</Label><PasswordInput id="password" autoComplete="current-password" disabled={mutation.isPending} aria-invalid={passwordError !== undefined} {...form.register('password')} />{passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}</div><PrimaryButton type="submit" className="mt-6" disabled={mutation.isPending}>{mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : 'Sign in to system console'}</PrimaryButton></form><p className="mt-5 text-center text-xs text-slate-400"><Link className="underline hover:text-slate-600" to={ROUTES.AUTH.LOGIN}>Back to organization sign in</Link></p></div>;
}
