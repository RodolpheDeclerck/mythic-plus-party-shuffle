# Change — `add-backend-unit-tests`

## Why

The shuffle algorithm is the only backend unit covered (`party.service.spec.ts` + `add-shuffle-unit-tests`). The remaining ~15 testable units — auth, character, event, user, metadata, party orchestration, and the shared services — have **zero coverage**. The global `coverageThreshold` sits at 9/6/6/8, which is effectively "shuffle only". This change brings the rest of the backend under unit test so that CRUD wiring, guard logic, and the OIDC/JWT path can't regress silently.

## What

Add one unit-test file per untested unit. Tests are pure: no DB, no Redis, no NestJS DI bootstrap — every dependency (`PrismaService`, `WebSocketService`, `ConfigService`, `Reflector`, sub-services) is mocked with plain `jest.fn()` objects, matching the existing `rate-limit.service.spec.ts` / `party.service.spec.ts` style.

Specs (capability contracts) are written **only** where there is real business logic worth pinning: `auth`, `character`, `event`. The Nest glue (controllers' HTTP mapping, `prisma.service`, `websocket.service`, `party.facade`) is tested without a dedicated `spec.md` — the test file is its own contract.

## Scope

### In

- New `*.spec.ts` for: `auth.service`, `auth.controller`, `jwt-auth.guard`, `jwt.strategy`, `event.service`, `event.controller`, `event-admin.guard`, `character.service`, `character.controller`, `user.service`, `user.controller`, `metadata.controller`, `party.controller`, `party.facade`, `prisma.service`, `websocket.service`.
- Capability specs (`openspec/changes/add-backend-unit-tests/specs/{auth,character,event}/spec.md`) describing the invariants the tests pin.
- Raise the global `coverageThreshold` to a level the new suite actually reaches (measured, not aspirational).

### Out

- E2E / integration tests against real Postgres or Redis.
- Refactoring production code for testability — we test what's there.
- Frontend changes.
- Re-testing the shuffle algorithm (already covered).

## Acceptance criteria

- Every unit listed above has a `*.spec.ts` covering nominal, edge, and error paths.
- `npm test` passes; coverage meets the raised global threshold on CI.
- No production-code behavior change — tests are read-only on `src/`.
- `npm run openspec:validate --strict` passes for this change.

## Risks

- Some specs are reverse-engineered from current code; a test may pin behavior that exists by accident. Mitigation: assert on observable contract (status codes, thrown exception types, delegation), not on incidental ordering or log strings.
- `JwtStrategy`'s constructor builds a real passport strategy. Mitigation: `jest.mock('jwks-rsa')` so no network/JWKS fetch happens; only `validate()` logic is asserted.
