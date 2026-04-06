# Mythic Plus Party Shuffle — UI

Next.js (App Router) front-end for organizing Mythic+ runs: event codes, character signup, admin party grid, shuffle, and live updates over Socket.IO.

## Requirements

- **Node.js** 20.x (LTS recommended)
- **npm** 9+

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Development server ([http://localhost:3000](http://localhost:3000)) |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint (Next) |
| `npm test` | Jest (watch in dev) |
| `npm run test:ci` | Jest once, CI-friendly |
| `npm run format` | Prettier (see `package.json` globs) |

## Environment variables

Used in [`app/config/apiConfig.ts`](app/config/apiConfig.ts) and [`next.config.js`](next.config.js):

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_API_URL` | Preferred public API base (also injected at build via `next.config` `env`) |
| `REACT_APP_API_URL` | Legacy alias for the same value (CRA parity) |
| `BACKEND_URL` | Optional override for **server-side** rewrite target and `getSocketUrl()` |

**Development:** REST calls go directly to `serverBackend()` (default `http://localhost:8080` if unset).

**Production (browser):** REST uses same-origin **`/api/be`** → rewritten to `BACKEND_URL` / `NEXT_PUBLIC_API_URL` / `REACT_APP_API_URL` (see `rewrites` in `next.config.js`). **Socket.IO** always uses `getSocketUrl()` → real backend origin (not proxied).

Optional branding:

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_LOGIN_BACKGROUND_URL` | Login/portal background image URL (default `public/background.png`) — [`app/config/loginBackground.ts`](app/config/loginBackground.ts) |

Do **not** commit secrets. For production builds, ensure `NEXT_PUBLIC_API_URL` (or equivalent) is not `localhost` or the app will log a configuration warning.

## Backend

This repository is **UI only**. Run the API separately (e.g. sibling repo **mythic-plus-party-shuffle-api-nest** or your own backend) on the origin you configure above.

## Architecture (short)

```text
Browser
  ├─ REST: dev → API origin | prod browser → /api/be → Next rewrites → API
  └─ Socket.IO: direct to getSocketUrl() (same origin resolution as BACKEND_URL / NEXT_PUBLIC_* )
```

More detail: [`ARCHITECTURE.md`](ARCHITECTURE.md) (event page / `EventView` flow).

## Security note

Auth tokens are stored in **`localStorage`** for API calls (see axios setup). That matches many SPAs but is **XSS-sensitive**; httpOnly cookies issued by the API would be a hardening path. No credentials belong in this repo.

## Stack

Next.js 14, React 18, TypeScript, Tailwind CSS, i18next, axios, socket.io-client, react-dnd, Radix UI primitives (shadcn-style components).

## CI

GitHub Actions runs lint, `test:ci`, and `npm run build` on push/PR to `main` and `next` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).
