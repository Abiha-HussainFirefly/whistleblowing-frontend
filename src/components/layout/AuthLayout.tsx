import { getDirection } from '@/i18n';
import { BrandLogo } from '@components/common/BrandLogo';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { ROUTES } from '@config/routes';
import { KeyRound, Lock, Mail, Megaphone, ShieldCheck } from 'lucide-react';
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';

/**
 * Split-screen entry surface.
 *
 * Left: a Confidential Ink panel carrying the reverse lockup and the three
 * protection promises. Right: the sign-in card on a light surface.
 *
 * The protection message comes before any credential field on purpose — the
 * person arriving here may be doing so under stress, and the design must reduce
 * perceived personal risk before it asks for anything (manual §02, §09).
 */
export function AuthLayout(): ReactElement {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language).split('-')[0] ?? 'en';
  const contentDir = getDirection(current);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background [direction:ltr] lg:flex-row">
      <BrandPanel />

      <section
        className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:w-[54%] lg:px-10 xl:px-16"
        dir={contentDir}
      >
        <div className="absolute end-4 top-4 z-20">
          <LanguageSwitcher variant="compact" align="end" />
        </div>

        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-raised sm:p-8 lg:p-10">
            <Outlet />
          </div>

          <AlternateAccessRow />

          <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t('auth.privacyNote')}</span>
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * The three promises, taken from the brand platform: identity protection,
 * secure case access, confidential follow-up. Anonymity is never stated as
 * absolute — the product belief is that the reporter keeps control of what they
 * reveal, not that the system can guarantee the impossible.
 */
const PROMISES = [
  { key: 'identity', icon: ShieldCheck },
  { key: 'access', icon: Lock },
  { key: 'followUp', icon: Mail },
] as const;

function BrandPanel(): ReactElement {
  const { t } = useTranslation();

  return (
    <aside className="relative isolate flex w-full flex-col justify-between overflow-hidden bg-ink px-6 py-10 text-porcelain sm:px-10 lg:w-[46%] lg:px-14 lg:py-14">
      {/* Ambient plum/violet wash — a protected corridor, not a spotlight. */}
      <div
        aria-hidden="true"
        className="wash-ink animate-drift pointer-events-none absolute inset-0 -z-10"
      />

      <header>
        <Link to={ROUTES.ROOT} className="inline-block">
          <BrandLogo white className="h-12 w-auto sm:h-14" />
        </Link>
      </header>

      <div className="my-10 max-w-md lg:my-0">
        <h1 className="type-display text-porcelain">
          {t('auth.panel.headline')}{' '}
          <span className="text-signal-soft">{t('auth.panel.headlineAccent')}</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-porcelain/70">{t('auth.panel.lede')}</p>

        <ul className="mt-10 space-y-px">
          {PROMISES.map(({ key, icon: Icon }, index) => (
            <li
              key={key}
              className={`flex items-center gap-4 py-4 ${index > 0 ? 'border-t border-white/10' : ''}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-signal-soft">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-porcelain">
                  {t(`auth.panel.promises.${key}.title`)}
                </span>
                <span className="mt-0.5 block text-sm text-porcelain/60">
                  {t(`auth.panel.promises.${key}.body`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="text-xs text-porcelain/45">{t('auth.panel.footer')}</footer>
    </aside>
  );
}

/**
 * The doors that are NOT a staff sign-in.
 *
 * A reporter who lands here from a workplace poster must be able to leave
 * without creating an account — anonymity fails the moment we force a login.
 * The public portal is tenant-scoped by slug; where a deployment has not
 * configured one we fall back to the case-login surface rather than linking to
 * a URL that would 404 on someone already under stress.
 */
function reporterPortalPath(): string {
  const slug =
    (typeof localStorage === 'undefined' ? null : localStorage.getItem('wb.organizationSlug')) ??
    (import.meta.env.VITE_WB_ORGANIZATION_SLUG as string | undefined) ??
    '';
  return slug.length > 0 ? ROUTES.REPORT.PORTAL(slug) : ROUTES.REPORT.TRACK;
}

function AlternateAccessRow(): ReactElement {
  const { t } = useTranslation();
  const doors = [
    { key: 'raise', to: reporterPortalPath(), icon: Megaphone, chip: 'bg-signal-tint text-signal-strong' },
    { key: 'track', to: ROUTES.REPORT.TRACK, icon: KeyRound, chip: 'bg-courage-tint text-courage-strong' },
  ] as const;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/60 p-5">
      <p className="text-sm font-semibold text-foreground">{t('auth.alternate.title')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t('auth.alternate.lede')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {doors.map(({ key, to, icon: Icon, chip }) => (
          <Link
            key={key}
            to={to}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-signal/40 hover:bg-signal-tint/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${chip}`}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="mt-3 block text-sm font-semibold text-foreground">
              {t(`auth.alternate.${key}.title`)}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {t(`auth.alternate.${key}.body`)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
