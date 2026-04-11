# Claude Code — Project Rules

## Language

Communicate in **French** with the user. Code, comments, and commit messages in **English**.

## PR Checklist

Every PR that adds or modifies behavior **must** include:

1. **Tests** — unit tests covering new/changed logic (nominal, edge, error cases). Run `cd mythic-plus-party-shuffle-ui && npx jest` to verify all pass.
2. **Plan** — `docs/plans/NN-kebab-case.md` for non-trivial changes. Follow the existing format (see `docs/plans/01-argon2-password-hashing.md`).
3. **Plans index** — add a row in `docs/plans/README.md`.
4. **Architecture** — update `mythic-plus-party-shuffle-ui/ARCHITECTURE.md` if data models, hooks, or app flows change.
5. **README** — update the relevant README if config, deployment, or visible behavior changes.

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

---

## Stack technique

- **Frontend** : Next.js (App Router), TypeScript, Socket.IO client
- **Backend** : NestJS, TypeORM, PostgreSQL, Redis (ioredis), Socket.IO
- **Proxy API** : `app/api/be/[[...path]]/route.ts` — tout le trafic UI passe par ce reverse proxy vers `http://localhost:8080` (ou `BACKEND_URL`)

---

## Architecture Rules — NEVER VIOLATE

1. **`synchronize: false` — always.** Schema changes go through SQL migrations in `migrations/`. Never let TypeORM auto-sync the schema.
2. **`Party` is NOT a SQL entity.** The `Party` model is an application model serialized as JSON in Redis (`party:{eventCode}`). Never create a SQL table for parties.
3. **Use `PartyFacade` for shuffle.** `EventModule` uses `PartyFacade` (`shared/facade/party.facade.ts`) — never call `PartyService` directly from `EventModule`.
4. **Fixed routes before parameterized routes in NestJS controllers.** E.g., `/api/characters` before `/api/characters/:id`.
5. **`RedisModule` is global.** Don't re-import `RedisModule` in child modules — the `REDIS_CLIENT` token is available everywhere via injection.
6. **UI client consumes only `/api/be/...`.** Never call the backend directly from the frontend.
7. **Environment variables via `ConfigModule`** — never use `process.env` directly in services.

---

## NestJS Module Structure

```
AppModule
├── ConfigModule (global, .env)
├── TypeOrmModule (PostgreSQL, JS migrations)
├── RedisModule (global, REDIS_CLIENT)
├── WebSocketModule (gateway + WebSocketService)
├── AuthModule (JWT + Passport + RateLimitService)
├── UserModule
├── CharacterModule (depends: WebSocketModule, PartyModule)
├── EventModule (depends: PartyModule, WebSocketModule, PartyFacade)
├── PartyModule (depends: RedisModule, WebSocketModule)
└── MetadataModule (static WoW data, no DB entity)
```

### Key Files

- Nest root: `src/app.module.ts`, `src/main.ts`
- Shuffle & Redis: `src/modules/party/party.service.ts`, `src/modules/party/party.controller.ts`
- Facade: `src/shared/facade/party.facade.ts`
- Entities: `src/shared/entities/*.entity.ts`
- WS Gateway: `src/shared/websocket/`
- Event UI: `app/event/page.tsx`, `app/components/EventView/EventView.tsx`

---

## TypeORM Entities

### `User` (`users`)
- Sensitive fields with `select: false`: `password`, `salt`, `sessionToken`
- Relations: `eventsCreated` (1-n), `eventsAdmin` (M2M via `event_admins` table)

### `AppEvent` (`events`)
- `code`: truncated UUID generated in `@BeforeInsert`, unique, main business key in Redis and routes
- `admins`: M2M with `User` via `event_admins` table
- `arePartiesVisible`: boolean flag controlling party visibility

### `Character` (default TypeORM table)
- Enums: `CharacterClass`, `Specialization`, `Role`
- Flags: `bloodLust`, `battleRez`
- Key range: `keystoneMinLevel`, `keystoneMaxLevel`
- Linked to event via `eventCode` -> `AppEvent.code` (logical FK)

### `Party` (Redis only — no SQL table)
- Model: `{ id: string, members: Character[] }`
- Redis key: `party:{eventCode}` (JSON array of Party)
- History: `partyShuffleHistory:{eventCode}` (last 3 shuffles for anti-repetition)

