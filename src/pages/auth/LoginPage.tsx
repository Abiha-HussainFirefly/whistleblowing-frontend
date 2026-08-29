import { type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';
import { useLoginMutation, loginErrorMessage, loginRequestSchema } from '@features/auth';
import { setPortalIntent } from '@features/auth/portal-access';
import { routeAfterTenantAuthentication } from '@features/auth/post-login-routing';
import { routeAfterInvitationAuthentication } from '@features/auth/invitation-routing';
import type { LoginRequest } from '@features/auth';
import type { EmailVerificationState } from '@/types/auth';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { PasswordInput } from '@components/ui/password-input';
import { PrimaryButton } from '@components/ui/primary-button';
import { cn } from '@lib/utils';
import { toast } from '@store/toastStore';

export function LoginPage(): ReactElement {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const mutation = useLoginMutation();
  const invitationToken = searchParams.get('invite');
  const hasInvitationToken = invitationToken !== null && invitationToken.length > 0;

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
    // Validate on blur (then live on change) so an invalid email format is
    // surfaced before the user submits the form.
    mode: 'onTouched',
  });

  const onSubmit: SubmitHandler<LoginRequest> = (values) => {
    setPortalIntent('USER');
    mutation.mutate(values, {
      onSuccess(result) {
        if (result.nextStep === 'email_verification_required') {
          const verificationState: EmailVerificationState = {
            verificationToken: result.verificationToken,
            verificationExpiresIn: result.verificationExpiresIn,
            maskedEmail: result.maskedEmail,
            ...(hasInvitationToken ? { invitationToken } : {}),
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
              ...(hasInvitationToken ? { invitationToken } : {}),
            },
            replace: true,
          });
          return;
        }

        // New session = new identity. Clear any residual store state and
        // cached /auth/me from a prior session before seeding this one, so
        // a previous login can never contaminate the USER portal.
        clear();
        queryClient.clear();

        setSession({
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          ...(result.refreshToken === undefined ? {} : { refreshToken: result.refreshToken }),
          refreshTokenExpiresIn: result.refreshTokenExpiresIn,
        });

        navigate(
          routeAfterInvitationAuthentication(invitationToken, routeAfterTenantAuthentication()),
          { replace: true },
        );
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
        <h1 className="type-h1 text-foreground">{t('login.title')}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('login.subtitle')}</p>
      </header>

      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        className="mt-6"
        noValidate
      >
        <div>
          <Label htmlFor="email">{t('login.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('login.emailPlaceholder')}
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
          <Label htmlFor="password">{t('login.passwordLabel')}</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
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

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            to={ROUTES.AUTH.FORGOT_PASSWORD}
            className="inline-flex min-h-11 items-center font-medium text-brand-accent hover:underline"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>

        <PrimaryButton type="submit" className="mt-6" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('login.submitting')}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden="true" />
              {t('login.submit')}
            </>
          )}
        </PrimaryButton>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center text-xs text-muted-foreground">
        <p>
          Organization admin?{' '}
          <Link
            to={ROUTES.AUTH.ORG_LOGIN}
            className="inline-flex min-h-11 items-center font-medium text-brand-accent hover:underline"
          >
            Sign in to the organization portal
          </Link>
        </p>
        <p className="mt-1.5">
          System administrator?{' '}
          <Link
            to={ROUTES.AUTH.ADMIN_LOGIN}
            className="inline-flex min-h-11 items-center font-medium text-brand-accent hover:underline"
          >
            Sign in to the system console
          </Link>
        </p>
      </div>
    </div>
  );
}
