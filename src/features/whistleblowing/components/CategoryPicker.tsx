import { type ReactElement, useMemo, useState } from 'react';
import {
  AlertOctagon,
  Banknote,
  BookLock,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  CircleDollarSign,
  Cpu,
  Database,
  Earth,
  Gavel,
  HandCoins,
  HardHat,
  Heart,
  HelpCircle,
  Landmark,
  Lightbulb,
  MessageSquareWarning,
  Package,
  Pill,
  Scale,
  ScrollText,
  Search,
  ShieldAlert,
  Ship,
  Sparkles,
  UserRoundX,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { Input } from '@components/ui/input';
import type { WhistleblowingCategory } from '../types';

/**
 * Per-category iconography.
 *
 * Icons are chosen to describe the SUBJECT of a concern, never to imply guilt
 * or severity — a category is a routing fact (manual §12). Nothing here uses a
 * police, handcuff or alarm metaphor.
 */
const CATEGORY_ICON: Record<WhistleblowingCategory, LucideIcon> = {
  FRAUD: Banknote,
  BRIBERY_CORRUPTION: HandCoins,
  HARASSMENT: MessageSquareWarning,
  CONFLICT_OF_INTEREST: Scale,
  DATA_PRIVACY: Database,
  HEALTH_SAFETY: HardHat,
  DISCRIMINATION: UserRoundX,
  RETALIATION: ShieldAlert,
  OTHER_MISCONDUCT: HelpCircle,
  ACCOUNTING_AUDITING: CircleDollarSign,
  COMPENSATION_BENEFITS: Briefcase,
  SGBP_COMPLIANCE: ScrollText,
  CONFIDENTIAL_INFORMATION: BookLock,
  DISCLOSURE_COMMUNICATIONS: ScrollText,
  DIVERSITY_EQUITY_INCLUSION: Users,
  DUE_DILIGENCE: Search,
  ENVIRONMENTAL: Earth,
  FAIR_COMPETITION: Gavel,
  GLOBAL_TRADE: Ship,
  HUMAN_RIGHTS: Heart,
  IMMINENT_THREAT: AlertOctagon,
  INSIDER_TRADING: Landmark,
  INTELLECTUAL_PROPERTY: Lightbulb,
  ASSET_MISUSE: Building2,
  POLITICAL_ACTIVITY: Landmark,
  PRODUCT_QUALITY_SAFETY: Package,
  SUBSTANCE_ABUSE: Pill,
  IT_ELECTRONIC_COMMS: Cpu,
  WORKPLACE_CIVILITY: Sparkles,
  OTHER_BUSINESS_INTEGRITY: HelpCircle,
  OTHER_HUMAN_RESOURCES: HelpCircle,
  INQUIRY: HelpCircle,
};

/** Above this many options, a dropdown-sized list stops being scannable. */
const SEARCH_THRESHOLD = 12;

/**
 * How many cards to show before the "show all" affordance.
 *
 * An organization can configure all 32 categories. Rendering every one costs
 * ~16 rows on a phone, which buries the rest of the form under a wall of
 * choices and makes the first question feel like the whole form. Showing a
 * scannable first screen and letting the reporter open the rest (or search)
 * keeps the intake feeling finite — the progressive-disclosure principle
 * applied in the reporter's favour (manual §09 rule 05).
 */
const COLLAPSED_COUNT = 8;

export interface CategoryPickerProps {
  categories: readonly WhistleblowingCategory[];
  value: WhistleblowingCategory | '';
  onChange: (next: WhistleblowingCategory) => void;
  /** Localized label for a category value. */
  labelFor: (category: WhistleblowingCategory) => string;
  searchPlaceholder: string;
  emptyLabel: string;
  /** Uses a `{{count}}` placeholder for the number of hidden categories. */
  showAllLabel: string;
  showLessLabel: string;
  className?: string;
}

/**
 * Category selection as a card grid rather than a dropdown.
 *
 * A person deciding "which of these is my situation" is doing the hardest part
 * of the whole form. Cards let them read every option at once instead of
 * discovering them one at a time behind a collapsed control, which is the
 * progressive-disclosure principle applied in the reporter's favour (manual
 * §09 rule 05).
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  labelFor,
  searchPlaceholder,
  emptyLabel,
  showAllLabel,
  showLessLabel,
  className,
}: CategoryPickerProps): ReactElement {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const showSearch = categories.length > SEARCH_THRESHOLD;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return categories;
    }
    return categories.filter((category) => labelFor(category).toLowerCase().includes(needle));
  }, [categories, query, labelFor]);

  const searching = query.trim().length > 0;
  // A selected card must stay on screen even when it sits past the fold, or
  // collapsing the list would silently hide the reporter's own answer.
  const selectionHidden =
    value !== '' && !expanded && !searching && matches.indexOf(value) >= COLLAPSED_COUNT;
  const collapsible = !searching && matches.length > COLLAPSED_COUNT;
  const visible =
    collapsible && !expanded
      ? [
          ...matches.slice(0, COLLAPSED_COUNT - (selectionHidden ? 1 : 0)),
          ...(selectionHidden ? [value as WhistleblowingCategory] : []),
        ]
      : matches;
  const hiddenCount = matches.length - visible.length;

  return (
    <div className={className}>
      {showSearch && (
        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder={searchPlaceholder}
            className="ps-10"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <div
          role="radiogroup"
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4"
        >
          {visible.map((category) => {
            const Icon = CATEGORY_ICON[category] ?? HelpCircle;
            const selected = value === category;

            return (
              <button
                key={category}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onChange(category);
                }}
                className={cn(
                  'lift group relative flex min-h-[5.75rem] flex-col items-center justify-center gap-2 rounded-xl border p-2.5 text-center sm:min-h-[7rem] sm:gap-2.5 sm:p-3',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  selected
                    ? 'border-signal bg-signal-tint shadow-violet'
                    : 'border-border bg-card hover:border-signal/40 hover:bg-signal-tint/50',
                )}
              >
                {/* Selection is marked by a check glyph as well as the tint, so
                    it survives for anyone who cannot distinguish the colour. */}
                {selected && (
                  <span
                    className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-signal text-white"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-10 sm:w-10',
                    selected
                      ? 'bg-signal/15 text-signal-strong'
                      : 'bg-muted text-muted-foreground group-hover:text-signal-strong',
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </span>
                {/* `break-words` matters: several configured category labels are
                    long compound phrases that would otherwise spill past the
                    card edge at narrow widths. */}
                <span
                  className={cn(
                    'w-full break-words text-[0.6875rem] font-medium leading-tight sm:text-xs',
                    selected ? 'text-signal-strong' : 'text-foreground',
                  )}
                >
                  {labelFor(category)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {collapsible && (
        <button
          type="button"
          onClick={() => {
            setExpanded((open) => !open);
          }}
          aria-expanded={expanded}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-4 text-sm font-semibold text-signal-strong transition-colors hover:border-signal/40 hover:bg-signal-tint/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {expanded
            ? showLessLabel
            : showAllLabel.replace('{{count}}', String(hiddenCount))}
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform', expanded && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
