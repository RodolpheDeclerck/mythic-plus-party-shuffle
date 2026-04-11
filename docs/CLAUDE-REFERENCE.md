# Claude Code — Project Reference

> This file contains detailed architecture and domain context. It is NOT loaded automatically — Claude reads it on demand when working on related areas.

---

## NestJS Module Structure

```
AppModule
├── ConfigModule (global, .env)
├── PrismaModule (global, PostgreSQL via Prisma)
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
- Prisma schema: `prisma/schema.prisma`
- Prisma service: `src/shared/prisma/prisma.service.ts`
- WS Gateway: `src/shared/websocket/`
- Event UI: `app/event/page.tsx`, `app/components/EventView/EventView.tsx`

---

## Prisma Models (`prisma/schema.prisma`)

### `User` (`users`)
- Sensitive fields excluded via `select` in queries: `password`, `salt`, `sessionToken`
- Relations: `eventsCreated` (1-n Event), `adminOf` (1-n EventAdmin)

### `Event` (`events`)
- `code`: truncated UUID generated in `EventService.createEvent()`, unique, main business key
- `admins`: via explicit `EventAdmin` join model (flattened to `User[]` by `EventService.flattenAdmins()`)
- `arePartiesVisible`: boolean flag controlling party visibility

### `Character` (`character`)
- Enums from `@prisma/client`: `CharacterClass`, `Specialization`, `Role`
- Flags: `bloodLust`, `battleRez`
- Key range: `keystoneMinLevel`, `keystoneMaxLevel`
- Linked to event via `eventCode` -> `Event.code` (FK)

### `EventAdmin` (`event_admins`)
- Explicit join model for Event ↔ User M2M
- Composite PK: `(eventId, userId)`

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
