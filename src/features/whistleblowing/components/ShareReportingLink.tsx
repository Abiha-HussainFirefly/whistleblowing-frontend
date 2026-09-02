import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2, Copy, ExternalLink, Link2, ShieldCheck } from 'lucide-react';

import { ROUTES } from '@config/routes';
import { useAuthStore } from '@store/authStore';

/**
 * Surfaces the org's public reporting-form URL so an internal user can share it
 * with external reporters. The link is tenant-scoped by org slug; anyone with
 * it can submit a confidential report without an account.
 */
export function ShareReportingLink(): ReactElement | null {
  const { t } = useTranslation('whistleblowing');
  const slug = useAuthStore(
    (s) => s.activeOrganization?.slug ?? s.availableOrganizations[0]?.slug ?? null,
  );
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  if (slug === null) {
    return null;
  }

  const url = `${window.location.origin}${ROUTES.REPORT.PORTAL(slug)}`;

  const copy = (): void => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => setCopyError(true));
  };

  const bullets = [
    t('share.bullets.noAccount', { defaultValue: 'No account is required to submit.' }),
    t('share.bullets.anonymous', { defaultValue: 'Anonymous reporting stays available.' }),
    t('share.bullets.secureFlow', {
      defaultValue: 'Reports route to the same secure intake flow.',
    }),
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-gradient-to-r from-signal-tint/60 via-card to-card px-5 py-3.5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent text-white shadow-sm">
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {t('share.publicTitle', { defaultValue: 'Public reporting link' })}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t('share.publicDescription', {
                defaultValue:
                  'Share this with employees, contractors, vendors, or external reporters.',
              })}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-moss/20 bg-moss-tint px-2.5 py-1 text-[11px] font-medium text-moss">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure link
        </span>
      </div>

      <div className="space-y-3.5 p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-stretch">
          <div className="flex min-w-0 flex-col justify-between rounded-xl border border-border bg-muted/40 p-3">
            <div><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Shareable URL</p><span className="text-[11px] text-muted-foreground">Tenant secured</span></div><code className="mt-2 block min-w-0 truncate font-mono text-sm text-brand-primary" title={url}>{url}</code></div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-moss-tint text-moss"><ShieldCheck className="h-3 w-3" /></span>Anyone with this link can submit securely without an account.</div>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl border border-brand-accent/15 bg-signal-tint/30 p-2.5">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-accent">Share or preview</p>
            <button type="button" onClick={copy} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-signal-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t('share.copied', { defaultValue: 'Copied' }) : t('share.copyLink', { defaultValue: 'Copy link' })}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-brand-accent/25 bg-card px-4 text-sm font-semibold text-brand-primary transition-colors hover:border-brand-accent/50 hover:bg-signal-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <ExternalLink className="h-4 w-4" />
              {t('share.openPublicForm', { defaultValue: 'Open public form' })}
            </a>
          </div>
        </div>
        {copyError && <p role="alert" className="text-xs text-destructive">Unable to copy automatically. Select the URL and copy it manually.</p>}

        <ul className="grid gap-2 border-t border-border pt-3 md:grid-cols-3">
          {bullets.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
