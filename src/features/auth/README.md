# Auth feature

Login, logout, session bootstrap, role-based permission helpers.

Structure (when implemented):

```
auth/
├── api/           # auth.api.ts — login/logout/me endpoints
├── components/    # LoginForm, AuthGuard helpers
├── hooks/         # useLogin, useLogout, useMe
├── schemas/       # zod schemas for login/register payloads
└── index.ts
```
