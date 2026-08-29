import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Hash,
  KeyRound,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Callout } from '@components/ui/callout';
import { ROUTES } from '@config/routes';
import { cn } from '@lib/utils';
import type { ReporterSubmitResult } from '../types';

interface ReportCredentialsProps {
  result: ReporterSubmitResult;
  onTrack: () => void;
  /** Shown on the saved/printed copy so the reporter knows which channel it is. */
  organizationName?: string;
}

/**
 * The private case receipt (manual §16, launch item 03).
 *
 * This is the highest-stakes screen in the whole product. The return key is
 * generated, hashed, and never stored in a recoverable form — so if the
 * reporter loses it, nobody, including us, can reissue it, and the case becomes
 * unreachable to the person who raised it. There is also no email on file for
 * an anonymous report, so there is no fallback channel.
 *
 * The design therefore does three things rather than just displaying a string:
 *
 *   1. Offers three durable ways to keep the credentials — download, print
 *      (which is also "Save as PDF" in every modern browser), and copy — so the
 *      reporter can use whichever they trust.
 *   2. Tracks whether they have actually done one of them.
 *   3. Guards the browser tab. Until the reporter confirms they have saved the
 *      credentials, closing or navigating away raises the browser's own
 *      "leave site?" prompt. That guard is the only thing standing between a
 *      stray Cmd-W and a permanently inaccessible case.
 *
 * Case identifiers are set in IBM Plex Mono so a reporter copying them by hand
 * can tell 0 from O and 1 from l.
 */
