## Why

Registering for an event today means manually retyping a character's name, class, specialization and item level — data that already lives on the player's Battle.net account. This is tedious and error-prone (wrong spec, stale iLevel, typos). Since players already authenticate through Auth0, and Auth0 now exposes a **Token Vault** that can store and refresh a federated Battle.net token, we can fetch the player's real World of Warcraft roster and let them join an event by simply picking a character.

## What Changes

- Add a **Battle.net "Connected Account"** flow via Auth0 Token Vault so a logged-in user can link their Battle.net account once (scope `wow.profile`).
- New backend **`blizzard` module** (NestJS) that:
  - exchanges the Auth0 token for a federated Blizzard access token via Token Vault (`/oauth/token` token-exchange grant);
  - lists the user's characters from the Blizzard **Account Profile Summary** (region **US** for now);
  - enriches a selected character with **iLevel + active spec** from the **Character Profile Summary** (called on selection, not for the whole list);
  - maps Blizzard **class/spec IDs** (locale-independent) to the existing Prisma `CharacterClass` / `Specialization` enums.
- Add a **join gate** on the event-register screen that routes the user by auth state:
  - **Logged-in** users get the new **Blizzard character picker**: they select one of their WoW characters, the fields auto-fill (name, class, spec, iLevel; `role`/`bloodLust`/`battleRez` derived as today; `keystoneMinLevel`/`keystoneMaxLevel` set to defaults), and they join.
  - **Not-logged-in** users see a **Battle.net login** screen with a **"Join as guest"** button below it; choosing guest keeps the **existing manual form** unchanged.
- **Keep** the manual character creation form as the guest registration path (it is **not** removed). Both paths reuse the same `POST /api/characters` contract — nothing downstream changes.
- **Widen the iLevel bounds** (`ITEM_LEVEL_MIN`/`MAX`) so real Blizzard `average_item_level` values are no longer clamped, and adjust the color tiers accordingly.
- Add i18n keys (EN + FR) for the join gate, the picker, the link-account flow, the guest option, and error states.

## Capabilities

### New Capabilities
- `blizzard-roster`: Linking a Battle.net account via Auth0 Token Vault, fetching the authenticated user's WoW character roster (US region), and mapping Blizzard data to the app's character model.

### Modified Capabilities
- `character`: Character registration gains a second source — logged-in users may create a character from a selected Blizzard character (auto-filled), while not-logged-in users keep registering via the existing manual form as guests. Derivation of `role`/`bloodLust`/`battleRez` from specialization is unchanged for both paths.

## Impact

- **Backend**: new `blizzard` module (controller, `BlizzardService`, `TokenVaultService`), new class/spec **ID→enum** mapping table; new config keys (Token Vault Custom API Client `client_id`/`client_secret`, Blizzard region/host). `POST /api/characters` unchanged.
- **Frontend**: new **join gate** routing by auth state; new Blizzard character picker (design from v0.vercel, adapted to the project) for logged-in users; **existing `EventRegisterForm` kept** as the guest path; Battle.net login screen with a "Join as guest" button; new "Link Battle.net" entry point; widened iLevel constants and tier bands; new i18n keys.
- **Auth0 (config, out of code)**: Battle.net connection set to *Connected Accounts for Token Vault* with `wow.profile`; a Custom API Client authorized for the federated token-exchange grant; Connected Accounts enrollment flow enabled.
- **No DB schema change**: the `Character` table and `POST /api/characters` payload are unchanged; keystone fields keep their existing defaults.
- **External dependency**: Blizzard Profile APIs (`us.api.blizzard.com`, namespace `profile-us`) and Auth0 Token Vault availability.
