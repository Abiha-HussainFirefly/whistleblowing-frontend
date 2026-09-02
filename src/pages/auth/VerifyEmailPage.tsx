import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, Mail, RotateCw } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';
import { markPostLoginWelcome } from '@lib/post-login-welcome';
import {
  authService,
  useVerifyOtpMutation,
  useResendOtpMutation,
  verificationErrorMessage,
} from '@features/auth';
import { routeAfterVerifiedAuthentication } from '@features/auth/post-login-routing';
import {
  routeAfterInvitationAcceptance,
  routeAfterInvitationAuthentication,
} from '@features/auth/invitation-routing';
import { applyAuthenticatedContext } from '@features/auth/session-context';
import { SESSION_QUERY_KEY } from '@hooks/useSessionSync';
import type { EmailVerificationState } from '@/types/auth';
import { PrimaryButton } from '@components/ui/primary-button';
import { ServerText } from '@components/ui/server-text';
import { cn } from '@lib/utils';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailPage(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation('auth');
  const setSession = useAuthStore((s) => s.setSession);
  const setTokens = useAuthStore((s) => s.setTokens);
  const clear = useAuthStore((s) => s.clear);
  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();

  const state = location.state as EmailVerificationState | null;
  const hasState = Boolean(state?.verificationToken);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [formError, setFormError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [activeVerificationToken, setActiveVerificationToken] = useState(
    state?.verificationToken ?? '',
  );
  const [invitationSubmitting, setInvitationSubmitting] = useState(false);
  const [invitationResending, setInvitationResending] = useState(false);
  const verificationToken = activeVerificationToken;
  const invitationToken = state?.invitationToken;
  const invitationId = state?.invitationId;
  const isInvitationVerification = state?.verificationKind === 'invitation';
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer.
  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [resendCooldown]);

  // Auto-focus first input on mount.
  useEffect(() => {
    if (hasState) {
      inputRefs.current[0]?.focus();
    }
  }, [hasState]);

  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  const submitCode = useCallback(
    (code: string) => {
      if (code.length !== OTP_LENGTH || !verificationToken) {
        return;
      }
      setFormError(null);

      if (isInvitationVerification) {
        if (invitationId === undefined || invitationId === '') {
          return;
        }

        setInvitationSubmitting(true);
        void authService
          .verifyInvitationOtp(invitationId, verificationToken, code)
          .then(async (result) => {
            queryClient.clear();
            clear();
            const portal = result.persona === 'TENANT' ? 'TENANT' : 'USER';
            const context = await authService.switchContext(
              result.organizationId,
              result.region,
              result.session.refreshToken,
              portal,
              result.persona,
            );
            const payload = {
              user: context.user,
              accessToken: context.accessToken,
              expiresIn: context.expiresIn,
              ...(context.refreshToken === undefined ? {} : { refreshToken: context.refreshToken }),
              refreshTokenExpiresIn: context.refreshTokenExpiresIn,
            };
            setTokens(payload);
            queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
            const me = await authService.me();
            applyAuthenticatedContext(payload, me, {
              activeOrganization: context.activeOrganization,
              activeRegion: context.activeRegion,
            });
            navigate(routeAfterInvitationAcceptance(result.persona), { replace: true });
          })
          .catch((error: unknown) => {
            const message = verificationErrorMessage(error);
            toast.error(message);
            setFormError(message);
            setDigits(Array(OTP_LENGTH).fill(''));
            focusInput(0);
          })
          .finally(() => {
            setInvitationSubmitting(false);
          });
        return;
      }

      verifyMutation.mutate(
        { verificationToken, code },
        {
          onSuccess(result) {
            try {
              clear();
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
              toast.success('Signed in successfully.');

              navigate(
                routeAfterInvitationAuthentication(
                  invitationToken,
                  routeAfterVerifiedAuthentication(result.user),
                ),
                { replace: true },
              );
            } catch {
              clear();
              const message = t('verifyFlow.sessionLoadFailed');
              toast.error(message);
              setFormError(message);
              setDigits(Array(OTP_LENGTH).fill(''));
              focusInput(0);
            }
          },
          onError(error) {
            const message = verificationErrorMessage(error);
            toast.error(message);
            setFormError(message);
            setDigits(Array(OTP_LENGTH).fill(''));
            focusInput(0);
          },
        },
      );
    },
    [
      verificationToken,
      invitationToken,
      invitationId,
      isInvitationVerification,
      verifyMutation,
      setSession,
      setTokens,
      clear,
      queryClient,
      navigate,
      focusInput,
      t,
    ],
  );

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) {
        return;
      }

      setDigits((prev) => {
        const next = [...prev];
        next[index] = value;

        if (value.length === 1 && index < OTP_LENGTH - 1) {
          focusInput(index + 1);
        }

        const code = next.join('');
        if (code.length === OTP_LENGTH && next.every((d) => d.length === 1)) {
          setTimeout(() => {
            submitCode(code);
          }, 0);
        }

        return next;
      });
    },
    [focusInput, submitCode],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && digits[index] === '' && index > 0) {
        focusInput(index - 1);
      }
    },
    [digits, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
      if (pasted.length === 0) {
        return;
      }

      const next = Array(OTP_LENGTH).fill('') as string[];
      for (let i = 0; i < pasted.length; i++) {
        next[i] = pasted[i] ?? '';
      }
      setDigits(next);

      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      focusInput(focusIdx);

      if (pasted.length === OTP_LENGTH) {
        setTimeout(() => {
          submitCode(pasted);
        }, 0);
      }
    },
    [focusInput, submitCode],
  );

  const handleResend = useCallback(() => {
    if (!verificationToken) {
      return;
    }
    setFormError(null);

    if (isInvitationVerification) {
      if (invitationId === undefined || invitationId === '') {
        return;
      }

      setInvitationResending(true);
      void authService
        .resendInvitationVerification(invitationId)
        .then((result) => {
          setActiveVerificationToken(result.verificationToken);
          toast.success(t('verifyFlow.resendSuccess'));
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
          setDigits(Array(OTP_LENGTH).fill(''));
          focusInput(0);
        })
        .catch((error: unknown) => {
          const message = verificationErrorMessage(error);
          toast.error(message);
          setFormError(message);
        })
        .finally(() => {
          setInvitationResending(false);
        });
      return;
    }

    resendMutation.mutate(
      { verificationToken },
      {
        onSuccess(result) {
          toast.success(result.message);
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
          setDigits(Array(OTP_LENGTH).fill(''));
          focusInput(0);
        },
        onError(error) {
          const message = verificationErrorMessage(error);
          toast.error(message);
          setFormError(message);
        },
      },
    );
  }, [verificationToken, invitationId, isInvitationVerification, resendMutation, focusInput, t]);

  const handleManualSubmit = useCallback(() => {
    const code = digits.join('');
    if (code.length === OTP_LENGTH) {
      submitCode(code);
    }
  }, [digits, submitCode]);

  // Redirect to login if no verification state is present (all hooks above).
  if (
    !hasState ||
    !state ||
    (isInvitationVerification && (invitationId === undefined || invitationId === ''))
  ) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  const submitting = verifyMutation.isPending || invitationSubmitting;
  const resending = resendMutation.isPending || invitationResending;
  const canResend = resendCooldown <= 0 && !resending;
  const allFilled = digits.every((d) => d.length === 1);

  return (
    <div>
      <header className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/5 text-brand-accent">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-brand-accent">{t('verify.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('verifyFlow.codeSentTo')}{' '}
          <span className="font-medium text-foreground">
            <ServerText>{state.maskedEmail}</ServerText>
          </span>
        </p>
      </header>

      <div className="mt-8">
        <label className="block text-center text-sm font-medium text-muted-foreground">
          {t('verify.codeLabel')}
        </label>

        <div
          className="mt-3 flex justify-center gap-2.5"
          role="group"
          aria-label={t('verifyFlow.codeGroupLabel')}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete="one-time-code"
              disabled={submitting}
              value={digit}
              aria-label={t('verifyFlow.digitLabel', { number: index + 1 })}
              onChange={(e) => {
                handleDigitChange(index, e.target.value);
              }}
              onKeyDown={(e) => {
                handleKeyDown(index, e);
              }}
              onPaste={index === 0 ? handlePaste : undefined}
              className={cn(
                'h-12 w-11 rounded-lg border text-center text-xl font-semibold text-brand-accent outline-none transition-all',
                'border-border bg-white focus:border-signal focus:ring-2 focus:ring-ring',
                submitting && 'cursor-not-allowed opacity-60',
                formError !== null && digit === '' && 'border-red-300',
              )}
            />
          ))}
        </div>

        <PrimaryButton
          type="button"
          className="mt-6"
          disabled={!allFilled || submitting}
          onClick={handleManualSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('verifyFlow.verifying')}
            </>
          ) : (
            t('verify.submit')
          )}
        </PrimaryButton>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">{t('verifyFlow.didNotReceive')}</p>
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCw className="h-3.5 w-3.5" />
            {t('verify.resend')}
          </button>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground/70">
            {t('verifyFlow.resendAvailableIn', {
              time: `${String(Math.floor(resendCooldown / 60))}:${String(resendCooldown % 60).padStart(2, '0')}`,
            })}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground/70">
        <Link to={ROUTES.AUTH.LOGIN} className="underline hover:text-foreground">
          {t('verifyFlow.backToSignIn')}
        </Link>
      </p>
    </div>
  );
}
