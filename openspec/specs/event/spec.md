# event Specification

## Purpose
TBD - created by archiving change add-backend-unit-tests. Update Purpose after archive.
## Requirements
### Requirement: Event responses flatten admins and expose a visibility alias
The system SHALL return admins as a flat user list and SHALL expose party visibility under both `arePartiesVisible` (DB name) and `visible` (frontend alias).

#### Scenario: Admins are flattened
- **WHEN** an event is read or written with its admin relation loaded
- **THEN** the `admins` field is an array of users, not of join rows

#### Scenario: Visibility alias is present
- **WHEN** an event is mapped to a response
- **THEN** `visible` mirrors `arePartiesVisible`

### Requirement: Event creation requires an existing creator
The system SHALL reject creating an event for a user id that does not exist.

#### Scenario: Unknown creator
- **WHEN** an event is created with a `createdBy` that has no user
- **THEN** a `NotFoundException` is thrown

### Requirement: Admin replacement is wholesale
The system SHALL replace an event's admins by removing the existing set and recreating from the supplied user ids.

#### Scenario: Replacing admins
- **WHEN** an event update supplies an `admins` id list
- **THEN** existing admins are deleted and one admin row per supplied id is created

### Requirement: Event mutations report missing events
The system SHALL surface a not-found error when updating, deleting, or guarding an event that does not exist.

#### Scenario: Delete on a missing event
- **WHEN** deleting an event code that does not exist (Prisma `P2025`)
- **THEN** a `NotFoundException` is thrown

### Requirement: Event admin guard authorizes by membership
The system SHALL allow an event-scoped action only for an authenticated user who is an admin of that event.

#### Scenario: Unauthenticated request
- **WHEN** no user is attached to the request
- **THEN** a `ForbiddenException` is thrown

#### Scenario: Non-admin user
- **WHEN** the authenticated user is not in the event's admin list
- **THEN** a `ForbiddenException` is thrown

#### Scenario: Admin user
- **WHEN** the authenticated user is an admin of the event
- **THEN** the guard allows the request

