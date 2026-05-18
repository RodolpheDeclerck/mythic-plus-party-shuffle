# shuffle

> **Source:** [party.service.ts](../../../mythic-plus-party-shuffle-api-nest/src/modules/party/party.service.ts), entry point [party.facade.ts:shuffleAndSaveGroups](../../../mythic-plus-party-shuffle-api-nest/src/shared/facade/party.facade.ts).
>
> This spec describes the **current** external contract of `PartyService.shuffleGroups`. Several requirements below intentionally document the code as-is even when it diverges from the algorithm author's intent — those gaps are listed at the bottom and tracked as separate refactor PRs.

## Purpose

Given a roster of WoW characters registered to an event, `shuffleGroups` SHALL produce balanced 5-player Mythic+ parties that respect role composition rules, distribute key utilities (battle rez, bloodlust), match keystone levels across party members, and avoid repeating party assignments from recent shuffles.

## Public API

```ts
PartyFacade.shuffleAndSaveGroups(eventCode: string): Promise<Party[]>
```

The facade reads the event's registered `Character[]` from Redis, calls `PartyService.shuffleGroups`, persists the result, and returns the parties.

`PartyService.shuffleGroups(characters: Character[], eventCode: string): Promise<Party[]>` is the unit-testable core.

### Inputs

Each `Character`:

- `id`, `name`, `characterClass`, `specialization`
- `role` ∈ `{ TANK, HEAL, CAC, DIST }` (CAC = melee DPS, DIST = ranged DPS)
- `iLevel` (integer)
- `keystoneMinLevel`, `keystoneMaxLevel` (integers, range of M+ keys the player wants)
- `battleRez`, `bloodLust` (booleans, derived from class/spec capabilities)

### Outputs

A `Party[]`, in creation order. Each party has a numeric `id` and `members: Character[]` of length 1–5.

## Algorithmic phases

The algorithm proceeds in phases. Anti-repeat is **not** applied during initial assignment; it runs as a swap-optimization pass at the end.

1. Randomize input order (`shuffleArray(characters)`).
2. Partition characters by role into `{ tanks, healers, melees, dists, brs, bls }`.
3. **Special path**: if there are zero tanks and zero healers, run `createBalancedDpsOnlyGroups` and return.
4. Compute `numberOfParties` and create empty parties.
5. Assign tanks — one per party, parties chosen in randomized order; spillover creates new parties.
6. Assign healers — one per party, into a random party that has no healer; spillover creates new parties.
7. Assign battle-rez carriers.
8. Assign bloodlust carriers.
9. Assign CAC (melee DPS) — one per party that has none.
10. Assign DIST (ranged DPS) — same as CAC but for ranged.
11. Distribute remaining DPS into parties with `<5` members; create new parties for leftover.
12. Run anti-repeat optimization (swap members between parties).
13. Final fallback: `distributeUnassignedPlayers` for anything still unplaced.

## Requirements

### Requirement: Role caps per party
Every party produced by `shuffleGroups` SHALL contain at most 1 TANK, at most 1 HEAL, at most 3 DPS (CAC + DIST combined), and at most 5 members in total.

#### Scenario: Mixed roster fits within caps
- **WHEN** `shuffleGroups` is called with a roster of 2 tanks, 2 healers, and 6 DPS
- **THEN** every party returned has at most 1 tank, at most 1 healer, at most 3 DPS, and at most 5 members

### Requirement: Initial party count formula
When at least one tank or healer is present, the algorithm SHALL allocate `max(1, tanks.length, healers.length, ceil(characters.length / 5))` parties initially. The final party count MAY be higher when leftover DPS that cannot fit into the initial allocation are pushed into additional parties by `createGroupForRemainingDPS`.

#### Scenario: Tank count drives the initial allocation
- **WHEN** 3 tanks, 2 healers, and 5 DPS are shuffled
- **THEN** the result contains exactly 3 parties

#### Scenario: Healer count drives the initial allocation
- **WHEN** 1 tank, 4 healers, and 0 DPS are shuffled
- **THEN** the result contains exactly 4 parties

#### Scenario: ceil(n/5) plus leftover DPS may add parties
- **WHEN** 3 tanks, 3 healers, and 9 DPS are shuffled
- **THEN** the result contains at least 3 parties, all 15 characters are placed, and no party exceeds 5 members