export function ReportCredentials({
  result,
  onTrack,
  organizationName,
}: ReportCredentialsProps): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const [acknowledged, setAcknowledged] = useState(false);
  const [savedVia, setSavedVia] = useState<'download' | 'print' | 'copy' | null>(null);

  const trackingUrl =
    typeof window === 'undefined' ? ROUTES.REPORT.TRACK : `${window.location.origin}${ROUTES.REPORT.TRACK}`;

  const referenceLabel = t('credentials.caseReference', { defaultValue: 'Case reference' });
  const keyLabel = t('credentials.password', { defaultValue: 'Return key' });

  /**
   * Warn before the tab is closed while the credentials are still unconfirmed.
   *
   * Browsers ignore custom text here and show their own wording, and they only
   * honour the prompt at all if the user has interacted with the page — which,
   * having just completed a five-step form, they have.
   */
  useEffect(() => {
    if (acknowledged) {
      return;
    }
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      // Legacy browsers require a non-empty returnValue to trigger the prompt.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
    };
  }, [acknowledged]);

  /** Plain text, so it opens on any device without an app or a font. */
  const receiptText = (): string =>
    [
      t('credentials.downloadTitle', { defaultValue: 'Tellara — private case credentials' }),
      organizationName === undefined ? null : `${t('credentials.organization', { defaultValue: 'Organization' })}: ${organizationName}`,
      `${t('credentials.savedOn', { defaultValue: 'Saved on' })}: ${new Date().toLocaleString()}`,
      '',
      '------------------------------------------------------------',
      `${referenceLabel}: ${result.caseReferenceNumber}`,
      `${keyLabel}: ${result.password}`,
      '------------------------------------------------------------',
      '',
      `${t('credentials.trackAt', { defaultValue: 'Track your case at' })}: ${trackingUrl}`,
      '',
      t('credentials.downloadReminder', {
        defaultValue:
          'Keep these somewhere only you can reach. The return key is shown once and cannot be reissued.',
      }),
    ]
      .filter((line): line is string => line !== null)
      .join('\n');

  const downloadCredentials = (): void => {
    // Leading BOM. The file is valid UTF-8 either way, but without it Windows
    // Notepad and Excel still guess Windows-1252 on a plain .txt, which turns
    // the em dash into "â€”" and would mangle a non-Latin organization name —
    // in a file whose entire purpose is to still be readable months from now.
    const blob = new Blob(['\uFEFF', receiptText()], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tellara-case-${result.caseReferenceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
    setSavedVia('download');
  };

  /** The browser's print dialog is also its "Save as PDF" dialog. */
  const printCredentials = (): void => {
    setSavedVia('print');
    window.print();
  };

  const copyBoth = (): void => {
    const text = `${referenceLabel}: ${result.caseReferenceNumber}\n${keyLabel}: ${result.password}`;
    try {
      void navigator.clipboard
        .writeText(text)
        .then(() => {
          setSavedVia('copy');
        })
        .catch(() => {
          /* Clipboard denied — the download and print paths still work. */
        });
    } catch {
      /* Older browsers without the async clipboard API. */
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-moss/25 bg-moss-tint px-5 py-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-moss" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {t('credentials.receivedTitle', { defaultValue: 'Your report has been received.' })}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t('credentials.receivedDescription', {
              defaultValue:
                'It is now with the people assigned to review it. Nothing further is required from you unless they ask a question.',
            })}
          </p>
        </div>
      </div>

      {/* This warning is the reason the screen exists — it leads. */}
      <Callout
        tone="caution"
        icon={ShieldAlert}
        title={t('credentials.saveTitle', { defaultValue: 'Save these before you leave this page' })}
      >
        {t('credentials.saveDescription', {
          defaultValue:
            'Your return key is shown once and is not stored in a recoverable form. If you lose it, we cannot reissue it and you will not be able to reopen this case.',
        })}
      </Callout>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('credentials.loginCredentials', { defaultValue: 'Your private case credentials' })}
          </p>
        </div>
        <div className="divide-y divide-border">
          <CredentialRow
            icon={<Hash className="h-4 w-4" aria-hidden="true" />}
            label={referenceLabel}
            value={result.caseReferenceNumber}
          />
          <CredentialRow
            icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
            label={keyLabel}
            value={result.password}
            sensitive
          />
        </div>
      </div>

      {/* ---------------------------------------------- ways to keep them */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">
          {t('credentials.keepTitle', { defaultValue: 'Keep a copy' })}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t('credentials.keepDescription', {
            defaultValue:
              'Use whichever you trust. A printed copy or a saved file works even if you lose access to this device.',
          })}
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <Button variant="outline" onClick={downloadCredentials} className="w-full">
            {savedVia === 'download' ? (
              <Check className="h-4 w-4 text-moss" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            {t('credentials.download', { defaultValue: 'Download file' })}
          </Button>

          <Button variant="outline" onClick={printCredentials} className="w-full">
            {savedVia === 'print' ? (
              <Check className="h-4 w-4 text-moss" aria-hidden="true" />
            ) : (
              <Printer className="h-4 w-4" aria-hidden="true" />
            )}
            {t('credentials.print', { defaultValue: 'Print / Save as PDF' })}
          </Button>

          <Button variant="outline" onClick={copyBoth} className="w-full">
            {savedVia === 'copy' ? (
              <Check className="h-4 w-4 text-moss" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {savedVia === 'copy'
              ? t('credentials.copied', { defaultValue: 'Copied' })
              : t('credentials.copyBoth', { defaultValue: 'Copy both' })}
          </Button>
        </div>
      </div>

      {/* -------------------------------------------- acknowledgement gate */}
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
          acknowledged
            ? 'border-moss/30 bg-moss-tint'
            : 'border-courage/40 bg-courage-tint',
        )}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => {
            setAcknowledged(event.target.checked);
          }}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-signal"
        />
        <span className="min-w-0 text-sm leading-relaxed text-foreground">
          {t('credentials.acknowledge', {
            defaultValue:
              'I have saved my case reference and return key somewhere I can find them again.',
          })}
          {!acknowledged && (
            <span className="mt-1 block text-xs text-muted-foreground">
              {t('credentials.acknowledgeHint', {
                defaultValue:
                  'Until you confirm, your browser will warn you before this page closes.',
              })}
            </span>
          )}
        </span>
      </label>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onTrack} className="w-full sm:w-auto">
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {t('credentials.track', { defaultValue: 'Track my case' })}
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t('credentials.trackDescription', {
          defaultValue:
            'Tracking opens in a new tab so your credentials stay visible here. Anonymity is not affected by returning to your case.',
        })}
      </p>

      {/* Print-only receipt. Hidden on screen; the print stylesheet in
          globals.css hides everything else and shows this. */}
      <div className="print-receipt" aria-hidden="true">
        <h1 style={{ fontSize: '18pt', margin: '0 0 4pt' }}>
          {t('credentials.downloadTitle', { defaultValue: 'Tellara — private case credentials' })}
        </h1>
        {organizationName !== undefined && (
          <p style={{ margin: '0 0 2pt', fontSize: '11pt' }}>{organizationName}</p>
        )}
        <p style={{ margin: '0 0 16pt', fontSize: '10pt' }}>
          {t('credentials.savedOn', { defaultValue: 'Saved on' })}: {new Date().toLocaleString()}
        </p>

        <table style={{ borderCollapse: 'collapse', margin: '0 0 16pt' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6pt 18pt 6pt 0', fontSize: '11pt' }}>{referenceLabel}</td>
              <td
                style={{
                  padding: '6pt 0',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '14pt',
                  fontWeight: 700,
                }}
              >
                {result.caseReferenceNumber}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '6pt 18pt 6pt 0', fontSize: '11pt' }}>{keyLabel}</td>
              <td
                style={{
                  padding: '6pt 0',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '14pt',
                  fontWeight: 700,
                }}
              >
                {result.password}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ margin: '0 0 8pt', fontSize: '10pt' }}>
          {t('credentials.trackAt', { defaultValue: 'Track your case at' })}: {trackingUrl}
        </p>
        <p style={{ margin: 0, fontSize: '10pt' }}>
          {t('credentials.downloadReminder', {
            defaultValue:
              'Keep these somewhere only you can reach. The return key is shown once and cannot be reissued.',
          })}
        </p>
      </div>
    </div>
  );
}

function CredentialRow({
  icon,
  label,
  value,
  sensitive = false,
}: {
  icon: ReactElement;
  label: string;
  value: string;
  sensitive?: boolean;
}): ReactElement {
  const { t } = useTranslation('whistleblowing');
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!sensitive);

  const copy = (): void => {
    try {
      void navigator.clipboard
        .writeText(value)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => {
            setCopied(false);
          }, 1500);
        })
        .catch(() => {
          setCopied(false);
        });
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-plum-tint text-plum">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            'case-key mt-1 break-all text-base font-semibold text-foreground',
            sensitive && !revealed && 'select-none tracking-[0.3em]',
          )}
          translate="no"
        >
          {sensitive && !revealed ? '••••••••••••' : value}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {sensitive && (
          <button
            type="button"
            onClick={() => {
              setRevealed((r) => !r);
            }}
            className="inline-flex min-h-9 items-center rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            {revealed
              ? t('credentials.hide', { defaultValue: 'Hide' })
              : t('credentials.reveal', { defaultValue: 'Reveal' })}
          </button>
        )}
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {copied
            ? t('credentials.copied', { defaultValue: 'Copied' })
            : t('credentials.copy', { defaultValue: 'Copy' })}
        </button>
      </div>
    </div>
  );
}
