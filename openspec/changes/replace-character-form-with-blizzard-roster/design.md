## Context

Players authenticate via **Auth0 (OIDC)**. The NestJS backend validates the Auth0 JWT (`jwt.strategy.ts`) and provisions a local `User` keyed on `oidcSub`. Characters are stored in PostgreSQL via Prisma and attached to an `Event` by `eventCode`; there is **no `userId` link** on `Character` today.

Registration currently happens through `EventRegisterForm` + `useEventRegisterForm`, which collect every field by hand and `POST /api/characters`. The backend derives `role`, `bloodLust`, `battleRez` from `SpecializationDetails` keyed by the `Specialization` enum.

The Auth0 tenant already has a **Battle.net** connection and exposes **Token Vault** ("Connected Accounts"), confirmed in the dashboard. Token Vault stores and auto-refreshes a federated Blizzard token, retrievable by the backend through an OAuth 2.0 token-exchange call to `/oauth/token`.

This design covers a new external dependency (Blizzard Profile APIs), a cross-cutting backend module, and a UI replacement — hence a dedicated design doc.

## Goals / Non-Goals

**Goals:**
- Let a logged-in user link Battle.net once and join an event by **picking** a WoW character with fields auto-filled.
- Keep `POST /api/characters` and the `Character` model **unchanged** (no DB migration).
- Make class/spec mapping **locale-independent** and robust against the "Frost" collision (Mage vs Death Knight).
- Keep Blizzard API usage economical (enrich iLevel/spec **on selection**, not for the whole roster).

**Non-Goals:**
- Removing the manual registration form — it is **kept** as the guest path (not-logged-in users).
- Multi-region support (only **US** for now; structure the code so region is a single config point).
- Persisting Blizzard tokens in our DB (Token Vault owns storage + refresh).
- Linking `Character` rows to `User` (ownership) — out of scope here.
- Changing the shuffle algorithm or keystone semantics.

## Decisions

### D1 — Use Auth0 Token Vault token-exchange (not a custom Battle.net OAuth flow)
The backend exchanges the user's Auth0 token for a Blizzard token:
```
POST https://{issuerBaseUrl}/oauth/token
grant_type           = urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token
subject_token        = <Auth0 access/refresh token>
subject_token_type   = urn:ietf:params:oauth:token-type:access_token
requested_token_type = http://auth0.com/oauth/token-type/federated-connection-access-token
connection           = battlenet
client_id/secret     = <Custom API Client>
```
Response carries `access_token` (Blizzard Bearer) + `expires_in`. **Why over a dedicated NestJS Battle.net OAuth flow (Option B):** Auth0 handles consent, storage, and refresh; the backend stores nothing secret beyond the Custom API Client credentials (via `ConfigModule`). Trade-off: depends on Auth0 Token Vault availability — already confirmed present.

### D2 — Map on Blizzard **IDs**, not localized names
Blizzard returns `character_class.id` / `active_spec.id`, stable across locales; the `.name` is localized ("Sacré" vs "Holy"). A new `BLIZZARD_CLASS_ID_TO_ENUM` (13) and `BLIZZARD_SPEC_ID_TO_ENUM` (39) table maps directly to the Prisma `CharacterClass` / `Specialization` enums. **Why:** avoids forcing `locale=en_US`, and resolves the "Frost" ambiguity by construction (spec_id 64 = Mage_Frost, 251 = DeathKnight_Frost). The existing `WOW_CLASS_SPEC_TO_KEY` / `toApiCharacterClass` stay for the UI display layer; the new ID tables are the source of truth for persistence.

### D3 — Two-call enrichment, lazy on selection
`GET /api/blizzard/characters` returns the **Account Profile Summary** roster (name, realm, class id, level, faction) — light, one call. `GET /api/blizzard/characters/:realm/:name` calls the **Character Profile Summary** to add `average_item_level` + `active_spec`, only when the user clicks a character. **Why:** a 50-character account would otherwise cost N+1 calls upfront. iLevel uses `average_item_level`.

### D4 — Reuse `POST /api/characters` verbatim
The picker builds the same payload the manual form built: `name`, `characterClass`, `specialization`, `iLevel`, `eventCode`, plus `keystoneMinLevel`/`keystoneMaxLevel` set to existing defaults. `role`/`bloodLust`/`battleRez` are still derived server-side from `SpecializationDetails`. **Why:** zero backend contract change, smallest blast radius, nothing downstream changes.

