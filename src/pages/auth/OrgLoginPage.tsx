import { type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';
import { useOrgLoginMutation, loginErrorMessage, loginRequestSchema } from '@features/auth';
import { setPortalIntent } from '@features/auth/portal-access';
import { routeAfterOrganizationAdminAuthentication } from '@features/auth/post-login-routing';
import type { LoginRequest } from '@features/auth';
import type { EmailVerificationState } from '@/types/auth';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { PasswordInput } from '@components/ui/password-input';
import { PrimaryButton } from '@components/ui/primary-button';
import { cn } from '@lib/utils';
import { toast } from '@store/toastStore';
import { markPostLoginWelcome } from '@lib/post-login-welcome';

export function OrgLoginPage(): ReactElement {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const mutation = useOrgLoginMutation();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
    // Validate on blur (then live on change) so an invalid email format is
    // surfaced before the user submits the form.
    mode: 'onTouched',
  });

  const onSubmit: SubmitHandler<LoginRequest> = (values) => {
    setPortalIntent('TENANT');
    mutation.mutate(values, {
      onSuccess(result) {
        if (result.nextStep === 'email_verification_required') {
          const verificationState: EmailVerificationState = {
            verificationToken: result.verificationToken,
            verificationExpiresIn: result.verificationExpiresIn,
            maskedEmail: result.maskedEmail,
          };
          navigate(ROUTES.AUTH.VERIFY_EMAIL, {
            state: verificationState,
            replace: true,
          });
          return;
        }

        if (result.nextStep === 'mfa_required') {
          navigate(ROUTES.AUTH.MFA_VERIFY, {
            state: {
              challengeToken: result.challengeToken,
              challengeExpiresIn: result.challengeExpiresIn,
              loginPath: ROUTES.AUTH.ORG_LOGIN,
            },
            replace: true,
          });
          return;
        }

        // Establishing a new session means a new identity. Wipe any residual
        // state from a prior session, then route through organization context so
        // multi-organization admins choose the intended tenant before the
        // dashboard mounts.
        clear();
        queryClient.clear();

        setSession({
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          ...(result.refreshToken === undefined ? {} : { refreshToken: result.refreshToken }),
          refreshTokenExpiresIn: result.refreshTokenExpiresIn,
          permissions: result.permissions,
          activeOrganization: result.activeOrganization ?? null,
          activeRegion: result.activeRegion ?? null,
        });
        markPostLoginWelcome();

        toast.success('Organization administrator sign-in successful.');

        navigate(routeAfterOrganizationAdminAuthentication(), { replace: true });
      },
      onError(error) {
        toast.error(loginErrorMessage(error));
        form.setFocus('password');
      },
    });
  };

  const submitting = mutation.isPending;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;

  return (
    <div>
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-plum-tint px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-plum">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          Organization portal
        </span>
        <h1 className="type-h1 mt-4 text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your organization&apos;s Tellara workspace.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        className="mt-6"
        noValidate
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@yourcompany.com"
            required
            disabled={submitting}
            aria-invalid={emailError !== undefined}
            className={cn(
              emailError !== undefined && 'border-destructive focus:border-destructive focus:ring-destructive',
            )}
            {...form.register('email')}
          />
          {emailError !== undefined && <p className="mt-1 text-xs text-destructive">{emailError}</p>}
        </div>

        <div className="mt-4">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password here"
            required
            disabled={submitting}
            aria-invalid={passwordError !== undefined}
            className={cn(
              passwordError !== undefined &&
                'border-destructive focus:border-destructive focus:ring-destructive',
            )}
            {...form.register('password')}
          />
          {/* Login is not a password-creation flow: surface a single format
              error at a time (driven by loginPasswordSchema) rather than a
              full requirements checklist. */}
          {passwordError !== undefined && (
            <p className="mt-1 text-xs text-destructive">{passwordError}</p>
          )}
        </div>

        <div className="mt-4 flex justify-end text-sm">
          <Link
            to={ROUTES.AUTH.FORGOT_PASSWORD}
            className="inline-flex min-h-11 items-center font-medium text-brand-accent hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <PrimaryButton type="submit" className="mt-6" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground/70">
        {t('roleSwitch.notOrganizationAdmin')}{' '}
        <Link to={ROUTES.AUTH.LOGIN} className="underline hover:text-foreground">
          {t('roleSwitch.userSignIn')}
        </Link>
      </p>
    </div>
  );
}
