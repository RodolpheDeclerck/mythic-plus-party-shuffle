## ADDED Requirements

### Requirement: Character role attributes are derived from specialization
The system SHALL set `role`, `bloodLust` and `battleRez` from the specialization's static details, and SHALL reject an unknown specialization.

#### Scenario: Known specialization derives attributes
- **WHEN** a character is created or its specialization is updated
- **THEN** `role`, `bloodLust` and `battleRez` are taken from the specialization details

#### Scenario: Unknown specialization is rejected
- **WHEN** a specialization with no static details is supplied
- **THEN** an error is thrown and no character is persisted

### Requirement: Characters require an existing event
The system SHALL reject creating or relinking a character to an event code that does not exist.

#### Scenario: Missing event on create
- **WHEN** a character is created for an unknown event code
- **THEN** a `NotFoundException` is thrown

#### Scenario: Missing event on relink
- **WHEN** a character update supplies an unknown event code
- **THEN** a `NotFoundException` is thrown

### Requirement: Deletion detaches characters and reports missing rows
The system SHALL detach characters from their event rather than hard-deleting, and SHALL report when a targeted character does not exist.

#### Scenario: Single delete on a missing character
- **WHEN** deleting a character whose row is absent (Prisma `P2025`)
- **THEN** a `NotFoundException` is thrown

#### Scenario: Bulk delete with a partial match
- **WHEN** detaching a set of ids where fewer rows than ids are updated
- **THEN** a `NotFoundException` is thrown

### Requirement: Upsert chooses update or create
The system SHALL update an existing character when a known id is supplied, otherwise create one, requiring the mandatory fields.

#### Scenario: Existing id updates
- **WHEN** an upsert supplies an id that resolves to a character
- **THEN** the character is updated

#### Scenario: Create without required fields
- **WHEN** an upsert has no resolvable id and is missing a required field
- **THEN** a `BadRequestException` is thrown