#### Scenario: All-DPS roster
- **WHEN** 0 tanks, 0 healers, and 7 DPS are shuffled
- **THEN** the algorithm groups DPS into parties of at most 5 members

### Requirement: Tank and healer placement
Every tank in the roster SHALL be placed in exactly one party. Every healer SHALL be placed in exactly one party. Tanks are assigned first, one per party, in a randomized party order. Healers are then assigned, one per party, into a randomly chosen party that does not already have a healer.

#### Scenario: All tanks are placed exactly once
- **WHEN** a roster contains 3 tanks among other roles
- **THEN** the 3 tank ids appear exactly once across all parties produced

#### Scenario: All healers are placed exactly once
- **WHEN** a roster contains 3 healers among other roles
- **THEN** the 3 healer ids appear exactly once across all parties produced

#### Scenario: Single healer joins an existing party
- **WHEN** 2 tanks and 1 healer are shuffled
- **THEN** exactly 2 parties are produced and the healer lands in one of them (not a new third party)

### Requirement: Battle-rez slot satisfaction (shallow check on first member)
The algorithm SHALL ensure each party has a battle-rez (BR) carrier when one is available. A party is considered BR-satisfied **only if** `members[0].battleRez` is true (typically the tank); a BR-carrying healer or DPS assigned later does NOT prevent another BR carrier from being added. BR carriers are picked from non-tanks (HEAL/CAC/DIST roles).

#### Scenario: Plain tanks receive a BR DPS carrier
- **WHEN** 2 parties have plain tanks (no BR) and 2 BR-capable DPS are available
- **THEN** every party ends up with at least one member carrying battleRez

#### Scenario: A tank with BR prevents additional BR additions
- **WHEN** a party's first member is a tank with `battleRez=true`, no other BR carriers exist, and plain DPS fillers are available
- **THEN** the party has exactly one BR carrier (the tank itself)

#### Scenario: A healer with BR does NOT satisfy the slot (shallow-check gap)
- **WHEN** a party has a plain tank at `members[0]`, a BR-carrying healer at `members[1]`, and a BR-capable DPS is in the pool
- **THEN** the algorithm still adds the BR DPS, resulting in 2 BR carriers in the party

### Requirement: Bloodlust slot satisfaction (no existence check)
The algorithm SHALL add a bloodlust (BL) carrier to every non-empty party where one is available in the pool. It performs **no** existence check on the party's current members; a BL carrier is added unconditionally.

#### Scenario: BL DPS added even when no existing member carries it
- **WHEN** a party has a plain tank and a BL-capable DPS is the only DPS option
- **THEN** the BL DPS is added to the party

### Requirement: Melee/ranged DPS variety (best-effort, currently degraded by a bug)
The algorithm SHALL attempt to place at least one CAC and at least one DIST in each party. When the pool is balanced, all CAC and DIST characters MUST be placed somewhere in the final parties. Variety per individual party is currently **not** guaranteed due to a bug in `addignDistAndMelees` (see Known gaps): the same "best" candidate is elected for every party, so subsequent parties may receive 0 CAC or 0 DIST from the dedicated balancing phase.

#### Scenario: Single CAC across 2 parties does not borrow from DIST pool
- **WHEN** 2 plain tanks, 1 CAC and 3 DIST are shuffled
- **THEN** exactly 1 of the 2 parties contains a CAC; the other party has 0 CAC

#### Scenario: All DPS in a balanced pool are placed
- **WHEN** 2 plain tanks, 2 CAC, and 2 DIST are shuffled
- **THEN** all 6 characters are placed across exactly 2 parties of at most 5 members each, and both CAC ids and both DIST ids appear somewhere in the result

### Requirement: Keystone matching via shuffle history
When prior shuffle history is non-empty for the event, `filterEligibleMembers` SHALL prefer candidates whose keystone range fully covers the party's current `[min, max]` range. If no candidate strictly covers, a `±2` tolerance fallback is applied. When multiple candidates qualify, the one with the **narrower** keystone range (`max − min`) SHALL be preferred.