---

## Redis Usage

| Usage | Key | Operations |
|-------|-----|------------|
| Auth rate limiting | keys per IP/action | `INCR`, `EXPIRE`, `TTL` |
| Party state | `party:{eventCode}` | GET/SET JSON |
| Shuffle history | `partyShuffleHistory:{eventCode}` | Last 3 results |

---

## HTTP API — Main Routes

| Route | Module |
|-------|--------|
| `POST /auth/login`, `/auth/register`, `/auth/logout` | AuthModule |
| `GET /auth/me`, `/auth/verify-token` | AuthModule |
| `GET/PATCH/DELETE /api/users/:id` | UserModule |
| `GET/POST /api/events` | EventModule |
| `GET/PUT/DELETE /api/events/:eventCode` | EventModule |
| `GET/POST/DELETE /api/events/:eventCode/parties` | PartyModule |
| `POST /api/events/:eventCode/shuffle-parties` | EventModule via PartyFacade |
| `PATCH /api/events/:eventCode/setPartiesVisibility` | EventModule |
| `GET/POST/PUT /api/characters` | CharacterModule |
| `GET /api/metadata/classes` | MetadataModule |

---

## Next.js App Router

| URL | Notes |
|-----|-------|
| `/event?code=` | Event view via **query param**, no `[eventCode]` dynamic segment |
| `/dashboard` | User dashboard |
| `/event/create` | Event creation |

---

## Real-time (Socket.IO)

Events emitted by `WebSocketService` after each mutation:
- `event-updated` -> event mutation
- `parties-updated` -> shuffle or Redis party modification
- `character-updated` -> character mutation

---

## WoW Domain — Roles & Composition

### Roles (derived from `Specialization` via `SpecializationDetails`)

| Role | Group constraint |
|------|-----------------|
| `TANK` | 1 required (standard mode) |
| `HEAL` | 1 required, at most 1 per group |
| `CAC` | Melee DPS — balanced distribution |
| `DIST` | Ranged DPS — balanced distribution |

### Special Flags
- **`bloodLust`**: can cast Bloodlust/Heroism — excludes tanks
- **`battleRez`**: can combat resurrect — excludes tanks

---

## Shuffle Algorithm (`PartyService.shuffleGroups`)

### DPS-only mode (0 tank AND 0 heal)
Groups of 5 DPS — BR/BL distribution first, then fill.

### Standard mode
1. Number of groups derived from available tanks/heals and total size
2. Assignment priority: Tank -> Heal -> Battle Rez -> Bloodlust -> balanced CAC/DIST -> fill DPS to 5
3. Extra groups for remaining players

### Key compatibility
- Filter on `keystoneMinLevel` / `keystoneMaxLevel`: strict window -> tolerance -> fallback
- `checkGroupQuality`: warning if spread > 4 in a group (group remains valid)

### Anti-repetition
- `calculateRedundancyScore` + `optimizeGlobalDistribution`
- Swaps same-role members between groups
- Based on `partyShuffleHistory:{eventCode}` (last 3 shuffles in Redis)

---

## Known WoW Edge Cases

| Situation | Behavior |
|-----------|----------|
| 0 tank AND 0 heal | DPS-only mode |
| More tanks than groups | Some tanks play as DPS |
| Incomplete group (< 5) | Partial group valid, no error |
| Key spread > 4 | Warning returned, group still valid |
| No BR / no BL | Constraint ignored, groups created normally |

---

## What the Algorithm Does NOT Handle
- No class composition optimization
- No weekly affix consideration
- No SQL party history — Redis only (lost if Redis restarts)
- No loot or progression management

---

## Domain Vocabulary

| Term | Definition |
|------|-----------|
| **ilvl** | Item Level — gear power |
| **Keystone / key** | Stone determining difficulty level |
| **Mythic+** | Timed dungeon mode with increasing difficulty |
| **Lust / BL** | Bloodlust/Heroism — major speed buff |
| **BR** | Battle Rez — in-combat resurrection |
| **Shuffle** | Party generation (or regeneration) |
| **EventCode** | Truncated UUID, main business key |
| **Party** | Group of 5 players (Redis, not SQL) |
