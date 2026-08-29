import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Tellara design system.
 *
 * Palette, typography and state semantics follow the Tellara Brand & Product
 * Experience Manual v2.0. Every colour resolves through a CSS variable in
 * globals.css so an organization's white-label theme can override the brand
 * layer at runtime without a rebuild.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    // Status pills are composed from data at runtime, so their classes are
    // never present as literals in the source.
    'state-submitted',
    'state-review',
    'state-investigation',
    'state-action',
    'state-priority',
    'state-resolved',
    'bg-signal-tint',
    'text-signal-strong',
    'bg-courage-tint',
    'text-courage-strong',
    'bg-moss-tint',
    'text-moss',
    'bg-plum-tint',
    'text-plum',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* ---- Tellara brand ramp (manual §07) --------------------------- */
        /* Named tokens for the six brand colours. Each is declared with the
           "H S% L%" channel form so opacity modifiers work (bg-violet/30). */
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          soft: 'hsl(var(--ink-soft) / <alpha-value>)',
          muted: 'hsl(var(--ink-muted) / <alpha-value>)',
        },
        plum: {
          DEFAULT: 'hsl(var(--plum) / <alpha-value>)',
          soft: 'hsl(var(--plum-soft) / <alpha-value>)',
          tint: 'hsl(var(--plum-tint) / <alpha-value>)',
        },
        /* Signal Violet and Courage Amber keep their brand qualifier as the
           token name. Naming them `violet`/`amber` would REPLACE Tailwind's
           built-in scales of the same name (extend merges colours only one
           level deep), silently breaking every existing `bg-amber-50` /
           `text-amber-600` in the app. */
        signal: {
          DEFAULT: 'hsl(var(--signal) / <alpha-value>)',
          strong: 'hsl(var(--signal-strong) / <alpha-value>)',
          soft: 'hsl(var(--signal-soft) / <alpha-value>)',
          tint: 'hsl(var(--signal-tint) / <alpha-value>)',
        },
        courage: {
          DEFAULT: 'hsl(var(--courage) / <alpha-value>)',
          strong: 'hsl(var(--courage-strong) / <alpha-value>)',
          tint: 'hsl(var(--courage-tint) / <alpha-value>)',
        },
        porcelain: {
          DEFAULT: 'hsl(var(--porcelain) / <alpha-value>)',
          deep: 'hsl(var(--porcelain-deep) / <alpha-value>)',
        },
        moss: {
          DEFAULT: 'hsl(var(--moss) / <alpha-value>)',
          tint: 'hsl(var(--moss-tint) / <alpha-value>)',
        },

        /* `brand.primary` / `brand.accent` follow the active organization's
           white-label variables (set at runtime by lib/theme.ts); they default
           to Protected Plum and Signal Violet. */
        brand: {
          DEFAULT: 'hsl(var(--brand-accent-hsl) / <alpha-value>)',
          primary: 'hsl(var(--brand-primary-hsl) / <alpha-value>)',
          accent: 'hsl(var(--brand-accent-hsl) / <alpha-value>)',
          ink: 'hsl(var(--ink) / <alpha-value>)',
          signal: 'hsl(var(--signal) / <alpha-value>)',
          courage: 'hsl(var(--courage) / <alpha-value>)',
          porcelain: 'hsl(var(--porcelain) / <alpha-value>)',
          moss: 'hsl(var(--moss) / <alpha-value>)',
        },

        /* Workflow / action / operational state surfaces. Kept separate from
           severity on purpose — collapsing them biases a case before it is
           investigated (manual §12). */
        state: {
          'submitted-surface': 'hsl(var(--state-submitted-surface) / <alpha-value>)',
          'submitted-text': 'hsl(var(--state-submitted-text) / <alpha-value>)',
          'review-surface': 'hsl(var(--state-review-surface) / <alpha-value>)',
          'review-text': 'hsl(var(--state-review-text) / <alpha-value>)',
          'investigation-surface': 'hsl(var(--state-investigation-surface) / <alpha-value>)',
          'investigation-text': 'hsl(var(--state-investigation-text) / <alpha-value>)',
          'action-surface': 'hsl(var(--state-action-surface) / <alpha-value>)',
          'action-text': 'hsl(var(--state-action-text) / <alpha-value>)',
          'priority-surface': 'hsl(var(--state-priority-surface) / <alpha-value>)',
          'priority-text': 'hsl(var(--state-priority-text) / <alpha-value>)',
          'resolved-surface': 'hsl(var(--state-resolved-surface) / <alpha-value>)',
          'resolved-text': 'hsl(var(--state-resolved-text) / <alpha-value>)',
        },

        /* "Viewing data for" scope-banner surface + text. */
        banner: {
          DEFAULT: 'var(--banner-surface)',
          surface: 'var(--banner-surface)',
          border: 'var(--banner-border)',
          text: 'var(--banner-text)',
          'text-strong': 'var(--banner-text-strong)',
          'text-muted': 'var(--banner-text-muted)',
          'text-dark': 'var(--banner-text-dark)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'Menlo', 'monospace'],
        urdu: ['Noto Nastaliq Urdu', 'IBM Plex Sans', 'sans-serif'],
      },
      fontSize: {
        /* Manual §08 type scale. */
        display: ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.03em', fontWeight: '600' }],
        h1: ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['1.375rem', { lineHeight: '1.875rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        meta: ['0.8125rem', { lineHeight: '1.125rem' }],
      },
      boxShadow: {
        /* Calm elevation: the management environment must not read as dramatic. */
        surface: '0 1px 2px 0 hsl(257 27% 10% / 0.04)',
        raised: '0 4px 16px -6px hsl(257 27% 10% / 0.12)',
        protected: '0 24px 60px -28px hsl(257 27% 10% / 0.55)',
        violet: '0 6px 18px -6px hsl(251 63% 59% / 0.45)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