#### Scenario: Strict-cover candidate wins over a narrower non-cover candidate
- **WHEN** the party tank has keystone `[10, 12]` and two CAC candidates are available — one with `[8, 14]` (covers strictly) and one with `[11, 11]` (narrower but no full cover)
- **THEN** the strict-cover candidate is added first

#### Scenario: ±2 tolerance fallback applies when no strict cover exists
- **WHEN** the party tank has keystone `[10, 12]`, one CAC has `[9, 13]` (within ±2), and one CAC has `[2, 4]` (far outside ±2)
- **THEN** the within-tolerance candidate is added first

### Requirement: iLevel tie-break
Among candidates that are equally eligible by role and keystone scoring, the candidate whose `iLevel` is closest to the party's reference iLevel SHALL be chosen. The reference is the iLevel of the party's first-assigned member (typically the tank).

#### Scenario: Closer iLevel wins among same-keystone candidates
- **WHEN** the tank has iLevel 620 and two CAC candidates share the same keystone width but have iLevels 622 and 640
- **THEN** the iLevel-622 candidate is added first

### Requirement: Non-determinism
`shuffleGroups` SHALL NOT be assumed deterministic. It calls `Math.random` (via internal `shuffleArray` between every phase, and during random healer placement). Two calls with the same inputs and the same shuffle history MAY produce different outputs. Tests against this capability MUST assert on structural invariants only, never on which specific character lands in which specific party.

#### Scenario: Property assertions hold across runs
- **WHEN** the same roster is shuffled multiple times with the same (empty) history
- **THEN** the role-cap invariants and the party-size cap hold on every run, even though individual member-to-party assignments may differ

### Requirement: Edge cases
The algorithm SHALL handle small or degenerate rosters without throwing.

#### Scenario: Empty roster
- **WHEN** `shuffleGroups` is called with an empty `characters` array
- **THEN** it returns an empty array

#### Scenario: Single character
- **WHEN** the roster contains exactly 1 character
- **THEN** the result is 1 party with that single member

#### Scenario: Fewer than 5 characters, mixed roles
- **WHEN** the roster has 1 tank, 1 healer, 1 CAC, and 1 DIST
- **THEN** the result is 1 party containing all 4 members, with role caps respected

#### Scenario: 6 tanks, no healers, no DPS
- **WHEN** the roster has 6 tanks and nothing else
- **THEN** the result is 6 parties of 1 tank each (role caps drive the count)

#### Scenario: Wide keystone spread is tolerated
- **WHEN** members of a party have keystone ranges differing by more than 4 levels
- **THEN** `shuffleGroups` completes without throwing; the wide spread is logged as a warning but not rejected

## Known gaps and follow-ups

The following items are **intent vs current code** drifts that this spec documents as-is. Each item is a candidate for a separate refactor PR.

- **Tie-break priority order drift.** Intent: `composition → variety → anti-repeat → iLevel → keystone`. Current code: scores keystone-width before iLevel during BR/BL/CAC/DIST assignment and applies anti-repeat only as a final swap pass.
- **BR/BL satisfaction asymmetry.** BR checks only `members[0].battleRez`; BL performs no existence check at all. Intent is "any party member with the utility satisfies the slot", for both. Suggested fix: introduce a single helper `partyHas(party, 'BR' | 'BL')` that scans all members.
- **Crash on empty party in `addignDistAndMelees`** (line 457). When the initial party count is higher than `tanks.length + healers.length` and random healer placement collides with a tank's party, a party can stay empty after the tank/healer phase. The DPS-distribution phase then dereferences `party.members[0].iLevel` and throws. Reproducible only under specific RNG sequences.
- **Melee/ranged balance bug in `addignDistAndMelees`.** The reduce that picks the "best" melee (or dist) iterates over the full pool *without* pre-filtering already-used characters. The same "best" candidate is elected for every party. After the first party takes it, subsequent parties hit `usedCharacters.has(meleeToAdd.id)` and add nothing. Fix is one line: filter `melees`/`dists` by `!usedCharacters.has(...)` before reducing.
- **Anti-repeat is post-pass only.** Tests cannot assume "characters grouped last shuffle will not be grouped this shuffle" — only that swaps are biased toward separating them when other constraints allow.
