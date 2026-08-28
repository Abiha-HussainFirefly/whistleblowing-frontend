# Civorah Whistleblowing frontend

React/Vite front end for the standalone Civorah whistleblowing backend. It contains no runtime import or symlink to `Q:\Civorah`, and it is strictly organization scoped.

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
