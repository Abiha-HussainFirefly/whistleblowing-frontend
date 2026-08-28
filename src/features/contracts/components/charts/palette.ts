/**
 * Chart colour tokens for the Contracts dashboard. Brand navy/teal are read from
 * the live `--brand-primary` / `--brand-accent` CSS tokens so charts follow the
 * org's white-label theme; the rest are fixed, semantic accents.
 */
import { cssVar } from '@lib/utils';

export const CHART_COLORS = {
  navy: cssVar('--brand-primary', '#1e3a8a'),
  teal: cssVar('--brand-accent', '#0e9aa7'),
  amber: '#f59e0b',
  blue: '#3b82f6',
  green: '#10b981',
  red: '#f43f5e',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  slate: '#64748b',
} as const;

/** Ordered palette for categorical series (distribution bars, pies). Leads with
 *  the brand teal, then a bright, harmonious sequence so charts read clearly. */
export const CATEGORICAL_PALETTE: string[] = [
  CHART_COLORS.teal,
  CHART_COLORS.blue,
  CHART_COLORS.indigo,
  CHART_COLORS.amber,
  CHART_COLORS.green,
  CHART_COLORS.purple,
  CHART_COLORS.red,
  CHART_COLORS.navy,
];

/** Semantic colours for the standard vs. non-standard split. */
export const CLASSIFICATION_COLORS: Record<string, string> = {
  STANDARD: CHART_COLORS.teal,
  NON_STANDARD: CHART_COLORS.amber,
};

export function colorAt(index: number): string {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length] ?? CHART_COLORS.slate;
}

/** Shared tooltip chrome — soft rounded card with a subtle lift. */
export const CHART_TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 14px -6px rgba(15,23,42,0.18)',
  fontSize: 12,
  padding: '8px 12px',
} as const;
