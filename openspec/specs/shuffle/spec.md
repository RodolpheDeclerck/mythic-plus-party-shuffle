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

A `Party[]`, in creation order. Each party has:

- a numeric `id` assigned by the algorithm;
- a `members: Character[]` of length 1–5.

## Algorithmic phases

The algorithm proceeds in phases. Each phase fills slots greedily based on role and a per-candidate score (keystone width first, then iLevel — see invariants 6 and 7). Anti-repeat is **not** applied during initial assignment; it runs as a swap-optimization pass at the end.

Order of phases (see [`PartyService.shuffleGroups`](../../../mythic-plus-party-shuffle-api-nest/src/modules/party/party.service.ts)):

1. Randomize input order (`shuffleArray(characters)`).
2. Partition characters by role into `{ tanks, healers, melees, dists, brs, bls }`.
3. **Special path**: if there are zero tanks and zero healers, run `createBalancedDpsOnlyGroups` and return.
4. Compute `numberOfParties` (see invariant 3) and create empty parties.
5. Assign **tanks** — one per party, parties chosen in randomized order; spillover creates new parties.
6. Assign **healers** — one per party, into a random party that has no healer; spillover creates new parties.
7. Assign **battle-rez** carriers — one per party where possible (utility distribution).
8. Assign **bloodlust** carriers — one per party where possible.
9. Assign **CAC** (melee DPS) — one per party that has none, scored by keystone width then iLevel.
10. Assign **DIST** (ranged DPS) — same as CAC but for ranged.
11. Distribute remaining DPS into parties with `<5` members; create new parties for any leftover.
12. Run **anti-repeat optimization** — swap members between parties to reduce pairings repeated from the last 3 shuffles.
13. Final fallback: `distributeUnassignedPlayers` for anything still unplaced.

## Invariants

1. **Role caps per party**
   - ≤1 TANK
   - ≤1 HEAL
   - ≤3 DPS (CAC + DIST combined)
   - **Party size ≤ 5**

2. **Melee/ranged DPS balance**
   - Each party tries to have **at least one CAC (melee) and one DIST (ranged)**, on a best-effort basis.
   - If a party has no CAC, the algorithm picks the best-fitting melee from remaining melees and adds it. Same logic for DIST with the ranged pool.
   - "Best fit" here = narrower keystone range, then closest iLevel to the party's reference iLevel.
   - Not enforced if the pool is exhausted: a party may end up without a CAC or without a DIST when the roster is unbalanced (e.g. 2 melees among 8 DPS over 3 parties).

3. **Party count**
   - When at least one tank or one healer exists:
     `parties = max(1, tanks.length, healers.length, ceil(characters.length / 5))`.
   - Otherwise (all-DPS roster): the algorithm groups DPS into parties of ≤5.

4. **Tank/healer assignment**
   - Tanks are assigned first, one per party, until tanks are exhausted.
   - Healers are assigned only to parties without a healer, until healers are exhausted.

5. **Utility distribution (battle rez & bloodlust)**
   - The algorithm tries to ensure each party has access to a battle-rez and a bloodlust.
   - **A party is considered BR-satisfied if its first member has `battleRez=true`** (typically the tank). In that case no further BR is added. Same logic for BL.
   - Otherwise, a non-tank carrier of the utility is added, scored by keystone width then iLevel proximity to the party's reference iLevel.
   - "First member" check means: a healer or DPS with the utility, assigned later, does **not** prevent the algorithm from also adding another carrier — see Known gaps.

6. **Keystone matching**
   - Within a party, members' keystone ranges should overlap.
   - Strict matching is preferred: the candidate's keystone range fully covers the party's current range. A ±2 fallback tolerance applies when no candidate covers fully.
   - When multiple candidates fit, the one with the **narrower** keystone range (max − min) is preferred — it's the most committed to a tight range and easier to merge into.

7. **Item-level tie-break**
   - Among candidates with the same keystone score, the one with `iLevel` closest to the party's reference iLevel is chosen. The reference is the iLevel of the party's first-assigned member (typically the tank).

8. **Anti-repeat**
   - The last 3 shuffles for the event are read from Redis and used to score candidate assignments; pairings that recently happened are penalized (recency-weighted).

9. **Non-determinism**
   - The algorithm uses `Math.random` (via `shuffleArray` between every phase, and a random pick when assigning healers). Two calls with the **same inputs and same shuffle history** can produce **different outputs**.
   - Tests must therefore assert on structural invariants (role caps, party count, presence of melee/ranged, etc.), never on which character lands in which specific party.

## Edge cases

| Case                                | Behavior                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| Empty roster                        | Returns `[]`.                                                                       |
| 1 character                         | Returns 1 party of 1 member.                                                        |
| Fewer characters than 5, mixed roles | Returns 1 party with all of them.                                                  |
| Fewer characters than 5, multi-tank  | Role cap (≤1 tank/party) drives the count: e.g. 4 tanks → 4 parties of 1 tank each. |
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
- **BR/BL satisfaction check is shallow.** The code only checks `party.members[0]` (typically the tank) when deciding if a party is already BR/BL-covered. If a *healer* or *DPS* assigned later happens to have BR or BL, the algorithm doesn't notice and adds another carrier anyway. Intent is "anyone with the utility satisfies the slot"; current code is "only the first-assigned member counts". Reconcile in a follow-up.
- **Intent vs code drift on scoring order.** The intended priority order, per the algorithm's author, is: composition (tanks/healers/BR/BL) → melee+ranged variety → anti-repeat → iLevel → keystone. The current code ranks candidates by **keystone width first, then iLevel** during BR/BL/CAC/DIST assignment, and applies anti-repeat only as a final swap pass. This spec describes the code as-is; aligning code to intent is tracked as a separate follow-up.
- Anti-repeat is a post-pass swap optimization, not a constraint during initial assignment. Tests cannot assume "characters that were grouped last shuffle will not be grouped this shuffle" — only that *swaps* are biased toward separating them when other constraints allow.
