import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Copy, Download, ExternalLink, KeyRound, Hash } from 'lucide-react';
import { Button } from '@components/ui/button';
import type { ReporterSubmitResult } from '../types';

interface ReportCredentialsProps {
  result: ReporterSubmitResult;
  onTrack: () => void;
}

export function ReportCredentials({ result, onTrack }: ReportCredentialsProps): ReactElement {
  const { t } = useTranslation('whistleblowing');

  const downloadCredentials = (): void => {
    const contents = [
      t('credentials.downloadTitle', { defaultValue: 'Whistleblowing report credentials' }),
      '',
      `${t('credentials.caseReference', { defaultValue: 'Case reference' })}: ${result.caseReferenceNumber}`,
      `${t('credentials.password', { defaultValue: 'Password' })}: ${result.password}`,
      '',
      t('credentials.downloadReminder', {
        defaultValue: 'Save these credentials securely. The password is shown only once.',
      }),
    ].join('\n');
    const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-credentials-${result.caseReferenceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4 dark:border-green-800/40 dark:bg-green-900/20">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">
            {t('credentials.receivedTitle', {
              defaultValue: 'Your report has been received.',
            })}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-green-700/80 dark:text-green-400/80">
            {t('credentials.receivedDescription', {
              defaultValue:
                'Save these credentials now. The password is shown only once and cannot be recovered. Use them to log back in and track your case.',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-100">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {t('credentials.saveTitle', {
              defaultValue: 'Save these credentials now.',
            })}
          </p>
          <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-100/80">
            {t('credentials.saveDescription', {
              defaultValue:
                'Download them as a text file or copy them somewhere secure. The password will not be shown again.',
            })}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('credentials.loginCredentials', { defaultValue: 'Your login credentials' })}
          </p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          <CredentialRow
            icon={<Hash className="h-4 w-4 text-slate-400" />}
            label={t('credentials.caseReference', { defaultValue: 'Case reference' })}
            value={result.caseReferenceNumber}
          />
          <CredentialRow
            icon={<KeyRound className="h-4 w-4 text-slate-400" />}
            label={t('credentials.password', { defaultValue: 'Password' })}
            value={result.password}
            mono
            sensitive
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={downloadCredentials} className="w-full sm:w-auto">
          <Download className="h-4 w-4" />
          {t('credentials.download', { defaultValue: 'Download text file' })}
        </Button>
        <Button onClick={onTrack} className="w-full sm:w-auto">
          <ExternalLink className="h-4 w-4" />
          {t('credentials.track', { defaultValue: 'Track my case' })}
        </Button>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t('credentials.trackDescription', {
            defaultValue:
              'Opens in a new tab so your case reference and password stay visible here. Save them before you leave this page. The password is shown only once.',
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
  mono = false,
  sensitive = false,
}: {
  icon: ReactElement;
  label: string;
  value: string;
  mono?: boolean;
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
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p
          className={`mt-0.5 text-sm text-slate-900 dark:text-slate-100 ${mono ? 'font-mono' : 'font-semibold'}`}
        >
          {sensitive && !revealed ? '**************' : value}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {sensitive && (
          <button
            onClick={() => {
              setRevealed((r) => !r);
            }}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            {revealed
              ? t('credentials.hide', { defaultValue: 'Hide' })
              : t('credentials.reveal', { defaultValue: 'Reveal' })}
          </button>
        )}
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied
            ? t('credentials.copied', { defaultValue: 'Copied!' })
            : t('credentials.copy', { defaultValue: 'Copy' })}
        </button>
      </div>
    </div>
  );
}
