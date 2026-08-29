import { type ReactElement } from 'react';
import { cn } from '@lib/utils';

/**
 * Animated illustration for the reporter rail.
 *
 * It restates the logo's own idea rather than inventing a new metaphor: two
 * guardrails form a protected corridor, the negative space between them is the
 * reporter (identity is not the visible object in the system), and an amber
 * signal travels up and out — the concern being carried forward.
 *
 * Deliberately NOT a padlock, a whistle, a megaphone or a police shield. The
 * brand manual rules those out: this should read as a protected channel, not a
 * surveillance or enforcement product.
 *
 * Inline SVG with CSS animation, so it costs no network request, inherits the
 * theme's colours, scales cleanly, and stops entirely under
 * `prefers-reduced-motion` via the global guard in globals.css.
 */
export function ProtectedChannelArt({ className }: { className?: string }): ReactElement {
  return (
    <div className={cn('relative isolate mx-auto w-full max-w-[13rem]', className)}>
      {/* Ambient wash behind the mark — slow, wide, barely-there. */}
      <div
        aria-hidden="true"
        className="animate-drift pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl"
        style={{
          background:
            'radial-gradient(circle at 50% 55%, hsl(251 63% 59% / 0.28), transparent 68%)',
        }}
      />

      <svg
        viewBox="0 0 200 150"
        fill="none"
        role="img"
        aria-label="A concern travelling safely through a protected channel"
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="tlr-rail-left" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(281 31% 40%)" />
            <stop offset="100%" stopColor="hsl(281 31% 26%)" />
          </linearGradient>
          <linearGradient id="tlr-rail-right" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(251 70% 68%)" />
            <stop offset="100%" stopColor="hsl(251 63% 55%)" />
          </linearGradient>
          <linearGradient id="tlr-floor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(251 63% 59%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(251 63% 59%)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(251 63% 59%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Expanding rings — the signal being heard, repeating calmly. */}
        <g style={{ transformOrigin: '100px 62px' }}>
          <circle
            cx="100"
            cy="62"
            r="34"
            stroke="hsl(36 66% 54%)"
            strokeWidth="1.25"
            opacity="0.5"
            style={{
              transformOrigin: '100px 62px',
              animation: 'tellara-pulse-ring 3.6s ease-out infinite',
            }}
          />
          <circle
            cx="100"
            cy="62"
            r="34"
            stroke="hsl(36 66% 54%)"
            strokeWidth="1.25"
            opacity="0.5"
            style={{
              transformOrigin: '100px 62px',
              animation: 'tellara-pulse-ring 3.6s ease-out infinite',
              animationDelay: '1.8s',
            }}
          />
        </g>

        {/* The corridor floor. */}
        <rect x="34" y="120" width="132" height="2.5" rx="1.25" fill="url(#tlr-floor)" />

        {/* Left guardrail — Protected Plum. */}
        <g style={{ animation: 'tellara-float 6s ease-in-out infinite' }}>
          <path
            d="M56 40h26a14 14 0 0 1 14 14v0a14 14 0 0 1-14 14H70v40a14 14 0 0 1-14 14v0a14 14 0 0 1-14-14V54a14 14 0 0 1 14-14Z"
            fill="url(#tlr-rail-left)"
          />
        </g>

        {/* Right guardrail — Signal Violet. Mirrored, offset in phase so the
            pair feels alive rather than mechanically synchronised. */}
        <g
          style={{
            animation: 'tellara-float 6s ease-in-out infinite',
            animationDelay: '-3s',
          }}
        >
          <path
            d="M144 26v68a14 14 0 0 1-14 14h-26a14 14 0 0 1-14-14v0a14 14 0 0 1 14-14h12V26a14 14 0 0 1 14-14v0a14 14 0 0 1 14 14Z"
            fill="url(#tlr-rail-right)"
          />
        </g>

        {/* The amber signal, rising through the protected space. */}
        <g style={{ animation: 'tellara-signal-travel 3.6s ease-in-out infinite' }}>
          <rect x="97.5" y="66" width="5" height="34" rx="2.5" fill="hsl(36 66% 54%)" />
          <circle cx="100" cy="62" r="11" fill="hsl(36 70% 58%)" />
          <circle cx="96.5" cy="58.5" r="3.5" fill="hsl(38 92% 76%)" opacity="0.85" />
        </g>
      </svg>
    </div>
  );
}