### D5 — Widen iLevel bounds (Retail / The War Within)
Current `ITEM_LEVEL_MIN=240`/`MAX=290` would clamp real values (~600–680) and corrupt the auto-filled iLevel. Target is **Retail (The War Within)**. Bounds set to **MIN=600 / MAX=700** (season-tight for readable color bands, per product choice over wide+headroom), with re-banded tiers **TIER_HIGH=675 / TIER_MID=650 / TIER_LOW=625** (quarters of the interval). **Why:** the auto-fill is meaningless if the value is clipped. Trade-off: a future season above 700 will require bumping these constants.

### D6 — Join gate routes by auth state; the manual form stays as the guest path
The event-register screen becomes a **gate**: logged-in users get the Blizzard picker; not-logged-in users get a Battle.net login screen with a **"Join as guest"** button underneath. Choosing guest renders the **existing `EventRegisterForm` unchanged**. **Why over removing the form:** guests (users without a Battle.net link, or who decline to log in) must still be able to join; the manual form already satisfies this and both paths share the same `POST /api/characters`. Trade-off: two registration UIs to maintain, but the backend contract and the form code are untouched, so the cost is only the gate + the picker.

### D7 — New backend module `blizzard`, routes under `/api/blizzard`
`TokenVaultService` (token exchange + short-lived in-memory cache keyed by user), `BlizzardService` (HTTP client + ID→enum mapping), `BlizzardController` (routes guarded by `JwtAuthGuard`). Region/host are single config values (`blizzard.region=us`, `blizzard.apiHost`, `blizzard.namespace=profile-us`). Fixed routes before parameterized routes per project rule.

## Risks / Trade-offs

- **Token Vault enrollment is a separate flow** → The token-exchange only works after the user has *linked* Battle.net (Connected Accounts). Mitigation: add an explicit "Link Battle.net" entry point; detect "not linked / no token" from the exchange error and surface a link CTA instead of a generic failure.
- **Custom API Client secret in backend config** → Mitigation: via `ConfigModule` only (never `process.env` in services), not committed; documented in API README/env example.
- **Blizzard rate limits / latency on selection** → Mitigation: lazy enrichment (D3), surface a per-character loading + retry state; cache the federated token for its `expires_in` window.
- **iLevel rebanding affects existing UI coloring** → Mitigation: review every consumer of `ITEM_LEVEL_*` when widening; covered by unit tests on the tier function.
- **Region hardcoded to US** → Mitigation: isolate region behind config so EU/multi-region is an additive change, not a rewrite. Log when a roster comes back empty (likely wrong-region account).
- **"Devourer" / non-real specs in legacy maps** → Harmless: Blizzard never returns them; ID tables only contain real specs.
- **Auth0 token as `subject_token`** → Confirm whether access or refresh token is accepted in our tenant; both are documented. Validate during implementation against a test link.

## Migration Plan

1. Auth0 (manual, no code): set Battle.net connection to *Connected Accounts for Token Vault* with `wow.profile`; create the Custom API Client authorized for the federated token-exchange grant; enable Connected Accounts enrollment.
2. Ship backend `blizzard` module behind the existing auth guard; add config keys with safe defaults.
3. Ship the join gate + UI picker; the gate routes logged-in users to the picker and not-logged-in users to the Battle.net login screen with a "Join as guest" button that renders the existing manual form. The manual form code is kept permanently as the guest path.
4. Rollback: bypass the gate so the register entry point goes straight to the manual form (backend `POST /api/characters` is untouched, so no data rollback needed).

## Resolved Decisions (from exploration)

- **subject_token**: use the **access token** already present on the incoming request as `subject_token`. `TokenVaultService.getBlizzardToken(authToken)` takes the token as a parameter, so switching to a refresh-token exchange later is a caller change, not a rewrite.
- **iLevel bounds**: Retail (TWW), **MIN=600 / MAX=700**, tiers **675 / 650 / 625** (see D5).

## Open Questions

- Exact Connected Accounts **enrollment** endpoint/redirect for first-time linking (My Account API) — to confirm at implementation; does not affect the module architecture.
- Whether the access-token exchange is accepted as-is in the tenant — to verify by the user at first link (task 1.4); the flexible signature de-risks this.
