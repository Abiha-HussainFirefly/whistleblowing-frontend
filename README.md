# Tellara Whistleblowing frontend

React/Vite front end for the standalone Tellara whistleblowing backend. It is strictly organization scoped.

## Setup

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` (normally `http://localhost:3001/api/v1`).
2. Run `npm install` and `npm run dev`.

## Routes

- `/` — whistleblowing dashboard and authorized live summary.
- `/login` — investigator/internal organization sign in.
- `/cases`, `/cases/:id` — permission-aware internal case register and case console.
- `/report` or `/report/:slug` — public anonymous/named report submission.
- `/report/credentials` — one-time case reference/password display.
- `/report/track`, `/report/case` — reporter case login, status, and follow-up messages.

The UI calls real backend APIs only. Internal tokens are kept separate from reporter tokens, and reporter requests only send their case-scoped token. Permission checks control visible controls, while the backend remains authoritative for authorization. The layout switches tables, navigation, filters, and detail fields into usable mobile layouts at small viewports.

## Design system

The UI implements the Tellara Brand & Product Experience Manual v2.0.

### Palette

Every colour resolves through a CSS variable in `src/globals.css`, so an
organization's white-label theme can override the brand layer at runtime
(`src/lib/theme.ts`) without a rebuild.

| Token | Hex | Role | Contrast on white |
|---|---|---|---|
| `ink` | `#171321` | Primary text, dark surfaces (rails, auth panel) | 18.24:1 |
| `plum` | `#4B2E58` | Brand authority, protected states | 11.47:1 |
| `signal` | `#6F56D9` | Primary actions, links, focus ring | 5.24:1 |
| `courage` | `#D79A3E` | Attention, reporter signal — **accent only** | 2.45:1 |
| `porcelain` | `#F7F4F0` | Warm application background | — |
| `moss` | `#3F7564` | Resolved / positive state | 5.33:1 |

Target UI ratio: 60% Porcelain / 18% Ink / 10% Plum / 8% Signal / 4% Courage.

Signal Violet and Courage Amber are named for their brand qualifier rather than
their hue: exposing them as `violet` / `amber` would replace Tailwind's built-in
scales of the same name (`extend.colors` merges only one level deep) and
silently break every existing `bg-amber-50` in the app.

Courage Amber fails AA against white (2.45:1). Use it on Ink, or as a mark —
never as small text on a light surface.

### Typography

IBM Plex Sans for UI, IBM Plex Mono for case identifiers and return keys
(`.case-id` / `.case-key` — so 0/O and 1/l stay distinguishable when a reporter
transcribes them by hand), and Noto Nastaliq Urdu for the `ur` locale.

Scale utilities: `.type-display` 40/48 · `.type-h1` 30/38 · `.type-h2` 22/30 ·
`.type-body` 16/24 · `.type-meta` 13/18.

### State semantics

Status, severity and action are three different things, and the UI keeps them
visually separate so a case is not prejudged before it is investigated:

- `StatusPill` (`components/ui/status-pill.tsx`) — where a case sits in the
  workflow. A rounded pill, always colour **plus** icon **plus** text.
- `SeverityMeter` — how urgent it is. A stepped meter, deliberately a different
  shape so severity can never be misread as workflow status.

`STATE_TONE_COLOR` in the chart palette keys off the same tones, so a status
donut and the pills beside it never disagree about what a state looks like.

### Voice

Copy follows the manual's microcopy table. In particular the UI never claims
absolute anonymity — it says you are not required to provide your identity — and
never describes a case as "rejected" or a person as "accused".
