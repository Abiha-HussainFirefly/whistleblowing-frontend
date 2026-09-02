import type { ReactElement } from 'react';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ProtectedChannelArt } from '@features/whistleblowing/components/ProtectedChannelArt';

/** Short, calm transition shown after a successful interactive sign-in. */
export function PostLoginWelcome(): ReactElement {
  const { t } = useTranslation('whistleblowing');

  return (
    <div className="fixed inset-0 z-[10000] flex min-h-screen items-center justify-center bg-[hsl(32_20%_97%)] px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <ProtectedChannelArt className="max-w-[19rem] animate-fade-in" />
        <Heart
          className="mt-3 h-5 w-5 text-signal-soft"
          aria-hidden="true"
          style={{ animation: 'tellara-float 4.5s ease-in-out infinite' }}
        />
        <p className="mt-3 text-sm text-muted-foreground">
          {t('rail.courage', { defaultValue: 'Raising a concern takes courage.' })}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {t('rail.notAlone', { defaultValue: 'You are not alone.' })}
        </p>
      </div>
    </div>
  );
}
