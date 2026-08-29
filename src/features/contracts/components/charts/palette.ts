/**
 * Chart colour tokens.
 *
 * Brand plum/violet are read from the live `--brand-primary` / `--brand-accent`
 * CSS tokens so charts follow the organization's white-label theme; the rest are
 * fixed, semantic accents drawn from the Tellara palette (manual §07).
 *
 * Charts in the case-management environment must stay calm: priority is conveyed
 * through semantics and workflow state, not through red-heavy dashboards
 * (manual §11). Red is reserved for genuine operational urgency.
 */
import { cssVar } from '@lib/utils';

export const CHART_COLORS = {
  /** Protected Plum — brand authority. */
  plum: cssVar('--brand-primary', '#4B2E58'),
  /** Signal Violet — the primary action/series colour. */
  violet: cssVar('--brand-accent', '#6F56D9'),
  /** Courage Amber — attention and the reporter signal. */
  amber: '#D79A3E',
  /** Resolution Moss — resolved / positive outcome. */
  moss: '#3F7564',
  indigo: '#5B6BD6',
  lilac: '#A996E8',
  clay: '#B4796A',
  slate: '#6B6478',
  /** Operational urgency only — never a default series colour. */
  red: '#C0453F',
} as const;

/**
 * Ordered palette for categorical series (distribution bars, pies). Leads with
 * Signal Violet, then walks the brand ramp so adjacent slices stay separable in
 * both hue and lightness — the categories are neutral facts, so none of them is
 * allowed to read as "the bad one".
 */
export const CATEGORICAL_PALETTE: string[] = [
  CHART_COLORS.violet,
  CHART_COLORS.moss,
  CHART_COLORS.amber,
  CHART_COLORS.plum,
  CHART_COLORS.lilac,
  CHART_COLORS.indigo,
  CHART_COLORS.clay,
  CHART_COLORS.slate,
];

/** Semantic colours for the standard vs. non-standard split. */
export const CLASSIFICATION_COLORS: Record<string, string> = {
  STANDARD: CHART_COLORS.violet,
  NON_STANDARD: CHART_COLORS.amber,
};

/**
 * Workflow-state colours for charts.
 *
 * A status donut and the status pills beside it must not disagree about what
 * colour "Under investigation" is — two colour systems for one concept is
 * exactly the ambiguity the brand manual's §12 rule is guarding against.
 * Keyed by `StateTone` from components/ui/status-pill.
 */
export const STATE_TONE_COLOR: Record<string, string> = {
  submitted: '#6B6478',      // neutral — the report exists, nothing is implied
  review: CHART_COLORS.amber, // being assessed
  investigation: CHART_COLORS.violet,
  action: CHART_COLORS.plum,  // waiting on the reporter
  priority: CHART_COLORS.red, // genuine operational urgency only
  resolved: CHART_COLORS.moss,
  closed: '#9A93A6',
};

export function colorForTone(tone: string): string {
  return STATE_TONE_COLOR[tone] ?? CHART_COLORS.slate;
}

export function colorAt(index: number): string {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length] ?? CHART_COLORS.slate;
}

/** Shared tooltip chrome — soft rounded card with a subtle lift. */
export const CHART_TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid hsl(32 16% 89%)',
  boxShadow: '0 4px 14px -6px hsl(257 27% 10% / 0.18)',
  fontSize: 12,
  padding: '8px 12px',
} as const;
