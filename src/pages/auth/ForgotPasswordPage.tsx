import { Label } from '@components/ui/label';
import { PrimaryButton } from '@components/ui/primary-button';
import { ROUTES } from '@config/routes';
import { passwordResetErrorMessage, useForgotPasswordMutation } from '@features/auth';
import { cn } from '@lib/utils';
import { toast } from '@store/toastStore';
import { emailSchema } from '@validators/common';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';

export function ForgotPasswordPage(): ReactElement {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const mutation = useForgotPasswordMutation();

  const emailParse = emailSchema.safeParse(email);
  const emailError =
    touched && email.length > 0 && !emailParse.success
      ? (emailParse.error.issues[0]?.message ?? 'Enter a valid email address')
      : '';

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setTouched(true);
    if (!emailParse.success) {
      return;
    }
    mutation.mutate(
      { email: emailParse.data },
      {
        onSuccess(result) {
          // Always show the same confirmation regardless of whether the
          // address is registered — the backend never reveals this.
          setSuccessMessage(result.message);
          setSubmitted(true);
        },
        onError(error) {
          toast.error(passwordResetErrorMessage(error));
        },
      },
    );
  };

  if (submitted) {
    return (
      <div>
        <header className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-brand-primary">Check Your Email</h1>
          <p className="mt-2 text-sm text-slate-500">
            {successMessage.length > 0 ? successMessage : 'Please check your email for next steps.'}
          </p>
        </header>

        <p className="mt-8 text-center text-xs text-slate-400">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <button
            type="button"
            onClick={() => {
              setSuccessMessage('');
              setSubmitted(false);
            }}
            className="font-medium text-brand-primary underline hover:text-slate-600"
          >
            try a different email
          </button>
          .
        </p>

        <p className="mt-5 text-center text-sm">
          <Link
            to={ROUTES.AUTH.LOGIN}
            className="inline-flex items-center gap-1.5 font-medium text-brand-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </p>
      </div>
    );
  }

  const submitting = mutation.isPending;

  return (
    <div>
      <header className="text-center">
        <h1 className="text-2xl font-bold text-brand-accent">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your email to reset your password</p>
      </header>

      <form onSubmit={onSubmit} className="mt-8" noValidate>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              onBlur={() => {
                setTouched(true);
              }}
              disabled={submitting}
              required
              aria-invalid={emailError.length > 0}
              className={cn(
                'flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400',
                'focus:border-brand-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/25',
                emailError.length > 0 && 'border-red-400 focus:border-red-500 focus:ring-red-200',
              )}
            />
          </div>
          {emailError.length > 0 && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
        </div>

        <PrimaryButton type="submit" className="mt-6" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </PrimaryButton>
      </form>

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
