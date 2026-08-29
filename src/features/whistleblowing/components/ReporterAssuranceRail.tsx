import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ExternalLink,
  Heart,
  Lock,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { AssuranceItem } from '@components/ui/callout';
import { cn } from '@lib/utils';
import { ProtectedChannelArt } from './ProtectedChannelArt';

/**
 * Reassurance rail shown beside the intake form.
 *
 * Rule 01 of the UI/UX principles: reduce fear before asking for information —
 * explain what protection means, and what the system does not collect, BEFORE
 * the first form field (manual §09).
 *
 * Responsive behaviour is the interesting part. On a wide screen this is a
 * sticky column the reporter can glance at while typing. On a phone that same
 * content would be ~700px of preamble standing between the reporter and the
 * form, so below `lg` it collapses to a single reassuring line that expands on
 * demand. The promise still arrives first; it just stops being a wall.
 *
 * The copy deliberately avoids "100% confidential" / "completely anonymous".
 * The manual's voice table forbids claiming absolute anonymity, because it is a
 * promise no system can keep and it destroys trust the moment a reporter learns
 * the technical limits. We say what is true: you are never required to identify
 * yourself.
 */
export function ReporterAssuranceRail({
  onHowItWorks,
}: {
  /** Opens the guided tour where the host page provides one. */
  onHowItWorks?: () => void;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const assurances = (
    <div className="stagger space-y-4">
      <AssuranceItem
        icon={UserRoundCheck}
        title={t('rail.identity.title', { defaultValue: 'You choose what to reveal' })}
      >
        {t('rail.identity.body', {
          defaultValue:
            'You can submit this report without providing your identity. Nothing in this form requires your name.',
        })}
      </AssuranceItem>

      <AssuranceItem
        icon={Lock}
        title={t('rail.secure.title', { defaultValue: 'Secure and access-controlled' })}
      >
        {t('rail.secure.body', {
          defaultValue:
            'Your report is encrypted in transit and at rest, and is readable only by the people assigned to review it.',
        })}
      </AssuranceItem>

      <AssuranceItem
        icon={Scale}
        title={t('rail.fair.title', { defaultValue: 'Reviewed impartially' })}
      >
        {t('rail.fair.body', {
          defaultValue:
            'Every report follows the same documented process. If it involves someone who would normally handle it, it is routed to an independent reviewer.',
        })}
      </AssuranceItem>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------- primary promise card */}
      <section className="wash-card animate-fade-up overflow-hidden rounded-xl border border-border bg-card">
        <div className="p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-plum-tint text-plum">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="min-w-0 text-sm font-semibold text-foreground">
              {t('rail.title', { defaultValue: 'Your voice matters' })}
            </h2>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t('rail.intro', {
              defaultValue:
                'Raising a concern helps build a safer, fairer workplace. Share what you know — you decide how much you reveal about yourself.',
            })}
          </p>
        </div>

        {/* Always expanded from `lg` up. */}
        <div className="hidden border-t border-border p-5 lg:block">{assurances}</div>

        {/* Below `lg`, the detail is one tap away rather than always in the way. */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => {
              setOpenOnMobile((open) => !open);
            }}
            aria-expanded={openOnMobile}
            className="flex min-h-11 w-full items-center justify-between gap-3 border-t border-border px-5 py-3 text-left text-xs font-semibold text-signal-strong transition-colors hover:bg-signal-tint/60"
          >
            <span>
              {openOnMobile
                ? t('rail.hideProtections', { defaultValue: 'Hide how you are protected' })
                : t('rail.showProtections', { defaultValue: 'How you are protected' })}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                openOnMobile && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>
          {openOnMobile && (
            <div className="animate-fade-in border-t border-border p-5">{assurances}</div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------ help + art */}
      <section className="animate-fade-up rounded-xl border border-border bg-muted/40 p-5 [animation-delay:0.08s]">
        <h3 className="text-sm font-semibold text-foreground">
          {t('rail.help.title', { defaultValue: 'Need help?' })}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {t('rail.help.body', {
            defaultValue:
              'See how a report is handled, from submission through to a documented conclusion.',
          })}
        </p>
        {onHowItWorks !== undefined && (
          <button
            type="button"
            onClick={onHowItWorks}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-signal-strong transition-colors hover:border-signal/40 hover:bg-signal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t('rail.help.action', { defaultValue: 'How it works' })}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        )}
      </section>

      {/* The illustration is supporting warmth, not information, so it is the
          first thing dropped when vertical space is scarce. */}
      <div className="hidden lg:block">
        <ProtectedChannelArt className="animate-fade-in [animation-delay:0.2s]" />
      </div>

      <div className="px-2 pb-1 text-center">
        <Heart
          className="mx-auto h-5 w-5 text-signal-soft"
          aria-hidden="true"
          style={{ animation: 'tellara-float 4.5s ease-in-out infinite' }}
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t('rail.courage', { defaultValue: 'Raising a concern takes courage.' })}
          <span className="mt-0.5 block font-semibold text-foreground">
            {t('rail.notAlone', { defaultValue: 'You are not alone.' })}
          </span>
        </p>
      </div>
    </div>
  );
}
