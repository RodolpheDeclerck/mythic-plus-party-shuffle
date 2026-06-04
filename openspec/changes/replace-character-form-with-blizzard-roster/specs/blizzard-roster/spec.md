## ADDED Requirements

### Requirement: Battle.net account is linked via Auth0 Token Vault
The system SHALL allow an authenticated user to link their Battle.net account through Auth0's Connected Accounts (Token Vault) with the `wow.profile` scope, and SHALL retrieve the federated Blizzard access token by exchanging the user's Auth0 token at the Auth0 `/oauth/token` endpoint using the federated-connection token-exchange grant. The system SHALL NOT persist the Blizzard access or refresh token in its own database.

#### Scenario: Linked account yields a Blizzard token
- **WHEN** an authenticated user whose Battle.net account is linked requests their roster
- **THEN** the backend exchanges the Auth0 token for a federated Blizzard access token via Token Vault and uses it as a Bearer token against the Blizzard API

#### Scenario: Account not linked
- **WHEN** the token exchange fails because the user has not linked Battle.net (no token in the vault)
- **THEN** the system returns an error state that signals "not linked" so the UI can present a link call-to-action, rather than a generic failure

#### Scenario: Expired Blizzard token is refreshed transparently
- **WHEN** the stored Blizzard token is expired at exchange time
- **THEN** Auth0 refreshes it and returns a valid token, and the backend proceeds without user re-authentication

### Requirement: Authenticated user can fetch their WoW character roster
The system SHALL expose an authenticated endpoint that returns the user's World of Warcraft characters from the Blizzard Account Profile Summary for the configured region (US). The roster SHALL include each character's name, realm, and class, and SHALL NOT require per-character enrichment calls.

#### Scenario: Roster is returned
- **WHEN** a linked user requests `GET /api/blizzard/characters`
- **THEN** the system returns the list of the user's US-region characters with name, realm, and class

#### Scenario: Empty roster
- **WHEN** the Account Profile Summary returns no characters for the configured region
- **THEN** the system returns an empty list (and logs that the region may not match the account)

#### Scenario: Unauthenticated request is rejected
- **WHEN** the roster endpoint is called without a valid Auth0 JWT
- **THEN** the request is rejected by the auth guard

### Requirement: Selected character is enriched on demand
The system SHALL enrich a single selected character with its `average_item_level` and `active_spec` via the Blizzard Character Profile Summary only when that character is selected, not for the entire roster.

#### Scenario: Enrichment on selection
- **WHEN** a user selects a character and the backend receives `GET /api/blizzard/characters/:realm/:name`
- **THEN** the system returns the character's item level (from `average_item_level`) and active specialization

#### Scenario: Roster listing does not enrich
- **WHEN** the roster list is fetched
- **THEN** no Character Profile Summary call is made for listing

### Requirement: Blizzard class and specialization are mapped by stable IDs
The system SHALL map a Blizzard character's class and active specialization to the application's `CharacterClass` and `Specialization` enums using Blizzard's numeric class and specialization IDs, which are locale-independent, and SHALL NOT rely on localized display names.

#### Scenario: Class and spec map by ID
- **WHEN** a character has `character_class.id` and `active_spec.id`
- **THEN** the system resolves them to the matching `CharacterClass` and `Specialization` enum values regardless of the account's language

#### Scenario: Frost ambiguity resolved
- **WHEN** the active spec is "Frost" for a Mage versus a Death Knight
- **THEN** the spec ID disambiguates to `Mage_Frost` or `DeathKnight_Frost` respectively

#### Scenario: Unknown ID is rejected
- **WHEN** a class or spec ID has no mapping
- **THEN** the system reports a mapping error and does not produce a character with a wrong specialization
