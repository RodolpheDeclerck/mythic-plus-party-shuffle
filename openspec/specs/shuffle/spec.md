# Capability — Shuffle

> **Status:** stable description of the *current* behavior of `PartyService.shuffleGroups` as of 2026-05-09.
> Source: [party.service.ts](../../../mythic-plus-party-shuffle-api-nest/src/modules/party/party.service.ts), entry point [party.facade.ts:shuffleAndSaveGroups](../../../mythic-plus-party-shuffle-api-nest/src/shared/facade/party.facade.ts).
>
> This spec describes external contract — what callers can rely on. Implementation details (sort orders, exact scoring weights) are deliberately omitted.

## Purpose

Given a roster of WoW characters registered to an event, produce balanced 5-player Mythic+ parties that:

- respect role composition rules (≤1 tank, ≤1 healer, ≤3 DPS, ≥1 melee + ≥1 ranged when feasible);
- distribute key utilities (battle rez, bloodlust);
- match keystone levels across party members;
- avoid repeating party assignments from recent shuffles.

## Public API

```ts
PartyFacade.shuffleAndSaveGroups(eventCode: string): Promise<Party[]>
```

The facade reads the event's registered `Character[]` from Redis, calls
`PartyService.shuffleGroups`, persists the result, and returns the parties.

`PartyService.shuffleGroups(characters: Character[], eventCode: string): Promise<Party[]>`
is the unit-testable core.

## Inputs

Each `Character`:

- `id`, `name`, `characterClass`, `specialization`
- `role` ∈ `{ TANK, HEAL, CAC, DIST }` (CAC = melee DPS, DIST = ranged DPS)
- `iLevel` (integer)
- `keystoneMinLevel`, `keystoneMaxLevel` (integers, range of M+ keys the player wants)
- `battleRez`, `bloodLust` (booleans, derived from class/spec capabilities)

## Outputs

An ordered `Party[]`. Each party has:

- a numeric `id` assigned by the algorithm;
- a `members: Character[]` of length 1–5.

## Invariants

1. **Role caps per party**
   - ≤1 TANK
   - ≤1 HEAL
   - ≤3 DPS (CAC + DIST combined)
   - **Party size ≤ 5**

2. **Melee/ranged DPS balance**
   - Each party tries to have **at least one CAC (melee) and one DIST (ranged)**, on a best-effort basis.
   - If a party has no CAC, the algorithm picks the best-fitting melee from remaining melees and adds it. Same logic for DIST with the ranged pool.
   - "Best fit" here = narrower keystone range, then closest iLevel to the party's reference (same scoring as the keystone matching invariant).
   - Not enforced if the pool is exhausted: a party may end up without a CAC or without a DIST when the roster is unbalanced (e.g. 2 melees among 8 DPS over 3 parties).

3. **Party count**
   - When at least one tank or one healer exists:
     `parties = max(1, tanks.length, healers.length, ceil(characters.length / 5))`.
   - Otherwise (all-DPS roster): the algorithm groups DPS into parties of ≤5.

4. **Tank/healer assignment**
   - Tanks are assigned first, one per party, until tanks are exhausted.
   - Healers are assigned only to parties without a healer, until healers are exhausted.

5. **Utility distribution (battle rez & bloodlust)**
   - Among non-tanks, the algorithm tries to place ≥1 battle-rez and ≥1 bloodlust character in every party where possible, before filling with regular DPS.

6. **Keystone matching**
   - Within a party, members' keystone ranges should overlap.
   - Strict matching (full overlap) is preferred; a ±2 fallback tolerance applies when strict matching is impossible.
   - When multiple candidates fit, the one with the **narrower** keystone range is preferred (more flexible to merge into).

7. **Item-level tie-break**
   - Among candidates that satisfy role + keystone constraints, the one with `iLevel` closest to the party's existing reference level is chosen.

8. **Anti-repeat**
   - The last 3 shuffles for the event are read from Redis and used to score candidate assignments; pairings that recently happened are penalized (recency-weighted).

9. **Determinism**
   - Given the same inputs and the same shuffle history, the algorithm produces the same result. Randomness, if any, is seeded by the input ordering.

## Edge cases

| Case                                | Behavior                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| Empty roster                        | Returns `[]`.                                                                       |
| 1 character                         | Returns 1 party of 1 member.                                                        |
| Fewer characters than 5             | Returns 1 party with all of them, role caps still respected.                        |
| All-DPS roster                      | Groups DPS into parties of ≤5; anti-repeat and keystone matching still applied.     |
| More than 5 tanks                   | One party per tank (party count driven by tank count).                              |
| Keystone spread > 4 levels in party | Logged as a warning; **not** rejected.                                              |
| Duplicate character IDs             | Undefined — caller is expected to deduplicate.                                      |

## Out of scope of this spec

- Persistence layer (Redis keys, JSON serialization).
- Shuffle history compaction (always last 3 shuffles, but the eviction policy is implementation-only).
- Web socket fan-out after a shuffle.
- Validation of inputs (assumed clean by the time `shuffleGroups` is called).

## Known gaps and follow-ups

- Behavior when the same character has both `battleRez=true` and `bloodLust=true` is not explicitly specified.
- Exact tie-breaking when two candidates have identical iLevel and keystone width is implementation-defined.
