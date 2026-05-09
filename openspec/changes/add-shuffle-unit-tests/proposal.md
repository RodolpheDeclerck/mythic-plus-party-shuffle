# Change — `add-shuffle-unit-tests`

## Why

`PartyService.shuffleGroups` is the core business logic of this project — 800+ lines of role-balancing, keystone-matching and anti-repeat heuristics — and currently has **zero unit-test coverage**. Any change to the algorithm risks silent regression. The wider goal (CI plan 09 + coverage plan) is to lift the API's coverage threshold from the current 5/4/5/3, and shuffle is the highest-leverage place to start.

## What

Add a unit-test suite for `PartyService.shuffleGroups` that exercises the contract described in [`specs/shuffle/spec.md`](../../specs/shuffle/spec.md). Tests are pure (no DB, no Redis, no NestJS DI bootstrap) — the shuffle history dependency is mocked.

## Scope

### In

- New `party.service.spec.ts` with tests covering:
  - Role caps (≤1 tank, ≤1 healer, ≤3 DPS, party size ≤ 5)
  - Party count formula (tanks/healers/ceil rules)
  - Tank-first then healer-first assignment
  - Battle rez and bloodlust distribution
  - Keystone overlap with ±2 fallback
  - iLevel tie-break
  - Anti-repeat using a mocked shuffle history
  - All edge cases listed in the spec
- Bumping API `coverageThreshold` to whatever the new tests measure on the `party` module specifically (per-file thresholds, not raising the global threshold yet — to avoid coupling).

### Out

- E2E tests against a real Redis (Phase 3 of plan 09).
- Refactoring `PartyService` to be more testable. We test what's there.
- Coverage on other API modules (`event`, `metadata`, `user`).
- Frontend changes.

## Acceptance criteria

- `party.service.spec.ts` has ≥ 1 test per invariant in `specs/shuffle/spec.md`.
- All edge cases from the spec table have a test.
- All tests pass on CI.
- No changes to `PartyService` behavior — tests are read-only on production code.
- Per-file `coverageThreshold` for `party.service.ts` set to a level reached by the new tests.

## Risks

- The spec is reverse-engineered from current code. If a test enforces something the code currently does *by accident*, future legitimate changes will fail the test. Mitigation: where the spec marks a behavior as *implementation-defined* (e.g. tie-breaking with identical iLevel + keystone width), tests must not assert on it.
- Shuffle has stochastic tendencies via input order. Mitigation: tests construct deterministic inputs and assert on observable invariants, not on specific party member orderings beyond what the spec guarantees.

## Notes for the OpenSpec POC

This change is the first dogfooding of the OpenSpec convention in this repo. After it ships, capture in `docs/plans/` whether the split between `specs/shuffle/spec.md` (stable contract) and this `proposal.md` (one-shot change) added value over a single `docs/plans/12-shuffle-unit-tests.md`.
