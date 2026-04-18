# Claude Code — Project Rules

## Language

Communicate in **French** with the user. Code, comments, and commit messages in **English**.

## Multi-PC Workflow

L'utilisateur travaille sur ce projet depuis **plusieurs PC différents**. Conséquences à toujours prendre en compte :

- **Mémoire Claude Code locale** (`~/.claude/projects/.../memory/`) : ne pas supposer qu'une mémoire écrite sur une machine existe ailleurs. Les règles importantes doivent vivre dans ce `CLAUDE.md` (versionné) et non dans la mémoire locale.
- **Settings Claude** : privilégier `.claude/settings.json` (versionné) plutôt que `.claude/settings.local.json` pour toute config qui doit être partagée entre PC.
- **État local non versionné** : `.env`, `node_modules`, DB locale Postgres/Redis, builds, worktrees, branches locales peuvent différer d'un PC à l'autre. Vérifier leur existence avant de s'appuyer dessus.
- **Avant de référencer un état "précédent"** (fichier local, branche, mémoire), vérifier qu'il est présent sur la machine actuelle.

## PR Checklist

Every PR that adds or modifies behavior **must** include:

1. **Tests** — unit tests covering new/changed logic (nominal, edge, error cases). Run `cd mythic-plus-party-shuffle-ui && npx jest` to verify all pass.
2. **Plan** — `docs/plans/NN-kebab-case.md` for non-trivial changes. Follow the existing format (see `docs/plans/01-argon2-password-hashing.md`).
3. **Plans index** — add a row in `docs/plans/README.md`.
4. **Architecture** — update `mythic-plus-party-shuffle-ui/ARCHITECTURE.md` if data models, hooks, or app flows change.
5. **README** — update the relevant README if config, deployment, or visible behavior changes.
6. **Pre-PR cleanup** — before committing, verify: no dead imports, no stale comments referencing removed code/patterns, no orphan files, no unused dependencies.

## Commits

- Follow Conventional Commits: `type(scope): description`.
- Include `Plan:` line + bullet points in the body when a plan exists (see `.cursor/rules/commits-and-plans.md`).
- Include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` in commit messages.

## Code Style

- **UI tests**: Jest, `describe`/`it` (not `test()`), inline factory functions, `@/` path aliases.
- **No unnecessary abstractions**: don't create helpers/utilities for one-time operations.
- **Imports**: use `import type` for type-only imports; use shared utilities (e.g., `playerGroupRoleIcons`) instead of duplicating logic.
- **Translations**: every user-facing string must have keys in both `app/locales/en/translation.json` and `app/locales/fr/translation.json`.

## Project Structure

- `mythic-plus-party-shuffle-ui/` — Next.js frontend (React, TypeScript, Tailwind).
- `mythic-plus-party-shuffle-api-nest/` — NestJS backend (TypeScript, Redis, PostgreSQL).
- `docs/plans/` — versioned implementation plans.

## Stack technique

- **Frontend** : Next.js (App Router), TypeScript, Socket.IO client
- **Backend** : NestJS, Prisma, PostgreSQL, Redis (ioredis), Socket.IO
- **Proxy API** : `app/api/be/[[...path]]/route.ts` — tout le trafic UI passe par ce reverse proxy vers `http://localhost:8080` (ou `BACKEND_URL`)

## Architecture Rules — NEVER VIOLATE

1. **Schema changes via Prisma Migrate only.** Run `npx prisma migrate dev` to create migrations. Never edit the database schema manually.
2. **`Party` is NOT a SQL entity.** The `Party` model is an application model serialized as JSON in Redis (`party:{eventCode}`). Never create a SQL table for parties.
3. **Use `PartyFacade` for shuffle.** `EventModule` uses `PartyFacade` (`shared/facade/party.facade.ts`) — never call `PartyService` directly from `EventModule`.
4. **Fixed routes before parameterized routes in NestJS controllers.** E.g., `/api/characters` before `/api/characters/:id`.
5. **`RedisModule` is global.** Don't re-import `RedisModule` in child modules — the `REDIS_CLIENT` token is available everywhere via injection.
6. **UI client consumes only `/api/be/...`.** Never call the backend directly from the frontend.
7. **Environment variables via `ConfigModule`** — never use `process.env` directly in services.

---

> **Detailed reference** (entities, routes, algorithm, domain): see [`docs/CLAUDE-REFERENCE.md`](docs/CLAUDE-REFERENCE.md)
