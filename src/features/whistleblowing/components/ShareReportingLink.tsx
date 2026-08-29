import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Copy, ExternalLink, Link2 } from 'lucide-react';

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

  if (slug === null) {
    return null;
  }

  const url = `${window.location.origin}${ROUTES.REPORT.PORTAL(slug)}`;

  const copy = (): void => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  const bullets = [
    t('share.bullets.noAccount', { defaultValue: 'No account is required to submit.' }),
    t('share.bullets.anonymous', { defaultValue: 'Anonymous reporting stays available.' }),
    t('share.bullets.secureFlow', {
      defaultValue: 'Reports route to the same secure intake flow.',
    }),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-muted/50/80 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6F56D9]/10 text-[#6F56D9]">
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t('share.publicTitle', { defaultValue: 'Public reporting link' })}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t('share.publicDescription', {
                defaultValue:
                  'Share this with employees, contractors, vendors, or external reporters.',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <code
          className="block min-w-0 truncate rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-foreground"
          title={url}
        >
          {url}
        </code>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6F56D9] px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#6F56D9]/90"
          >
            <Copy className="h-4 w-4" />
            {copied
              ? t('share.copied', { defaultValue: 'Copied' })
              : t('share.copyLink', { defaultValue: 'Copy link' })}
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
          >
            <ExternalLink className="h-4 w-4" />
            {t('share.openPublicForm', { defaultValue: 'Open public form' })}
          </a>
        </div>

        <ul className="space-y-2 border-t border-border pt-4">
          {bullets.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F56D9]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
