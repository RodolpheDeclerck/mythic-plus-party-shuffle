## ADDED Requirements

### Requirement: Characters can be registered from a selected Blizzard character
The system SHALL allow a user to register for an event by selecting one of their linked Battle.net characters, auto-filling `name`, `characterClass`, `specialization` and `iLevel` from Blizzard data, and SHALL set `keystoneMinLevel` and `keystoneMaxLevel` to the application defaults. The resulting registration SHALL use the existing character creation contract, so that `role`, `bloodLust` and `battleRez` are derived from the specialization as for a manually created character.

#### Scenario: Selecting a character auto-fills the registration
- **WHEN** a user selects one of their Blizzard characters during event registration
- **THEN** the name, class, specialization and item level are populated from the Blizzard data and keystone levels are set to the defaults

#### Scenario: Registration reuses the existing creation path
- **WHEN** the auto-filled registration is submitted
- **THEN** the character is created through the existing creation flow and its `role`, `bloodLust` and `battleRez` are derived from the specialization

#### Scenario: Item level is not clamped below real values
- **WHEN** the selected character's Blizzard `average_item_level` exceeds the previous registration bounds
- **THEN** the registered character keeps the real item level (the item-level bounds are widened so the value is not truncated)

### Requirement: Registration routes by authentication state with a guest fallback
The system SHALL present a join gate when a user registers for an event: an authenticated user SHALL be offered the Blizzard character picker, and a non-authenticated user SHALL see a Battle.net login option together with a "Join as guest" action that opens the existing manual registration form. Guest registration via the manual form SHALL remain supported and SHALL use the same character creation contract as the picker.

#### Scenario: Authenticated user is offered the picker
- **WHEN** an authenticated user opens event registration
- **THEN** the system presents the Blizzard character picker

#### Scenario: Non-authenticated user can join as guest
- **WHEN** a non-authenticated user opens event registration and chooses "Join as guest"
- **THEN** the system shows the existing manual registration form and the user can register without logging in

#### Scenario: Both paths create the character the same way
- **WHEN** a character is registered either from the picker or from the guest form
- **THEN** the character is created through the same creation contract and its `role`, `bloodLust` and `battleRez` are derived from the specialization
