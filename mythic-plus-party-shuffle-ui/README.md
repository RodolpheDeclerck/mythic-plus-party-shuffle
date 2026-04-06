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

Used in [`app/config/apiConfig.ts`](app/config/apiConfig.ts), [`next.config.js`](next.config.js), and the BFF route [`app/api/be/[[...path]]/route.ts`](app/api/be/[[...path]]/route.ts):

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_API_URL` | Preferred public API base (also injected at build via `next.config` `env`) |
| `REACT_APP_API_URL` | Legacy alias for the same value (CRA parity) |
| `BACKEND_URL` | Optional override for **BFF upstream** (Route Handler → Nest) and for `getSocketUrl()` |

**Browser (client):** REST uses same-origin **`/api/be`** → **BFF** (Next App Router) proxies to the Nest origin (`BACKEND_URL` or `NEXT_PUBLIC_API_URL` or `REACT_APP_API_URL`, default `http://localhost:8080`). This matches dev (`next dev` on port 3000) and production (e.g. Render).

**Server (RSC / SSR):** code that resolves `apiConfig` without `window` calls the backend **directly** via `serverBackend()` (same env vars).

**Socket.IO** always uses `getSocketUrl()` → real backend origin (not proxied through `/api/be`).

**Render:** set `BACKEND_URL` (or `NEXT_PUBLIC_API_URL`) on the **Next** service so the BFF can reach the API at **runtime** (`next start`), not only at build time.

### Deploy / Render (monorepo)

This repo is an **npm workspace**: the lockfile that matters is [`package-lock.json`](../package-lock.json) at the **repository root**. The file `mythic-plus-party-shuffle-ui/package-lock.json` is **gitignored** and is **not** deployed.

1. In Render, set **Root Directory** to **empty** (use the repo root), not `mythic-plus-party-shuffle-ui`.
2. **Build command:** `npm ci && npm run build -w mythic-plus-party-shuffle`
3. **Start command:** `npm run start -w mythic-plus-party-shuffle`
4. Use the blueprint [`render.yaml`](../render.yaml) at the **repo root** (or paste the same commands in the dashboard).
5. Set **Node 20** (e.g. env `NODE_VERSION=20.18.0` or match your `engines` field).

If Root Directory is set to `mythic-plus-party-shuffle-ui`, `npm install` runs **without** a committed lockfile there and the build can fail or drift from CI.

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
  ├─ REST: /api/be → Next Route Handler (BFF) → Nest (BACKEND_URL / NEXT_PUBLIC_* )
  └─ Socket.IO: direct to getSocketUrl() (same origin resolution as BACKEND_URL / NEXT_PUBLIC_* )

Server (Next RSC, etc.)
  └─ REST: direct to serverBackend() when apiConfig is used without window
```

More detail: [`ARCHITECTURE.md`](ARCHITECTURE.md) (event page / `EventView` flow).

## Security note

Auth tokens are stored in **`localStorage`** for API calls (see axios setup). That matches many SPAs but is **XSS-sensitive**; httpOnly cookies issued by the API would be a hardening path. No credentials belong in this repo.

## Stack

Next.js 14, React 18, TypeScript, Tailwind CSS, i18next, axios, socket.io-client, react-dnd, Radix UI primitives (shadcn-style components).

## CI

GitHub Actions runs lint, `test:ci`, and `npm run build` on push/PR to `main` and `next` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).
