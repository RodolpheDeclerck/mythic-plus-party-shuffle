# auth Specification

## Purpose
TBD - created by archiving change add-backend-unit-tests. Update Purpose after archive.
## Requirements
### Requirement: OIDC users are provisioned on first authentication
The system SHALL resolve an authenticated OIDC subject to a local user, creating one on first sight and reusing it thereafter.

#### Scenario: Existing subject reuses its user
- **WHEN** a token is validated whose `sub` already maps to a stored user
- **THEN** that stored user is returned and no new user is created

#### Scenario: Unknown subject creates a user
- **WHEN** a token is validated whose `sub` has no stored user
- **THEN** a new user is created with the token's email and username and returned

### Requirement: JWT payloads are normalized before provisioning
The system SHALL reject tokens without a `sub` and SHALL derive a username and email from the payload when those claims are absent.

#### Scenario: Missing sub is rejected
- **WHEN** a token payload has no `sub`
- **THEN** an `UnauthorizedException` is thrown and no user is provisioned

#### Scenario: Username falls back to name then sub
- **WHEN** a payload has no `nickname`
- **THEN** the username is taken from `name`, or from `sub` when `name` is also absent

#### Scenario: Email falls back to a synthetic address
- **WHEN** a payload has no `email`
- **THEN** the email is set to `<sub>@oidc.local`

### Requirement: Public routes bypass JWT authentication
The system SHALL allow handlers marked public to run without a valid token while still rejecting protected handlers that present no user.

#### Scenario: Public handler is allowed
- **WHEN** the `isPublic` metadata is set on the handler or controller
- **THEN** the guard allows the request without invoking passport

#### Scenario: Protected handler without user is rejected
- **WHEN** a protected handler resolves no user and no passport error
- **THEN** an `UnauthorizedException` is thrown

