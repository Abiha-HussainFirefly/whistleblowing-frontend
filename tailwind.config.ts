import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'bg-blue-50',
    'text-blue-600',
    'dark:bg-blue-900/40',
    'dark:text-blue-400',
    'bg-amber-50',
    'text-amber-600',
    'dark:bg-amber-900/40',
    'dark:text-amber-400',
    'bg-green-50',
    'text-green-600',
    'dark:bg-green-900/40',
    'dark:text-green-400',
    'bg-purple-50',
    'text-purple-600',
    'dark:bg-purple-900/40',
    'dark:text-purple-400',
    'bg-emerald-50',
    'text-emerald-600',
    'dark:bg-emerald-900/40',
    'dark:text-emerald-400',
    'bg-red-50',
    'text-red-600',
    'dark:bg-red-900/40',
    'dark:text-red-400',
    'bg-indigo-50',
    'text-indigo-600',
    'dark:bg-indigo-900/40',
    'dark:text-indigo-400',
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
        /* Brand palette. `primary`/`accent` follow the active org's white-label
           CSS variables (set at runtime by lib/theme.ts). They use the "H S% L%"
           channel vars so Tailwind opacity modifiers work (bg-brand-primary/30).
           The named navy/teal stay static (e.g. for charts). */
        brand: {
          DEFAULT: 'hsl(var(--brand-primary-hsl) / <alpha-value>)',
          primary: 'hsl(var(--brand-primary-hsl) / <alpha-value>)',
          accent: 'hsl(var(--brand-accent-hsl) / <alpha-value>)',
          navy: '#042148',
          'navy-dark': '#032147',
          teal: '#007f8a',
          'teal-dark': '#00666e',
        },
        /* "Viewing data for" scope-banner surface + text, sourced from the
           --banner-* CSS tokens (globals.css) so the colour lives in one place
           instead of inline hex across the litigation/contracts/compliance UIs. */
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
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
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
