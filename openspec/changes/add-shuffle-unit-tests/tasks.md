# Tasks — `add-shuffle-unit-tests`

Ordered. Check off as you go.

## 0. Setup

- [ ] Read `specs/shuffle/spec.md` end to end. **Pay close attention to invariant 9 (non-determinism)**: the algorithm calls `shuffleArray` and `Math.random` internally, so two calls with identical inputs can produce different outputs.
- [ ] Skim `mythic-plus-party-shuffle-api-nest/src/modules/party/party.service.ts` to understand the surface area.
- [ ] Mock `RedisService` (or whatever is injected) so tests are pure.
- [ ] Decide on a non-determinism strategy. Two viable approaches:
  - **(A) Property-based**: assert only on structural invariants (role caps, ≥1 melee, etc.) that hold regardless of internal randomness.
  - **(B) Seeded randomness**: `jest.spyOn(Math, 'random')` and stub `shuffleArray` to a deterministic identity, so we can assert on specific party assignments.
  Approach A is preferred for most tests; B is acceptable only when the test explicitly needs ordering control (e.g. validating tie-break logic). Document the choice in a comment at the top of `party.service.spec.ts`.

## 1. Test file scaffold

- [ ] Create `mythic-plus-party-shuffle-api-nest/src/modules/party/party.service.spec.ts`.
- [ ] Build a minimal `PartyService` instance with a mocked Redis client returning an empty shuffle history by default.
- [ ] Add a `mkChar(...)` factory that returns a `Character` with sensible defaults — only override the field the test cares about. Keep the factory inline (per CLAUDE.md test style).

## 2. Role caps (invariant 1)

- [ ] Test: with 2 tanks, 2 healers, 6 DPS — every party has ≤1 tank.
- [ ] Test: same input — every party has ≤1 healer.
- [ ] Test: same input — every party has ≤3 DPS.
- [ ] Test: same input — every party has size ≤ 5.

## 3. Melee/ranged DPS balance (invariant 2)

- [ ] Test: 2 parties, 2 CAC and 2 DIST in the pool → each party ends up with ≥1 CAC and ≥1 DIST.
- [ ] Test: 2 parties, 1 CAC and 3 DIST in the pool → the CAC lands in one party (best-fitting), the other party stays CAC-less rather than borrowing a DIST.
- [ ] Test: among 2 candidate melees with the same keystone range, the one with iLevel closer to the party's reference is chosen.
- [ ] Test: among 2 candidate melees, the one with the **narrower** keystone range is preferred over the one with a wider range.

## 4. Party count formula (invariant 3)

- [ ] Test: 3 tanks, 2 healers, 5 DPS → party count = 3 (driven by tanks).
- [ ] Test: 1 tank, 4 healers, 0 DPS → party count = 4 (driven by healers).
- [ ] Test: 2 tanks, 2 healers, 11 DPS → party count = 3 (driven by ceil(15/5)).
- [ ] Test: 0 tanks, 0 healers, 7 DPS → all-DPS mode, ≤2 parties of ≤5.

## 5. Tank/healer assignment order (invariant 4)

- [ ] Test: with 2 tanks and 1 healer, exactly the parties getting a tank also gain a healer (not a fresh party).
- [ ] Test: with 1 tank and 0 healers, only the first party gets a tank; remaining parties are tank-less.

## 6. Utility distribution (invariant 5)

- [ ] Test: 2 parties, 2 BR-capable DPS, no other DPS → each party gets one BR-capable.
- [ ] Test: 2 parties, 1 BL-capable DPS, plenty of others → the BL-capable lands in one of the parties.
- [ ] Test (BR): a tank with `battleRez=true` (first member) prevents the algorithm from adding another BR carrier to that party.
- [ ] Test (BR): a healer with `battleRez=true` (members[1]) does **not** prevent another BR from being added — code only checks `members[0]`. Documents the BR shallow-check gap; asserts current behavior, not intent.
- [ ] Test (BL): a tank with `bloodLust=true` (first member) does **not** prevent another BL carrier from being added — BL has no existence check at all. Documents the BL no-check gap; asserts current behavior, not intent.
- [ ] Test (BL): with N parties and N+1 bloodlust-capable characters in the pool, every non-empty party still receives a BL carrier (subject to availability), since BL is added unconditionally.

## 7. Keystone matching (invariant 6)

- [ ] Test: party with members in [10–15], candidate in [12–14] is preferred over candidate in [8–9].
- [ ] Test: when no candidate strictly overlaps, a candidate within ±2 of the party range is acceptable.
- [ ] Test: among two equally-eligible candidates, the one with the narrower keystone range is preferred.

## 8. iLevel tie-break (invariant 7)

- [ ] Test: among candidates passing role + keystone, the one with `iLevel` closest to the party's reference iLevel is chosen.

## 9. Anti-repeat (invariant 8) — DEFERRED to follow-up PR

Anti-repeat is a **post-pass swap optimization**, not a constraint during initial assignment. Tests are non-trivial:

- They require seeded randomness (`jest.spyOn(Math, 'random')` + stubbing `shuffleArray`) or statistical testing across N runs.
- The optimizer's exact swap logic (`optimizeGlobalDistribution`, `calculateRedundancyScore`) is intertwined with the broader algorithm and harder to isolate.

For the POC PR we ship 26 tests covering invariants 1–7 and edge cases (>75% coverage on `party.service.ts`). Anti-repeat tests are intentionally deferred so the POC can land and we can evaluate the OpenSpec workflow before sinking more time into the trickier parts.

Deferred tests to add later:

- [ ] Test: with a mocked history showing A and B were grouped repeatedly in the last 3 shuffles, **across N seeded runs** the proportion of resulting parties pairing A and B is lower than with empty history (statistical test, requires approach B with seeded randomness).
- [ ] Test: with empty history, the optimizer pass is a no-op or near no-op on a roster that already satisfies all other constraints (smoke).
- [ ] Test: optimizer never violates higher-priority invariants (role caps, party size). After optimization, all role-cap invariants from spec section 1 still hold.

## 10. Edge cases

- [ ] Test: empty roster → `[]`.
- [ ] Test: 1 character → 1 party of 1.
- [ ] Test: 4 characters → 1 party of all 4, role caps respected.
- [ ] Test: 6 tanks, no healers, no DPS → 6 parties of 1 tank each (party count driven by tanks).
- [ ] Test: keystone spread > 4 levels in a single party → does not throw, party is still produced (warning is implementation, not asserted).

## 11. Coverage threshold

- [ ] Run `npm run test:cov -w mythic-plus-party-shuffle-api-nest` locally.
- [ ] Note the new coverage on `party.service.ts` (look at the per-file row).
- [ ] Add a per-file `coverageThreshold` entry in `mythic-plus-party-shuffle-api-nest/package.json` for `**/party.service.ts` set to **the measured value minus 2 points** (ratchet).
- [ ] Do **not** raise the global threshold here — that's a separate PR scope.

## 12. PR

- [ ] Update `docs/plans/README.md` with a row for this change (per CLAUDE.md PR checklist).
- [ ] Add `docs/plans/12-shuffle-unit-tests.md` mirroring the OpenSpec proposal for traceability with the existing convention.
- [ ] Open PR titled `test(party): add unit tests for shuffleGroups`.
- [ ] After merge: move `openspec/changes/add-shuffle-unit-tests/` to `openspec/changes/archive/add-shuffle-unit-tests/`.
- [ ] Capture POC retrospective in a follow-up note: did the spec/proposal split help vs. a single `docs/plans/` file? Decide adopt/abandon/hybrid.
