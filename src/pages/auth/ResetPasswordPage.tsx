import { useState, type FormEvent, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { ROUTES } from '@config/routes';
import { Label } from '@components/ui/label';
import { PasswordInput } from '@components/ui/password-input';
import { PasswordRequirements } from '@components/ui/password-requirements';
import { PrimaryButton } from '@components/ui/primary-button';
import { passwordSchema } from '@validators/common';
import { useResetPasswordMutation, passwordResetErrorMessage } from '@features/auth';
import { cn } from '@lib/utils';
import { toast } from '@store/toastStore';

/**
 * Landed from the reset-link email: /auth/reset-password?token=...
 * The token is opaque to the client — the backend verifies on submit.
 */
export function ResetPasswordPage(): ReactElement {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const hasToken = token.length > 0;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [done, setDone] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const mutation = useResetPasswordMutation();

  const passwordParse = passwordSchema.safeParse(password);
  const passwordError =
    touched.password && password.length > 0 && !passwordParse.success
      ? (passwordParse.error.issues[0]?.message ?? 'Password does not meet the requirements')
      : '';
  const confirmError =
    touched.confirm && confirm.length > 0 && confirm !== password ? 'Passwords do not match' : '';
  const isFormValid = passwordParse.success && confirm === password;

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setTouched({ password: true, confirm: true });
    if (!isFormValid || !hasToken) {
      return;
    }
    mutation.mutate(
      { token, newPassword: passwordParse.data },
      {
        onSuccess(result) {
          toast.success('Password updated successfully.');
          setSuccessMessage(result.message);
          setDone(true);
        },
        onError(error) {
          toast.error(passwordResetErrorMessage(error));
        },
      },
    );
  };

  if (done) {
    return (
      <div>
        <header className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-moss-tint text-moss">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-brand-primary">Password Updated</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {successMessage.length > 0
              ? successMessage
              : 'Your password has been reset. Please sign in with your new password.'}
          </p>
        </header>

        <PrimaryButton
          type="button"
          className="mt-8"
          onClick={() => {
            navigate(ROUTES.AUTH.LOGIN, { replace: true });
          }}
        >
          Go to Sign In
        </PrimaryButton>
      </div>
    );
  }

  const submitting = mutation.isPending;

  return (
    <div>
      <header className="text-center">
        <h1 className="text-2xl font-bold text-brand-accent">Set New Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasToken ? 'Choose a new password for your account' : 'Reset link is missing or invalid'}
        </p>
      </header>

      {hasToken ? (
        <form onSubmit={onSubmit} className="mt-8" noValidate>
          <div>
            <Label htmlFor="password">New Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              onBlur={() => {
                setTouched((t) => ({ ...t, password: true }));
              }}
              disabled={submitting}
              aria-invalid={passwordError.length > 0}
              className={cn(
                passwordError.length > 0 &&
                  'border-destructive focus:border-destructive focus:ring-destructive',
              )}
              required
            />
            {passwordError.length > 0 && (
              <p className="mt-1 text-xs text-destructive">{passwordError}</p>
            )}
            <PasswordRequirements value={password} />
          </div>

          <div className="mt-4">
            <Label htmlFor="confirm">Confirm Password</Label>
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
              }}
              onBlur={() => {
                setTouched((t) => ({ ...t, confirm: true }));
              }}
              disabled={submitting}
              aria-invalid={confirmError.length > 0}
              className={cn(
                confirmError.length > 0 && 'border-destructive focus:border-destructive focus:ring-destructive',
              )}
              required
            />
            {confirmError.length > 0 && <p className="mt-1 text-xs text-destructive">{confirmError}</p>}
          </div>

          <PrimaryButton type="submit" className="mt-6" disabled={!isFormValid || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </PrimaryButton>
        </form>
      ) : (
        <div className="mt-8 rounded-lg border border-red-100 bg-destructive/5 p-4 text-center text-sm text-destructive">
          This reset link is missing a token. Please request a new one.
        </div>
      )}

      <p className="mt-5 text-center text-sm">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="inline-flex items-center gap-1.5 font-medium text-brand-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
