import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Extra text matched by the search box (e.g. a country name for a region). */
  keywords?: string;
  /** Optional leading visual (e.g. a country flag). */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SearchableSelectGroup {
  /** Optional heading shown above the group (omit for an ungrouped list). */
  label?: string;
  options: SearchableSelectOption[];
}

interface SearchableSelectProps {
  id?: string | undefined;
  value: string;
  onChange: (value: string) => void;
  groups: SearchableSelectGroup[];
  /** Trigger text when nothing is selected; also the label of the clear row. */
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  /** Offer a row that clears the selection back to empty. Default true. */
  allowEmpty?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  ariaLabel?: string | undefined;
  dir?: string | undefined;
  lang?: string | undefined;
  translate?: 'yes' | 'no' | undefined;
}

const PANEL_MAX_HEIGHT = 320;

type Row =
  | { kind: 'empty'; idx: number }
  | { kind: 'header'; label: string; key: string }
  | { kind: 'option'; idx: number; option: SearchableSelectOption; key: string };

/**
 * A searchable single-select combobox. Looks like the native {@link Select} but
 * opens a filterable, keyboard-navigable list — essential for long pick-lists
 * (currencies, time zones, regions). The panel renders in a portal positioned
 * from the trigger, so it never clips inside scrollable dialogs/sheets.
 */
export function SearchableSelect({
  id,
  value,
  onChange,
  groups,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  allowEmpty = true,
  disabled = false,
  className,
  ariaLabel,
  dir,
  lang,
  translate,
}: SearchableSelectProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [coords, setCoords] = useState({ left: 0, top: 0, width: 0, openUp: false });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const allOptions = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const selected = allOptions.find((o) => o.value === value);
  // A non-empty value that isn't in the catalog (e.g. legacy data) still shows.
  const triggerLabel = value.length > 0 ? (selected?.label ?? value) : '';

  const q = query.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (q.length === 0) {
      return groups;
    }
    return groups
      .map((g) => ({
        label: g.label,
        options: g.options.filter((o) =>
          `${o.label} ${o.keywords ?? ''} ${o.value}`.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [groups, q]);

  const showEmptyRow = allowEmpty && q.length === 0;

  // Flat render rows (headers + options) plus the parallel list of selectable
  // values, so keyboard navigation works even when a value repeats across groups
  // (e.g. a time zone listed under both "Suggested" and its region).
  const { rows, flatValues } = useMemo(() => {
    const builtRows: Row[] = [];
    const values: string[] = [];
    let i = 0;
    if (showEmptyRow) {
      builtRows.push({ kind: 'empty', idx: i });
      values.push('');
      i += 1;
    }
    filteredGroups.forEach((g, gi) => {
      if (g.label !== undefined && g.label.length > 0) {
        builtRows.push({ kind: 'header', label: g.label, key: `h-${String(gi)}` });
      }
      g.options.forEach((o, oi) => {
        builtRows.push({
          kind: 'option',
          idx: i,
          option: o,
          key: `o-${String(gi)}-${String(oi)}-${o.value}`,
        });
        if (o.disabled !== true) {
          values.push(o.value);
        }
        i += 1;
      });
    });
    return { rows: builtRows, flatValues: values };
  }, [filteredGroups, showEmptyRow]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (el === null) {
      return;
    }
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < PANEL_MAX_HEIGHT && r.top > spaceBelow;
    setCoords({
      left: r.left,
      top: openUp ? r.top - 4 : r.bottom + 4,
      width: r.width,
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  // Reposition while open; close on outside pointer-down.
  useEffect(() => {
    if (!open) {
      return;
    }
    const reposition = (): void => {
      updatePosition();
    };
    const onPointerDown = (e: MouseEvent): void => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) === true || panelRef.current?.contains(t) === true) {
        return;
      }
      setOpen(false);
    };
    // Capture-phase so Escape dismisses only the dropdown — it runs before, and
    // stops, a host Dialog/Sheet's bubble-phase Escape-to-close listener.
    const onEscapeCapture = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscapeCapture, true);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscapeCapture, true);
    };
  }, [open, updatePosition]);

  // Reset search + focus it each time the panel opens.
  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    setActiveIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(t);
    };
  }, [open]);

  // First match becomes active whenever the query changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keep the highlighted row scrolled into view.
  useEffect(() => {
    if (!open) {
      return;
    }
    listRef.current
      ?.querySelector(`[data-idx="${String(activeIndex)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const choose = (next: string): void => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flatValues.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const next = flatValues.at(activeIndex);
      if (next !== undefined) {
        choose(next);
      }
    }
    // Escape is handled by a capture-phase document listener (see the open effect)
    // so it dismisses only the dropdown, not a host Dialog/Sheet.
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        dir={dir}
        lang={lang}
        translate={translate}
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 px-4 text-sm text-foreground',
          'focus:border-signal focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-60',
          open && 'border-signal bg-card ring-2 ring-ring',
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selected?.icon}
          <span className={cn('truncate text-left', triggerLabel.length === 0 && 'text-muted-foreground/70')}>
            {triggerLabel.length > 0 ? triggerLabel : placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: coords.left,
              top: coords.top,
              width: coords.width,
              ...(coords.openUp ? { transform: 'translateY(-100%)' } : {}),
            }}
            // Must sit above the Sheet/drawer portal (z-[9999]) — both render to
            // document.body, so a lower z-index would hide the dropdown behind it.
            className="z-[10000] flex flex-col overflow-hidden rounded-[12px] border border-border bg-white shadow-lg"
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                aria-label={searchPlaceholder}
              />
            </div>

            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="overflow-y-auto py-1"
              style={{ maxHeight: PANEL_MAX_HEIGHT - 44 }}
            >
              {rows.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground/70">No matches.</p>
              ) : (
                rows.map((row) => {
                  if (row.kind === 'header') {
                    return (
                      <div
                        key={row.key}
                        className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70"
                      >
                        {row.label}
                      </div>
                    );
                  }
                  const rowValue = row.kind === 'empty' ? '' : row.option.value;
                  const rowLabel = row.kind === 'empty' ? placeholder : row.option.label;
                  const rowDisabled = row.kind === 'option' && row.option.disabled === true;
                  const isSelected = rowValue === value;
                  const isActive = row.idx === activeIndex;
                  return (
                    <button
                      key={row.kind === 'empty' ? 'empty-row' : row.key}
                      type="button"
                      role="option"
                      dir={dir}
                      lang={lang}
                      translate={translate}
                      aria-selected={isSelected}
                      data-idx={row.idx}
                      onMouseEnter={() => {
                        if (!rowDisabled) {
                          setActiveIndex(row.idx);
                        }
                      }}
                      onClick={() => {
                        if (rowDisabled) {
                          return;
                        }
                        choose(rowValue);
                      }}
                      disabled={rowDisabled}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors',
                        isActive ? 'bg-brand-accent/10' : 'hover:bg-muted/60',
                        isSelected ? 'font-medium text-brand-primary' : 'text-foreground',
                        row.kind === 'empty' && rowValue.length === 0 && 'text-muted-foreground/70',
                        rowDisabled && 'cursor-not-allowed opacity-45 hover:bg-transparent',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {row.kind === 'option' && row.option.icon}
                        <span className="truncate">{rowLabel}</span>
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-brand-accent" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
