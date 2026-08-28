import { ShieldAlert } from 'lucide-react';
import { type ReactElement, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/authStore';

export function SessionRestorationRecovery(): ReactElement {
  const { t } = useTranslation();
  const resetSessionRestoration = useAuthStore((state) => state.resetSessionRestoration);
  const ownerVersion = useRef(useAuthStore.getState().authorizationContextVersion).current;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e7f5f3_0%,#f8fafc_48%,#edf2f7_100%)] px-5 py-12">
      <section
        role="alert"
        className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-xl shadow-slate-900/10"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
          {t('sessionRestoration.title', {
            defaultValue: 'Session restoration needs attention',
          })}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t('sessionRestoration.description', {
            defaultValue:
              'We could not safely confirm whether your session was refreshed. To protect your account, we did not try again automatically.',
          })}
        </p>
        <button
          type="button"
          className="mt-7 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          onClick={() => resetSessionRestoration(ownerVersion)}
        >
          {t('sessionRestoration.signInAgain', { defaultValue: 'Sign in again' })}
        </button>
      </section>
    </main>
  );
}
