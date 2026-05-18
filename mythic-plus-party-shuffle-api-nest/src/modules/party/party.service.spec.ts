// Tests for PartyService.shuffleGroups.
//
// IMPORTANT — non-determinism strategy (see openspec/specs/shuffle/spec.md
// invariant 9): the algorithm calls Math.random and shuffleArray throughout.
// Two strategies are used in this file:
//
//   (A) Property-based: assert only on structural invariants that hold
//       regardless of internal randomness (role caps, party count, etc.).
//       Used by default — most tests.
//
//   (B) Seeded randomness: jest.spyOn(Math, 'random') with a deterministic
//       sequence to assert on specific tie-break behavior. Reserved for
//       tests that explicitly need ordering control.
//
// Tests never assert on "character X lands in party Y" without strategy B.

import type { Character } from '@prisma/client';
import { PartyService } from './party.service';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Mock Redis: by default returns no shuffle history. Override `get` for
 * tests that need to inject a history.
 */
function createMockRedis(initialHistory: unknown = null) {
  let stored: string | null =
    initialHistory === null ? null : JSON.stringify(initialHistory);
  return {
    get: jest.fn(async () => stored),
    set: jest.fn(async (_key: string, value: string) => {
      stored = value;
      return 'OK';
    }),
    del: jest.fn(async () => 1),
  };
}

type RoleKind = 'TANK' | 'HEAL' | 'CAC' | 'DIST';

interface CharOverrides {
  id?: number;
  name?: string;
  role?: RoleKind;
  iLevel?: number;
  keystoneMinLevel?: number;
  keystoneMaxLevel?: number;
  battleRez?: boolean;
  bloodLust?: boolean;
  specialization?: Character['specialization'];
}

let idCounter = 1;

function mkChar(role: RoleKind, overrides: CharOverrides = {}): Character {
  // Default spec per role (no utility unless explicitly requested)
  const defaultSpec: Character['specialization'] =
    role === 'TANK'
      ? 'Warrior_Protection'
      : role === 'HEAL'
        ? 'Priest_Discipline'
        : role === 'CAC'
          ? 'Warrior_Arms'
          : 'Mage_Fire';

  const id = overrides.id ?? idCounter++;
  return {
    id,
    name: overrides.name ?? `${role}-${id}`,
    role,
    iLevel: overrides.iLevel ?? 620,
    keystoneMinLevel: overrides.keystoneMinLevel ?? 8,
    keystoneMaxLevel: overrides.keystoneMaxLevel ?? 12,
    battleRez: overrides.battleRez ?? false,
    bloodLust: overrides.bloodLust ?? false,
    specialization:
      overrides.specialization ?? (defaultSpec as Character['specialization']),
    // Fields not used by shuffleGroups but required by Character type
    characterClass: 'Warrior',
    eventCode: 'TEST',
    userId: null,
  } as Character;
}

