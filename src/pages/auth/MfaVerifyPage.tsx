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
import { ArrowLeft, Key, Loader2, Shield } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';
import { markPostLoginWelcome } from '@lib/post-login-welcome';
import { loginResponseSchema } from '@features/auth/schemas/login.schema';
import { mfaService } from '@features/auth/api/mfa.service';
import { routeAfterVerifiedAuthentication } from '@features/auth/post-login-routing';
import { normalizeRecoveryCodeInput } from '@features/auth/utils/recovery-code';
import { PrimaryButton } from '@components/ui/primary-button';
import { Input } from '@components/ui/input';
import { extractApiErrorMessage } from '@lib/api-error';
import { setAccessToken } from '@lib/auth-token';
import { cn } from '@lib/utils';

const CODE_LENGTH = 6;

interface MfaChallengeState {
  challengeToken: string;
  challengeExpiresIn: number;
  loginPath?: string;
}

export function MfaVerifyPage(): ReactElement {
  const { t } = useTranslation('auth');
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);
  const state = location.state as MfaChallengeState | null;
  const hasState = Boolean(state?.challengeToken);

  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [recoveryCode, setRecoveryCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(state?.challengeExpiresIn ?? 0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (hasState && mode === 'totp') inputRefs.current[0]?.focus();
  }, [hasState, mode]);

  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  const handleVerifyResponse = useCallback(
    (data: unknown) => {
      try {
        const result = loginResponseSchema.parse(data);
        if (result.nextStep !== 'authenticated') {
          throw new Error('MFA verification did not return a session.');
        }

        clear();
        queryClient.clear();
        setAccessToken(result.accessToken, result.expiresIn);
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

        navigate(routeAfterVerifiedAuthentication(result.user), { replace: true });
      } catch {
        clear();
        const message = t('mfa.errors.unexpectedResponse');
        toast.error(message);
        setFormError(message);
      }
    },
    [clear, navigate, queryClient, setSession, state?.loginPath, t],
  );

  const submitTotp = useCallback(
    async (code: string) => {
      const token = state?.challengeToken;
      if (code.length !== CODE_LENGTH || token === undefined || token === '') return;
      setFormError(null);
      setSubmitting(true);
      try {
        handleVerifyResponse(await mfaService.verify(token, code));
      } catch (error: unknown) {
        const message = extractErrorMessage(error, t);
        toast.error(message);
        setFormError(message);
        setDigits(Array(CODE_LENGTH).fill(''));
        focusInput(0);
      } finally {
        setSubmitting(false);
      }
    },
    [focusInput, handleVerifyResponse, state?.challengeToken, t],
  );

  const submitRecovery = useCallback(async () => {
    const token = state?.challengeToken;
    const trimmed = recoveryCode.trim();
    if (trimmed === '' || token === undefined || token === '') return;
    setFormError(null);
    setSubmitting(true);
    try {
      handleVerifyResponse(await mfaService.verifyRecovery(token, trimmed));
    } catch (error: unknown) {
      const message = extractErrorMessage(error, t);
      toast.error(message);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }, [handleVerifyResponse, recoveryCode, state?.challengeToken, t]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      setDigits((previous) => {
        const next = [...previous];
        next[index] = value;
        if (value !== '' && index < CODE_LENGTH - 1) focusInput(index + 1);
        const code = next.join('');
        if (code.length === CODE_LENGTH && next.every((digit) => digit.length === 1)) {
          setTimeout(() => void submitTotp(code), 0);
        }
        return next;
      });
    },
    [focusInput, submitTotp],
  );

  const handleKeyDown = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && digits[index] === '' && index > 0) focusInput(index - 1);
    },
    [digits, focusInput],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
      if (pasted === '') return;
      const next = Array(CODE_LENGTH).fill('') as string[];
      for (let index = 0; index < pasted.length; index += 1) next[index] = pasted[index] ?? '';
      setDigits(next);
      focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
      if (pasted.length === CODE_LENGTH) setTimeout(() => void submitTotp(pasted), 0);
    },
    [focusInput, submitTotp],
  );

  const handleManualTotpSubmit = useCallback(() => {
    const code = digits.join('');
    if (code.length === CODE_LENGTH) void submitTotp(code);
  }, [digits, submitTotp]);

  if (!hasState || !state) return <Navigate to={ROUTES.AUTH.ORG_LOGIN} replace />;

  const expired = secondsLeft <= 0;
  const allFilled = digits.every((digit) => digit.length === 1);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const signInPath = state.loginPath ?? ROUTES.AUTH.ORG_LOGIN;

  return (
    <div>
      <header className="text-center">
        <div className="auth-portal-icon">
          <Shield className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-brand-accent">{t('mfa.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'totp' ? t('mfa.subtitle') : t('mfa.recoverySubtitle')}
        </p>
      </header>

      {!expired && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t('mfa.challengeExpiresIn')}{' '}
          <span className="font-medium tabular-nums text-foreground">
            {minutes}:{String(seconds).padStart(2, '0')}
          </span>
        </p>
      )}

      {expired && (
        <div role="alert" className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t('mfa.challengeExpired')}{' '}
          <Link to={signInPath} className="font-medium underline">
            {t('mfa.signInAgain')}
          </Link>
          .
        </div>
      )}

      {!expired && mode === 'totp' && (
        <div className="mt-8">
          <label className="block text-center text-sm font-medium text-foreground">
            {t('mfa.codeLabel')}
          </label>
          <div className="mt-3 flex justify-center gap-2.5" role="group" aria-label={t('mfa.codeGroupLabel')}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                autoComplete="one-time-code"
                disabled={submitting}
                value={digit}
                aria-label={t('verifyFlow.digitLabel', { number: index + 1 })}
                onChange={(event) => handleDigitChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={cn(
                  'h-12 w-11 rounded-lg border bg-white text-center text-xl font-semibold text-brand-accent outline-none transition-all',
                  'border-border focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20',
                  submitting && 'cursor-not-allowed opacity-60',
                  formError !== null && digit === '' && 'border-red-300',
                )}
              />
            ))}
          </div>
          {formError !== null && <p role="alert" className="mt-4 text-center text-sm text-destructive">{formError}</p>}
          <PrimaryButton type="button" className="mt-6" disabled={!allFilled || submitting} onClick={handleManualTotpSubmit}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{t('mfa.verifying')}</> : t('mfa.submit')}
          </PrimaryButton>
        </div>
      )}

      {!expired && mode === 'recovery' && (
        <div className="mt-8">
          <label htmlFor="recovery-code" className="block text-center text-sm font-medium text-foreground">
            {t('mfa.recoveryCodeLabel')}
          </label>
          <Input
            id="recovery-code"
            type="text"
            placeholder={t('mfa.recoveryCodePlaceholder')}
            autoComplete="off"
            autoCapitalize="none"
            inputMode="text"
            maxLength={9}
            disabled={submitting}
            value={recoveryCode}
            onChange={(event) => setRecoveryCode(normalizeRecoveryCodeInput(event.target.value))}
            className="mt-3 text-center font-mono tracking-wider"
          />
          {formError !== null && <p role="alert" className="mt-4 text-center text-sm text-destructive">{formError}</p>}
          <PrimaryButton type="button" className="mt-6" disabled={!recoveryCode.trim() || submitting} onClick={() => void submitRecovery()}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{t('mfa.verifying')}</> : t('mfa.verifyRecoveryCode')}
          </PrimaryButton>
        </div>
      )}

      {!expired && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'totp' ? 'recovery' : 'totp');
              setFormError(null);
              setDigits(Array(CODE_LENGTH).fill(''));
              setRecoveryCode('');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline"
          >
            <Key className="h-3.5 w-3.5" />
            {mode === 'totp' ? t('mfa.useRecovery') : t('mfa.useAuthenticator')}
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to={signInPath} className="inline-flex items-center gap-1 underline hover:text-foreground">
          <ArrowLeft className="h-3 w-3" />
          {t('mfa.backToSignIn')}
        </Link>
      </p>
    </div>
  );
}

function extractErrorMessage(error: unknown, t: (key: string) => string): string {
  const response = error !== null && typeof error === 'object' && 'response' in error
    ? (error as { response?: { data?: unknown } }).response?.data
    : undefined;
  const serverMessage = extractApiErrorMessage(response);
  if (serverMessage !== null) return serverMessage;

  if (error !== null && typeof error === 'object' && 'response' in error) {
    const responseData = (error as { response?: { status?: number; data?: { message?: string } } }).response;
    const status = responseData?.status;
    const message = responseData?.data?.message;
    if (status === 401) return message ?? t('mfa.errors.invalidCode');
    if (status === 400) return message ?? t('mfa.errors.invalidRequest');
    if (status === 429) return t('mfa.errors.tooManyAttempts');
    if (typeof status === 'number' && status >= 500) return t('mfa.errors.serverUnavailable');
    if (message !== undefined && message !== '') return message;
  }
  return t('mfa.errors.verificationFailed');
}
