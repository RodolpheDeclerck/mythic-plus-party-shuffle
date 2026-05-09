# Tasks — `add-shuffle-unit-tests`

Ordered. Check off as you go.

## 0. Setup

- [ ] Read `specs/shuffle/spec.md` end to end.
- [ ] Skim `mythic-plus-party-shuffle-api-nest/src/modules/party/party.service.ts` to understand the surface area.
- [ ] Note: the shuffle history dependency reads from Redis. We will mock `RedisService` (or whatever is injected) so tests are pure.

## 1. Test file scaffold

- [ ] Create `mythic-plus-party-shuffle-api-nest/src/modules/party/party.service.spec.ts`.
- [ ] Build a minimal `PartyService` instance with a mocked Redis client returning an empty shuffle history by default.
- [ ] Add a `mkChar(...)` factory that returns a `Character` with sensible defaults — only override the field the test cares about. Keep the factory inline (per CLAUDE.md test style).

## 2. Role caps (invariant 1)

- [ ] Test: with 2 tanks, 2 healers, 6 DPS — every party has ≤1 tank.
- [ ] Test: same input — every party has ≤1 healer.
- [ ] Test: same input — every party has ≤3 DPS.
- [ ] Test: same input — every party has size ≤ 5.

## 3. Party count formula (invariant 2)

- [ ] Test: 3 tanks, 2 healers, 5 DPS → party count = 3 (driven by tanks).
- [ ] Test: 1 tank, 4 healers, 0 DPS → party count = 4 (driven by healers).
- [ ] Test: 2 tanks, 2 healers, 11 DPS → party count = 3 (driven by ceil(15/5)).
- [ ] Test: 0 tanks, 0 healers, 7 DPS → all-DPS mode, ≤2 parties of ≤5.

## 4. Tank/healer assignment order (invariant 3)

- [ ] Test: with 2 tanks and 1 healer, exactly the parties getting a tank also gain a healer (not a fresh party).
- [ ] Test: with 1 tank and 0 healers, only the first party gets a tank; remaining parties are tank-less.

## 5. Utility distribution (invariant 4)

- [ ] Test: 2 parties, 2 BR-capable DPS, no other DPS → each party gets one BR-capable.
- [ ] Test: 2 parties, 1 BL-capable DPS, plenty of others → the BL-capable lands in one of the parties.
- [ ] Test: BR/BL on a tank does NOT count as fulfilling the BR/BL slot for the party (utilities only assigned to non-tanks per spec).

## 6. Keystone matching (invariant 5)

- [ ] Test: party with members in [10–15], candidate in [12–14] is preferred over candidate in [8–9].
- [ ] Test: when no candidate strictly overlaps, a candidate within ±2 of the party range is acceptable.
- [ ] Test: among two equally-eligible candidates, the one with the narrower keystone range is preferred.

## 7. iLevel tie-break (invariant 6)

- [ ] Test: among candidates passing role + keystone, the one with `iLevel` closest to the party's reference iLevel is chosen.

## 8. Anti-repeat (invariant 7)

- [ ] Test: with a mocked history showing characters A and B were grouped in the last shuffle, the algorithm prefers separating them on the next shuffle when a viable alternative exists.
- [ ] Test: with empty history, no anti-repeat penalty influences the result (smoke test).

## 9. Edge cases

- [ ] Test: empty roster → `[]`.
- [ ] Test: 1 character → 1 party of 1.
- [ ] Test: 4 characters → 1 party of all 4, role caps respected.
- [ ] Test: 6 tanks, no healers, no DPS → 6 parties of 1 tank each (party count driven by tanks).
- [ ] Test: keystone spread > 4 levels in a single party → does not throw, party is still produced (warning is implementation, not asserted).

## 10. Coverage threshold

- [ ] Run `npm run test:cov -w mythic-plus-party-shuffle-api-nest` locally.
- [ ] Note the new coverage on `party.service.ts` (look at the per-file row).
- [ ] Add a per-file `coverageThreshold` entry in `mythic-plus-party-shuffle-api-nest/package.json` for `**/party.service.ts` set to **the measured value minus 2 points** (ratchet).
- [ ] Do **not** raise the global threshold here — that's a separate PR scope.

## 11. PR

- [ ] Update `docs/plans/README.md` with a row for this change (per CLAUDE.md PR checklist).
- [ ] Add `docs/plans/12-shuffle-unit-tests.md` mirroring the OpenSpec proposal for traceability with the existing convention.
- [ ] Open PR titled `test(party): add unit tests for shuffleGroups`.
- [ ] After merge: move `openspec/changes/add-shuffle-unit-tests/` to `openspec/changes/archive/add-shuffle-unit-tests/`.
- [ ] Capture POC retrospective in a follow-up note: did the spec/proposal split help vs. a single `docs/plans/` file? Decide adopt/abandon/hybrid.