function makeService(history: unknown = null) {
  const redis = createMockRedis(history);
  const svc = new PartyService(redis as never);
  return { svc, redis };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PartyService.shuffleGroups', () => {
  beforeEach(() => {
    idCounter = 1;
  });

  describe('role caps per party (invariant 1)', () => {
    const buildRoster = () => [
      // 2 tanks
      mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
      mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
      // 2 healers
      mkChar('HEAL', { specialization: 'Priest_Discipline' as never }),
      mkChar('HEAL', { specialization: 'Priest_Holy' as never }),
      // 6 DPS (3 CAC + 3 DIST)
      mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
      mkChar('CAC', { specialization: 'Warrior_Fury' as never }),
      mkChar('CAC', { specialization: 'Rogue_Outlaw' as never }),
      mkChar('DIST', { specialization: 'Mage_Fire' as never }),
      mkChar('DIST', { specialization: 'Mage_Frost' as never }),
      mkChar('DIST', { specialization: 'Hunter_Marksmanship' as never }),
    ];

    it('every party has ≤1 tank', async () => {
      const { svc } = makeService();
      const parties = await svc.shuffleGroups(buildRoster(), 'EVT');
      for (const p of parties) {
        const tanks = p.members.filter((m) => m.role === 'TANK');
        expect(tanks.length).toBeLessThanOrEqual(1);
      }
    });

    it('every party has ≤1 healer', async () => {
      const { svc } = makeService();
      const parties = await svc.shuffleGroups(buildRoster(), 'EVT');
      for (const p of parties) {
        const heals = p.members.filter((m) => m.role === 'HEAL');
        expect(heals.length).toBeLessThanOrEqual(1);
      }
    });

    it('every party has ≤3 DPS (CAC + DIST combined)', async () => {
      const { svc } = makeService();
      const parties = await svc.shuffleGroups(buildRoster(), 'EVT');
      for (const p of parties) {
        const dps = p.members.filter(
          (m) => m.role === 'CAC' || m.role === 'DIST',
        );
        expect(dps.length).toBeLessThanOrEqual(3);
      }
    });

    it('every party has size ≤5', async () => {
      const { svc } = makeService();
      const parties = await svc.shuffleGroups(buildRoster(), 'EVT');
      for (const p of parties) {
        expect(p.members.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('party count formula (invariant 3)', () => {
    it('3 tanks, 2 healers, 5 DPS → 3 parties (driven by tanks)', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
        mkChar('TANK', { specialization: 'Druid_Guardian' as never }),
        mkChar('HEAL', { specialization: 'Priest_Discipline' as never }),
        mkChar('HEAL', { specialization: 'Priest_Holy' as never }),
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        mkChar('CAC', { specialization: 'Warrior_Fury' as never }),
        mkChar('CAC', { specialization: 'Rogue_Outlaw' as never }),
        mkChar('DIST', { specialization: 'Mage_Fire' as never }),
        mkChar('DIST', { specialization: 'Mage_Frost' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(3);
    });

    it('1 tank, 4 healers, 0 DPS → 4 parties (driven by healers)', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('HEAL', { specialization: 'Priest_Discipline' as never }),
        mkChar('HEAL', { specialization: 'Priest_Holy' as never }),
        mkChar('HEAL', { specialization: 'Paladin_Holy' as never }),
        mkChar('HEAL', { specialization: 'Shaman_Restoration' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(4);
    });

    it('3 tanks, 3 healers, 9 DPS → at least 3 parties (each tank gets a party, no empty party so no crash)', async () => {
      // NOTE: a roster like 2T+2H+11DPS would compute ceil(15/5)=3 parties
      // but only 2 tanks would fill 2 of them and the bug in
      // addignDistAndMelees (see spec "Known gaps") can trigger a crash when
      // a 3rd party stays empty. We use 3T+3H here so every initial party
      // gets a tank and the crash path isn't exercised.
      const { svc } = makeService();
      const roster = [
        ...Array.from({ length: 3 }, (_, i) =>
          mkChar('TANK', {
            specialization: (i === 0
              ? 'Warrior_Protection'
              : i === 1
                ? 'Paladin_Protection'
                : 'Druid_Guardian') as never,
          }),
        ),
        ...Array.from({ length: 3 }, () =>
          mkChar('HEAL', { specialization: 'Priest_Discipline' as never }),
        ),
        ...Array.from({ length: 5 }, () =>
          mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        ),
        ...Array.from({ length: 4 }, () =>
          mkChar('DIST', { specialization: 'Mage_Fire' as never }),
        ),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties.length).toBeGreaterThanOrEqual(3);
      const totalPlaced = parties.reduce((sum, p) => sum + p.members.length, 0);
      expect(totalPlaced).toBe(15);
      for (const p of parties) {
        expect(p.members.length).toBeLessThanOrEqual(5);
      }
    });

    it('0 tanks, 0 healers, 7 DPS → all-DPS mode, parties of ≤5', async () => {
      const { svc } = makeService();
      const roster = Array.from({ length: 4 }, () =>
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
      ).concat(
        Array.from({ length: 3 }, () =>
          mkChar('DIST', { specialization: 'Mage_Fire' as never }),
        ),
      );
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties.length).toBeGreaterThanOrEqual(1);
      for (const p of parties) {
        expect(p.members.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('tank/healer assignment (invariant 4)', () => {
    it('every tank is placed in exactly one party', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
        mkChar('TANK', { specialization: 'Druid_Guardian' as never }),
        mkChar('HEAL', { specialization: 'Priest_Discipline' as never }),
        mkChar('HEAL', { specialization: 'Priest_Holy' as never }),
        ...Array.from({ length: 5 }, () =>
          mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        ),
      ];
      const tankIds = new Set(
        roster.filter((c) => c.role === 'TANK').map((c) => c.id),
      );
      const parties = await svc.shuffleGroups(roster, 'EVT');
      const placedTankIds = parties.flatMap((p) =>
        p.members.filter((m) => m.role === 'TANK').map((m) => m.id),
      );
      expect(new Set(placedTankIds)).toEqual(tankIds);
      expect(placedTankIds).toHaveLength(tankIds.size); // no duplicates
    });

    it('every healer is placed in exactly one party', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
        mkChar('HEAL', { specialization: 'Priest_Discipline' as never }),
        mkChar('HEAL', { specialization: 'Priest_Holy' as never }),
        mkChar('HEAL', { specialization: 'Shaman_Restoration' as never }),
        ...Array.from({ length: 5 }, () =>
          mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        ),
      ];
      const healerIds = new Set(
        roster.filter((c) => c.role === 'HEAL').map((c) => c.id),
      );
      const parties = await svc.shuffleGroups(roster, 'EVT');
      const placedHealerIds = parties.flatMap((p) =>
        p.members.filter((m) => m.role === 'HEAL').map((m) => m.id),
      );
      expect(new Set(placedHealerIds)).toEqual(healerIds);
      expect(placedHealerIds).toHaveLength(healerIds.size);
    });

    it('with 2 tanks and 1 healer, the healer lands in one of the 2 existing parties (not a new one)', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
        mkChar('HEAL', { specialization: 'Priest_Discipline' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      // Initial allocation = max(1, 2, 1, ceil(3/5)) = 2. With 1 healer and no
      // leftover DPS, no extra party should be created.
      expect(parties).toHaveLength(2);
      const partyWithHealer = parties.find((p) =>
        p.members.some((m) => m.role === 'HEAL'),
      );
      expect(partyWithHealer).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('empty roster returns an empty array', async () => {
      const { svc } = makeService();
      const parties = await svc.shuffleGroups([], 'EVT');
      expect(parties).toEqual([]);
    });

    it('1 character → 1 party of 1', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(1);
      expect(parties[0].members).toHaveLength(1);
    });

    it('4 mixed-role characters → 1 party of all 4, role caps respected', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('HEAL', { specialization: 'Priest_Discipline' as never }),
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        mkChar('DIST', { specialization: 'Mage_Fire' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(1);
      expect(parties[0].members).toHaveLength(4);
      const tanks = parties[0].members.filter((m) => m.role === 'TANK');
      const heals = parties[0].members.filter((m) => m.role === 'HEAL');
      expect(tanks).toHaveLength(1);
      expect(heals).toHaveLength(1);
    });

    it('6 tanks, no healers, no DPS → 6 parties of 1 tank each (role cap drives count)', async () => {
      const { svc } = makeService();
      const roster = Array.from({ length: 6 }, (_, i) =>
        mkChar('TANK', {
          specialization: (i % 2 === 0
            ? 'Warrior_Protection'
            : 'Paladin_Protection') as never,
        }),
      );
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(6);
      for (const p of parties) {
        const tanks = p.members.filter((m) => m.role === 'TANK');
        expect(tanks).toHaveLength(1);
        expect(p.members).toHaveLength(1);
      }
    });

    it('keystone spread > 4 levels in a single party does not throw', async () => {
      const { svc } = makeService();
      // Only 2 chars, both forced into one party; intentionally wide keystone gap
      const roster = [
        mkChar('TANK', {
          specialization: 'Warrior_Protection' as never,
          keystoneMinLevel: 2,
          keystoneMaxLevel: 4,
        }),
        mkChar('HEAL', {
          specialization: 'Priest_Discipline' as never,
          keystoneMinLevel: 14,
          keystoneMaxLevel: 18,
        }),
      ];
      await expect(svc.shuffleGroups(roster, 'EVT')).resolves.toBeDefined();
    });
  });

  describe('utility distribution: battle rez (invariant 5)', () => {
    it('every party gets a BR carrier when tanks have no BR and BR DPS are available', async () => {
      const { svc } = makeService();
      // 2 parties, plain tanks (no BR), 2 BR DPS + 4 plain DPS to fill
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
        mkChar('CAC', {
          specialization: 'Druid_Feral' as never,
          battleRez: true,
        }),
        mkChar('DIST', {
          specialization: 'Druid_Balance' as never,
          battleRez: true,
        }),
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        mkChar('CAC', { specialization: 'Warrior_Fury' as never }),
        mkChar('DIST', { specialization: 'Mage_Fire' as never }),
        mkChar('DIST', { specialization: 'Mage_Frost' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      // Initial allocation: max(1, 2, 0, ceil(8/5)=2) = 2 parties.
      expect(parties).toHaveLength(2);
      for (const p of parties) {
        const brCarriers = p.members.filter((m) => m.battleRez);
        expect(brCarriers.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('a tank with BR satisfies the slot — no extra BR DPS is added to that party (members[0] check)', async () => {
      const { svc } = makeService();
      // 1 party, 1 BR tank, no other BR carriers available, plenty of plain DPS
      const roster = [
        mkChar('TANK', {
          specialization: 'Druid_Guardian' as never,
          battleRez: true,
        }),
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        mkChar('CAC', { specialization: 'Warrior_Fury' as never }),
        mkChar('DIST', { specialization: 'Mage_Fire' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(1);
      const brCarriers = parties[0].members.filter((m) => m.battleRez);
      expect(brCarriers).toHaveLength(1); // only the tank
      expect(brCarriers[0].role).toBe('TANK');
    });

    it('a healer with BR (members[1]) does NOT satisfy the slot — another BR DPS is still added (shallow check gap)', async () => {
      const { svc } = makeService();
      // 1 party. Tank without BR, healer with BR. A BR DPS is available.
      // Per current code (only checks members[0]), a BR DPS will still be added.
      const roster = [
        mkChar('TANK', {
          specialization: 'Warrior_Protection' as never,
          battleRez: false,
        }),
        mkChar('HEAL', {
          specialization: 'Druid_Restoration' as never,
          battleRez: true,
        }),
        mkChar('CAC', {
          specialization: 'Druid_Feral' as never,
          battleRez: true,
        }),
        // Some filler so the party can fit everyone
        mkChar('DIST', { specialization: 'Mage_Fire' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(1);
      const brCarriers = parties[0].members.filter((m) => m.battleRez);
      // Documents the current shallow behavior: 2 BR carriers (healer + DPS),
      // even though intent would say the healer's BR satisfies the slot.
      expect(brCarriers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('utility distribution: bloodlust (invariant 5)', () => {
    it('every non-empty party receives a BL carrier when BL DPS are available', async () => {
      const { svc } = makeService();
      // 2 plain tanks, 2 BL DPS (Mage_Fire, Mage_Frost), filler CACs
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
        mkChar('DIST', {
          specialization: 'Mage_Fire' as never,
          bloodLust: true,
        }),
        mkChar('DIST', {
          specialization: 'Mage_Frost' as never,
          bloodLust: true,
        }),
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        mkChar('CAC', { specialization: 'Warrior_Fury' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(2);
      for (const p of parties) {
        const blCarriers = p.members.filter((m) => m.bloodLust);
        expect(blCarriers.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('BL has no existence check: a BL carrier is added even when no one needs it (here: no asymmetry test, just documents no-check behavior)', async () => {
      // The BL code path always tries to add a BL when one is available, with
      // no check on existing members' bloodLust. This is hard to test directly
      // because no realistic tank spec carries bloodLust in WoW. Instead we
      // verify the dual: BL is added to a party that has only a tank, when
      // a BL DPS is the only DPS option.
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', {
          specialization: 'Warrior_Protection' as never,
          bloodLust: false,
        }),
        mkChar('DIST', {
          specialization: 'Mage_Fire' as never,
          bloodLust: true,
        }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(1);
      const blCarriers = parties[0].members.filter((m) => m.bloodLust);
      expect(blCarriers).toHaveLength(1);
    });
  });

  describe('melee/ranged balance (invariant 2)', () => {
    it('with 2 parties, 2 CAC, 2 DIST → all 4 DPS are placed somewhere (variety per party is NOT guaranteed: see spec gap on addignDistAndMelees)', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        mkChar('CAC', { specialization: 'Warrior_Fury' as never }),
        mkChar('DIST', { specialization: 'Mage_Fire' as never }),
        mkChar('DIST', { specialization: 'Mage_Frost' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(2);
      const totalPlaced = parties.reduce((s, p) => s + p.members.length, 0);
      expect(totalPlaced).toBe(6);
      // Documents the current addignDistAndMelees bug: the same "best" CAC is
      // picked for every party, so subsequent parties get no CAC via the
      // melee-balancing path. completePartiesWithRemainingDPS may or may not
      // fill the gap. We assert only that all characters are placed.
      const totalCacPlaced = parties
        .flatMap((p) => p.members)
        .filter((m) => m.role === 'CAC').length;
      const totalDistPlaced = parties
        .flatMap((p) => p.members)
        .filter((m) => m.role === 'DIST').length;
      expect(totalCacPlaced).toBe(2);
      expect(totalDistPlaced).toBe(2);
    });

    it('with 2 parties, 1 CAC, 3 DIST → only one party has a CAC (no borrowing from DIST pool)', async () => {
      const { svc } = makeService();
      const roster = [
        mkChar('TANK', { specialization: 'Warrior_Protection' as never }),
        mkChar('TANK', { specialization: 'Paladin_Protection' as never }),
        mkChar('CAC', { specialization: 'Warrior_Arms' as never }),
        mkChar('DIST', { specialization: 'Mage_Fire' as never }),
        mkChar('DIST', { specialization: 'Mage_Frost' as never }),
        mkChar('DIST', { specialization: 'Hunter_Marksmanship' as never }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(2);
      const partiesWithCac = parties.filter((p) =>
        p.members.some((m) => m.role === 'CAC'),
      );
      expect(partiesWithCac).toHaveLength(1);
    });
  });

  describe('keystone matching via shuffle history (invariant 6)', () => {
    // filterEligibleMembers only kicks in when previousShuffles.length > 0,
    // so these tests inject a non-trivial (but irrelevant) history to enable
    // the keystone filter path.
    const dummyHistory = [
      [
        { id: 999, members: [] }, // synthetic, doesn't match any real char
      ],
    ];

    it('strict keystone match: a candidate fully covering the party range is preferred', async () => {
      const { svc } = makeService(dummyHistory);
      // Party: 1 tank with keystone [10-12]
      // 2 CAC candidates:
      //   - A: keystone [8-14] → fully covers party range → strict match
      //   - B: keystone [11-11] → narrower but does NOT cover [10-12]
      //   - Both same iLevel
      const roster = [
        mkChar('TANK', {
          specialization: 'Warrior_Protection' as never,
          keystoneMinLevel: 10,
          keystoneMaxLevel: 12,
          iLevel: 620,
        }),
        mkChar('CAC', {
          name: 'CAC-COVERS',
          specialization: 'Warrior_Arms' as never,
          keystoneMinLevel: 8,
          keystoneMaxLevel: 14,
          iLevel: 620,
        }),
        mkChar('CAC', {
          name: 'CAC-NARROW-NOCOVER',
          specialization: 'Warrior_Fury' as never,
          keystoneMinLevel: 11,
          keystoneMaxLevel: 11,
          iLevel: 620,
        }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(1);
      // Both CACs end up in the party (only 3 chars total, fits in 1 party of 5).
      // What we assert is the picking ORDER during addignDistAndMelees:
      // the strict-cover candidate should be picked first, hence its slot in
      // the party should be members[1] (after the tank at members[0]).
      // completePartiesWithRemainingDPS adds the leftover after, as members[2].
      expect(parties[0].members[1].name).toBe('CAC-COVERS');
    });

    it('±2 tolerance fallback: when no strict match exists, a candidate within ±2 is acceptable', async () => {
      const { svc } = makeService(dummyHistory);
      // Party tank: keystone [10-12]
      // CAC candidates:
      //   - Within tolerance: keystone [9-13] (min diff 1, max diff 1) ✓
      //   - Far: keystone [2-4] (min diff 8, max diff 8) ✗ tolerance, falls to last-resort sort
      const roster = [
        mkChar('TANK', {
          specialization: 'Warrior_Protection' as never,
          keystoneMinLevel: 10,
          keystoneMaxLevel: 12,
          iLevel: 620,
        }),
        mkChar('CAC', {
          name: 'CAC-WITHIN-TOLERANCE',
          specialization: 'Warrior_Arms' as never,
          keystoneMinLevel: 9,
          keystoneMaxLevel: 13,
          iLevel: 620,
        }),
        mkChar('CAC', {
          name: 'CAC-FAR',
          specialization: 'Warrior_Fury' as never,
          keystoneMinLevel: 2,
          keystoneMaxLevel: 4,
          iLevel: 620,
        }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(1);
      // The within-tolerance candidate should be picked first.
      expect(parties[0].members[1].name).toBe('CAC-WITHIN-TOLERANCE');
    });
  });

  describe('iLevel tie-break (invariant 7)', () => {
    it('among CAC with same keystone width, the one with iLevel closer to party reference is chosen', async () => {
      // No history needed: we test the reduce() tie-break inside
      // addignDistAndMelees, which fires regardless of history.
      const { svc } = makeService();
      // Party tank: iLevel 620, keystone [10-12]
      // 2 CAC candidates: SAME keystone width (4), different iLevel
      //   - CAC-CLOSE-ILEVEL: iLevel 622 (diff 2)
      //   - CAC-FAR-ILEVEL:   iLevel 640 (diff 20)
      const roster = [
        mkChar('TANK', {
          specialization: 'Warrior_Protection' as never,
          iLevel: 620,
          keystoneMinLevel: 10,
          keystoneMaxLevel: 12,
        }),
        mkChar('CAC', {
          name: 'CAC-CLOSE-ILEVEL',
          specialization: 'Warrior_Arms' as never,
          iLevel: 622,
          keystoneMinLevel: 8,
          keystoneMaxLevel: 12, // width 4
        }),
        mkChar('CAC', {
          name: 'CAC-FAR-ILEVEL',
          specialization: 'Warrior_Fury' as never,
          iLevel: 640,
          keystoneMinLevel: 9,
          keystoneMaxLevel: 13, // width 4 (same as above)
        }),
      ];
      const parties = await svc.shuffleGroups(roster, 'EVT');
      expect(parties).toHaveLength(1);
      expect(parties[0].members[1].name).toBe('CAC-CLOSE-ILEVEL');
    });
  });
});
