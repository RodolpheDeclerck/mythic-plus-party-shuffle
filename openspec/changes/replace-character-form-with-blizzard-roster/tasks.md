## 1. Auth0 configuration (manual, no code)

- [ ] 1.1 Set the Battle.net connection to "Connected Accounts for Token Vault" with upstream scope `wow.profile`
- [ ] 1.2 Create a Custom API Client authorized for the federated-connection token-exchange grant; record `client_id`/`client_secret`
- [ ] 1.3 Enable/verify the Connected Accounts enrollment flow and capture the enrollment endpoint/redirect for first-time linking
- [ ] 1.4 Confirm whether the access or refresh Auth0 token is accepted as `subject_token` in this tenant

## 2. Backend config

- [x] 2.1 Add config keys via `ConfigModule`: Token Vault `client_id`/`client_secret`, `connection` name, and `blizzard.region=us` / `blizzard.apiHost` / `blizzard.namespace=profile-us`
- [x] 2.2 Update the API `.env.example` and API README with the new variables (no secrets committed)

## 3. Backend — Token Vault service

- [x] 3.1 Create `blizzard` module skeleton (module, service, controller) under `src/modules/blizzard`
- [x] 3.2 Implement `TokenVaultService.getBlizzardToken(authToken)`: POST `/oauth/token` with the federated-connection token-exchange grant; read `issuerBaseUrl` from config
- [x] 3.3 Add a short-lived in-memory cache keyed by user for the federated token (respect `expires_in`)
- [x] 3.4 Map a "not linked / no token" exchange error to a typed result the controller can surface as a link CTA
- [x] 3.5 Unit tests: success, not-linked, expired→refreshed, exchange HTTP error

## 4. Backend — Blizzard client + mapping

- [ ] 4.1 Add `BLIZZARD_CLASS_ID_TO_ENUM` (13 classes) and `BLIZZARD_SPEC_ID_TO_ENUM` (39 specs) tables to `CharacterClass`/`Specialization`
- [ ] 4.2 Implement `BlizzardService.getCharacters()`: call Account Profile Summary (US host + namespace), return name/realm/class
- [ ] 4.3 Implement `BlizzardService.getCharacter(realm, name)`: call Character Profile Summary, return `average_item_level` + `active_spec`
- [ ] 4.4 Implement `mapToCharacter()` using the ID tables; reject unknown class/spec IDs
- [ ] 4.5 Unit tests: roster mapping, enrichment mapping, Frost disambiguation (Mage vs DK), unknown-ID rejection, empty roster

## 5. Backend — routes

- [ ] 5.1 Add `GET /api/blizzard/characters` (fixed route) guarded by `JwtAuthGuard`
- [ ] 5.2 Add `GET /api/blizzard/characters/:realm/:name` (parameterized route, declared after the fixed one)
- [ ] 5.3 Wire `blizzard` module into the app; verify guard rejects unauthenticated requests
- [ ] 5.4 Controller unit tests: auth required, list, enrich, not-linked surfaces link signal

## 6. Frontend — item level bounds

- [ ] 6.1 Widen `ITEM_LEVEL_MIN`/`ITEM_LEVEL_MAX` to current-season WoW values and re-band `ITEM_LEVEL_TIER_*`
- [ ] 6.2 Review every consumer of `ITEM_LEVEL_*` (register form clamp, roster table coloring) for the new range
- [ ] 6.3 Unit tests on the tier/coloring function with the new bounds

## 7. Frontend — link Battle.net + picker

- [ ] 7.1 Add proxy routes under `app/api/be/...` and a typed client for `GET /api/blizzard/characters` and `.../:realm/:name` (UI calls only `/api/be/...`)
- [ ] 7.2 Add a "Link Battle.net" entry point shown when the roster call returns the not-linked signal
- [ ] 7.3 Build the character picker starting from the user's v0.vercel export (pasted in at implementation time): keep the v0 JSX/Tailwind, but adapt it to the project — reuse the existing `@/components/ui/*` components (no duplicated Button/Input from the export), replace mock data with the `/api/be/...` client (7.1), route all text through i18n keys (group 8), and align colors with the project's palette. Cover roster list, loading/empty/error states, and per-character enrichment on selection
- [ ] 7.4 Build the join gate on the event-register screen: route logged-in users to the picker; route not-logged-in users to a Battle.net login screen with a "Join as guest" button below
- [ ] 7.5 Wire "Join as guest" to render the existing `EventRegisterForm` unchanged (manual form kept as the guest path)
- [ ] 7.6 On picker submit, build the existing `POST /api/characters` payload (auto-filled fields + default keystone levels); keep `role`/`bloodLust`/`battleRez` derivation server-side; confirm the join flow is unchanged after selection for both paths

## 8. i18n

- [ ] 8.1 Add EN keys (join gate, picker, Battle.net login + "Join as guest", link-account CTA, loading/empty/error) to `app/locales/en/translation.json`
- [ ] 8.2 Add matching FR keys to `app/locales/fr/translation.json`

## 9. Verification & cleanup

- [ ] 9.1 Run `cd mythic-plus-party-shuffle-ui && npx jest` and the backend test suite; all green
- [ ] 9.2 Manual end-to-end: (a) logged-in: link Battle.net → list roster → select → enrich → join; (b) guest: not-logged-in → "Join as guest" → manual form → join
- [ ] 9.3 Cleanup: remove only genuinely dead code, unused imports, and stale comments — do NOT remove the manual form (it is the guest path)
- [ ] 9.4 Update `mythic-plus-party-shuffle-ui/ARCHITECTURE.md`, add `docs/plans/NN-blizzard-roster.md` + index row, and update the relevant README
