import { type ReactElement, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@lib/utils';

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PaginationProps {
  /**
   * Pagination state as a `meta` envelope. Callers may instead pass the flat
   * {@link PaginationProps.page}/`pageSize`/`total`/`totalPages` props — both
   * conventions are supported so every list across the platform shares this
   * one control.
   */
  meta?: PageMeta;
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  /** Omit to hide the rows-per-page selector. */
  onPageSizeChange?: ((size: number) => void) | undefined;
  pageSizeOptions?: number[] | undefined;
  /**
   * Collapse entirely on a single page. Default: true. Ignored when a
   * rows-per-page selector is shown (that stays reachable on one page).
   */
  hideOnSinglePage?: boolean;
  className?: string;
  disabled?: boolean;
}

/** Page numbers to render, with 'gap' markers for elided ranges (1 … 4 5 6 … 12). */
function pageItems(page: number, totalPages: number): (number | 'gap')[] {
  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) {
    items.push('gap');
  }
  for (let p = start; p <= end; p += 1) {
    items.push(p);
  }
  if (end < totalPages - 1) {
    items.push('gap');
  }
  if (totalPages > 1) {
    items.push(totalPages);
  }
  return items;
}

/** Custom rows-per-page dropdown (opens upward — it lives at the bottom of a list). */
function RowsPerPage({
  value,
  options,
  disabled,
  onChange,
}: {
  value: number;
  options: number[];
  disabled: boolean;
  onChange: (size: number) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onDown = (e: MouseEvent): void => {
      if (ref.current !== null && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <label className="flex items-center gap-2">
      <span>{t('pagination.rowsPerPage')}</span>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((o) => !o);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-brand-accent/50 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {value}
          <ChevronDown
            className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div
            role="listbox"
            className="absolute bottom-full left-0 z-20 mb-1.5 min-w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={opt === value}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-xs transition-colors hover:bg-[#e6f5f6] hover:text-brand-accent',
                  opt === value ? 'font-semibold text-brand-accent' : 'text-slate-600',
                )}
              >
                {opt}
                {opt === value && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

const ARROW_CLASS =
  'flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Shared, RTL-aware server-side pagination control — an optional rows-per-page
 * selector, a "Showing X–Y of N" summary, and a numbered pager with prev/next
 * arrows. Accepts either a `meta` envelope or the equivalent flat props, so
 * every paginated list and detail-tab sub-resource across the platform reuses
 * this single component regardless of which convention it was written against.
 */
export function Pagination({
  meta,
  page: pageProp,
  pageSize: pageSizeProp,
  total: totalProp,
  totalPages: totalPagesProp,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  hideOnSinglePage = true,
  className,
  disabled = false,
}: PaginationProps): ReactElement | null {
  const { t } = useTranslation();

  // Normalise the two supported prop shapes into a single set of values.
  const page = meta?.page ?? pageProp ?? 1;
  const pageSize = meta?.pageSize ?? pageSizeProp ?? 0;
  const total = meta?.total ?? totalProp ?? 0;
  const totalPages = meta?.totalPages ?? totalPagesProp ?? 1;

  const showSizeSelector = onPageSizeChange !== undefined;

  // With a rows-per-page selector, stay visible whenever there is data; without
  // one, collapse on a single page (the historical `meta`-envelope behaviour).
  if (showSizeSelector) {
    if (total === 0) {
      return null;
    }
  } else if (hideOnSinglePage && totalPages <= 1) {
    return null;
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-slate-100 px-3 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {onPageSizeChange !== undefined && (
          <RowsPerPage
            value={pageSize}
            options={pageSizeOptions}
            disabled={disabled}
            onChange={onPageSizeChange}
          />
        )}
        <span>
          {from.toLocaleString()}–{to.toLocaleString()}
          <span className="mx-1 text-slate-400">/</span>
          <span className="font-medium text-slate-700">{total.toLocaleString()}</span>
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1 || disabled}
            onClick={() => {
              onPageChange(page - 1);
            }}
            className={ARROW_CLASS}
            aria-label={t('actions.back')}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </button>

          {pageItems(page, totalPages).map((item, index) =>
            item === 'gap' ? (
              <span key={`gap-${String(index)}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onPageChange(item);
                }}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'h-8 min-w-[2rem] rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  item === page
                    ? 'bg-brand-accent text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={page >= totalPages || disabled}
            onClick={() => {
              onPageChange(page + 1);
            }}
            className={ARROW_CLASS}
            aria-label={t('actions.next')}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
