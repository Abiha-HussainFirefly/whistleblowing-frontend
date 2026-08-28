import { getDirection } from '@/i18n';
import { BrandLogo } from '@components/common/BrandLogo';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

export function AuthLayout(): ReactElement {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language).split('-')[0] ?? 'en';
  const contentDir = getDirection(current);

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-white [direction:ltr] md:bg-[linear-gradient(90deg,#ffffff_0%,#ffffff_50%,#042248_50%,#007d89_100%)]">
      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher variant="compact" align="end" />
      </div>
      <BrandPanel />

      <section
        className="relative z-10 flex w-full items-center justify-center px-4 py-10 md:w-1/2 md:px-8 lg:px-16"
        dir={contentDir}
      >
        <div className="w-full max-w-md rounded-2xl border border-white bg-white p-8 text-slate-900 shadow-[0_28px_80px_-24px_rgba(0,125,137,0.45)] md:p-10">
          <Outlet />
        </div>
      </section>
    </div>
  );
}

function BrandPanel(): ReactElement {
  const { t } = useTranslation();
  const featureKeys = ['contracts', 'matters', 'compliance', 'aiSearch'] as const;

  return (
    <aside className="relative z-10 hidden bg-white p-10 text-brand-accent md:flex md:w-1/2 md:flex-col md:justify-between lg:p-14">
      <header className="relative z-10">
        <BrandLogo className="h-14 w-auto" />
      </header>

      <div className="relative z-10 max-w-md">
        <h1 className="text-3xl font-semibold leading-tight text-[#007d89] lg:text-4xl">
          {t('auth.brand.title')}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[#007d89]">{t('auth.brand.subtitle')}</p>

        <ul className="mt-8 flex flex-wrap gap-3">
          {featureKeys.map((key) => (
            <li
              key={key}
              className="rounded-full border border-[#007d89]/25 bg-[#007d89]/5 px-4 py-1.5 text-sm text-[#007d89]"
            >
              {t(`auth.brand.features.${key}`)}
            </li>
          ))}
        </ul>
      </div>

      <footer className="relative z-10 text-xs text-[#007d89]">
        {t('auth.brand.copyright', { year: new Date().getFullYear() })}
      </footer>
    </aside>
  );
}
