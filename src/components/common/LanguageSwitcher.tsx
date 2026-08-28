import { type ReactElement, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@lib/utils';
import { supportedLocales } from '@/i18n';
import { setAppLanguage } from '@lib/set-language';
import { FlagIcon } from '@components/ui/flag-icon';

interface LanguageSwitcherProps {
  /** Compact trigger (flag + short code, e.g. top nav) vs. labelled (settings). */
  variant?: 'compact' | 'full';
  /** Which edge the menu aligns to. Defaults to the trailing edge. */
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Production language switcher. A fully-accessible flag dropdown that lists every
 * supported language by its native name (with a country flag), applies the choice
 * immediately (i18next + persisted to localStorage by the detector), and — for
 * signed-in users — saves it to their profile so it follows them across devices.
 * Layout direction (RTL for Arabic/Urdu) updates via the i18n `languageChanged`
 * listener. Keyboard accessible: arrow keys move, Enter/Space select, Esc closes.
 */
export function LanguageSwitcher({
  variant = 'compact',
  align = 'end',
  className,
}: LanguageSwitcherProps): ReactElement {
  const { t, i18n } = useTranslation('settings');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const activeCode = i18n.language.split('-')[0] ?? 'en';
  const active = supportedLocales.find((l) => l.code === activeCode) ?? supportedLocales[0];

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (e: MouseEvent): void => {
      if (ref.current !== null && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Move focus to the selected option when the menu opens (keyboard support).
  useEffect(() => {
    if (!open) {
      return;
    }
    const selected = listRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    selected?.focus();
  }, [open]);

  const choose = (code: string): void => {
    setOpen(false);
    if (code === activeCode) {
      return;
    }
    void setAppLanguage(code);
  };

  const onOptionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
    );
    const index = items.indexOf(e.currentTarget);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={t('language.label')}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 shadow-sm transition-colors hover:border-brand-accent/40 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40',
          variant === 'compact' ? 'h-9 px-2 text-sm' : 'h-10 w-full justify-between px-3 text-sm',
        )}
      >
        <span className="inline-flex items-center gap-2">
          <FlagIcon
            code={active?.flagCode}
            circle={variant === 'compact'}
            className={variant === 'compact' ? 'text-[1.45rem]' : 'text-[1.1rem]'}
          />
          {variant === 'full' && <span>{active?.nativeLabel}</span>}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label={t('language.label')}
          className={cn(
            'absolute z-50 mt-2 min-w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-brand-primary/10',
            align === 'end' ? 'end-0' : 'start-0',
          )}
        >
          {supportedLocales.map((locale) => {
            const selected = locale.code === activeCode;
            return (
              <li key={locale.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => {
                    choose(locale.code);
                  }}
                  onKeyDown={onOptionKeyDown}
                  dir={locale.dir}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40',
                    selected
                      ? 'bg-brand-accent/10 font-semibold text-brand-primary'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <FlagIcon code={locale.flagCode} className="text-[1.25rem]" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{locale.nativeLabel}</span>
                    <span className="truncate text-xs font-normal text-slate-400">
                      {locale.label}
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-brand-accent" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
