import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PartyService } from './party.service';
import { Character } from '../../shared/entities/character.entity';
import { Party } from '../../shared/entities/party.entity';
import { CharacterClass } from '../../shared/enums/characterClass.enum';
import { Role } from '../../shared/enums/role.enum';
import { Specialization } from '../../shared/enums/specialization.enum';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CharacterOverrides = Partial<Character> & { id: number };

/**
 * Minimal Character factory. Defaults produce a valid Protection Warrior tank
 * but any field can be overridden. `role` is kept consistent with
 * `specialization` by default (callers that set one should set the other).
 */
function makeCharacter(overrides: CharacterOverrides): Character {
  const base: Character = {
    id: overrides.id,
    name: `Char-${overrides.id}`,
    characterClass: CharacterClass.Warrior,
    specialization: Specialization.Warrior_Protection,
    iLevel: 440,
    role: Role.Tank,
    bloodLust: false,
    battleRez: false,
    keystoneMinLevel: 2,
    keystoneMaxLevel: 10,
    event: null,
  } as unknown as Character;

  return Object.assign(base, overrides);
}

function makeTank(id: number, iLevel = 440): Character {
  return makeCharacter({
    id,
    specialization: Specialization.Warrior_Protection,
    role: Role.Tank,
    iLevel,
  });
}

function makeHealer(id: number, iLevel = 440): Character {
  return makeCharacter({
    id,
    specialization: Specialization.Priest_Holy,
    role: Role.Heal,
    iLevel,
  });
}

function makeMelee(id: number, iLevel = 440): Character {
  return makeCharacter({
    id,
    specialization: Specialization.Rogue_Assassination,
    role: Role.DPS_CAC,
    iLevel,
  });
}

function makeDist(id: number, iLevel = 440): Character {
  return makeCharacter({
    id,
    specialization: Specialization.Mage_Fire,
    role: Role.DPS_DIST,
    bloodLust: true,
    iLevel,
  });
}

/** DPS with battle rez (Druid Balance). */
function makeBrDist(id: number, iLevel = 440): Character {
  return makeCharacter({
    id,
    specialization: Specialization.Druid_Balance,
    role: Role.DPS_DIST,
    battleRez: true,
    iLevel,
  });
}

/** DPS with bloodlust (Mage Fire defaults). */
function makeBlDist(id: number, iLevel = 440): Character {
  return makeCharacter({
    id,
    specialization: Specialization.Mage_Fire,
    role: Role.DPS_DIST,
    bloodLust: true,
    iLevel,
  });
}

/**
 * Mock Redis client exposing only the subset used by PartyService. All methods
 * operate on an internal in-memory store so tests can make real assertions
 * about what was persisted.
 */
function createMockRedis() {
  const store = new Map<string, string>();
  return {
    store,
    get: jest.fn(async (key: string) => (store.has(key) ? store.get(key)! : null)),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
  };
}

async function buildService(redis = createMockRedis()) {
  const module = await Test.createTestingModule({
    providers: [
      PartyService,
      {
        provide: getRepositoryToken(Character),
        useValue: {
          // PartyService does not currently use the repository in its
          // methods; a stub is enough to satisfy DI.
          find: jest.fn(),
          findOne: jest.fn(),
          save: jest.fn(),
          remove: jest.fn(),
        },
      },
      { provide: 'REDIS_CLIENT', useValue: redis },
    ],
  }).compile();

  const service = module.get(PartyService);
  return { service, redis };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PartyService', () => {
  // Silence the Logger output during tests to keep the output clean.
  beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Redis helpers (stateful persistence)
  // -------------------------------------------------------------------------

  describe('getLastThreeShuffles', () => {
    it('returns an empty array when no history is stored', async () => {
      const { service } = await buildService();
      await expect(service.getLastThreeShuffles('EVT')).resolves.toEqual([]);
    });

    it('parses and returns stored history', async () => {
      const { service, redis } = await buildService();
      const stored: Party[][] = [[{ id: 1, members: [] } as Party]];
      redis.store.set('partyShuffleHistory:EVT', JSON.stringify(stored));

      await expect(service.getLastThreeShuffles('EVT')).resolves.toEqual(stored);
    });

    it('returns at most the last three shuffles', async () => {
      const { service, redis } = await buildService();
      const shuffles: Party[][] = [
        [{ id: 1, members: [] } as Party],
        [{ id: 2, members: [] } as Party],
        [{ id: 3, members: [] } as Party],
        [{ id: 4, members: [] } as Party],
        [{ id: 5, members: [] } as Party],
      ];
      redis.store.set('partyShuffleHistory:EVT', JSON.stringify(shuffles));

      const result = await service.getLastThreeShuffles('EVT');
      expect(result).toHaveLength(3);
      expect(result.map(s => s[0].id)).toEqual([3, 4, 5]);
    });
  });

  describe('saveShuffleToHistory', () => {
    it('appends a new entry to an empty history', async () => {
      const { service, redis } = await buildService();
      const parties: Party[] = [{ id: 1, members: [] } as Party];

      await service.saveShuffleToHistory('EVT', parties);

      const raw = redis.store.get('partyShuffleHistory:EVT');
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw!) as Party[][];
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(parties);
    });

    it('drops the oldest entry when history already contains 3 shuffles', async () => {
      const { service, redis } = await buildService();
      const initial: Party[][] = [
        [{ id: 1, members: [] } as Party],
        [{ id: 2, members: [] } as Party],
        [{ id: 3, members: [] } as Party],
      ];
      redis.store.set('partyShuffleHistory:EVT', JSON.stringify(initial));

      const newShuffle: Party[] = [{ id: 4, members: [] } as Party];
      await service.saveShuffleToHistory('EVT', newShuffle);

      const parsed = JSON.parse(redis.store.get('partyShuffleHistory:EVT')!) as Party[][];
      expect(parsed).toHaveLength(3);
      expect(parsed.map(s => s[0].id)).toEqual([2, 3, 4]);
    });
  });

  describe('getPartiesByEventCode', () => {
    it('returns an empty array when no parties are stored', async () => {
      const { service } = await buildService();
      await expect(service.getPartiesByEventCode('EVT')).resolves.toEqual([]);
    });

    it('returns parsed parties when they exist', async () => {
      const { service, redis } = await buildService();
      const parties: Party[] = [{ id: 42, members: [] } as Party];
      redis.store.set('party:EVT', JSON.stringify(parties));

      await expect(service.getPartiesByEventCode('EVT')).resolves.toEqual(parties);
    });
  });

  describe('saveGroupsToRedis', () => {
    it('serializes parties under the party:<code> key', async () => {
      const { service, redis } = await buildService();
      const parties: Party[] = [{ id: 1, members: [] } as Party];

      await service.saveGroupsToRedis(parties, 'EVT');

      expect(redis.set).toHaveBeenCalledWith('party:EVT', JSON.stringify(parties));
    });

    it('catches Redis errors and does not throw', async () => {
      const redis = createMockRedis();
      redis.set.mockImplementation(async () => {
        throw new Error('redis down');
      });
      const { service } = await buildService(redis);

      await expect(service.saveGroupsToRedis([], 'EVT')).resolves.toBeUndefined();
    });
  });

  describe('deleteShuffleHistory', () => {
    it('clears the history by writing an empty array', async () => {
      const { service, redis } = await buildService();
      redis.store.set('partyShuffleHistory:EVT', JSON.stringify([[{ id: 1, members: [] }]]));

      await service.deleteShuffleHistory('EVT');

      expect(redis.store.get('partyShuffleHistory:EVT')).toBe('[]');
    });
  });

  describe('deleteGroupsFromRedis', () => {
    it('clears both the history and the current parties', async () => {
      const { service, redis } = await buildService();
      redis.store.set('partyShuffleHistory:EVT', '[[{"id":1,"members":[]}]]');
      redis.store.set('party:EVT', '[{"id":1,"members":[]}]');

      await service.deleteGroupsFromRedis('EVT');

      expect(redis.store.get('partyShuffleHistory:EVT')).toBe('[]');
      expect(redis.store.get('party:EVT')).toBe('[]');
    });
  });

  describe('createOrUpdatePartiesToRedis', () => {
    it('persists the shuffle to history and to the current parties key', async () => {
      const { service, redis } = await buildService();
      const parties: Party[] = [{ id: 1, members: [] } as Party];

      await service.createOrUpdatePartiesToRedis(parties, 'EVT');

      const history = JSON.parse(redis.store.get('partyShuffleHistory:EVT')!) as Party[][];
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(parties);

      const current = JSON.parse(redis.store.get('party:EVT')!) as Party[];
      expect(current).toEqual(parties);
    });
  });

  // -------------------------------------------------------------------------
  // shuffleGroups — the core algorithm
  //
  // The algorithm relies on Math.random but several invariants must always
  // hold regardless of the random seed. We assert those invariants rather
  // than exact assignments so the tests stay stable.
  // -------------------------------------------------------------------------

  describe('shuffleGroups', () => {
    it('returns an empty array when no characters are provided', async () => {
      const { service } = await buildService();
      await expect(service.shuffleGroups([], 'EVT')).resolves.toEqual([]);
    });

    it('produces a single full party for 1 tank / 1 heal / 3 dps', async () => {
      const { service } = await buildService();
      const characters: Character[] = [
        makeTank(1),
        makeHealer(2),
        makeMelee(3),
        makeDist(4),
        makeMelee(5),
      ];

      const parties = await service.shuffleGroups(characters, 'EVT');

      expect(parties).toHaveLength(1);
      expect(parties[0].members).toHaveLength(5);

      const ids = parties.flatMap(p => p.members.map(m => m.id)).sort();
      expect(ids).toEqual([1, 2, 3, 4, 5]);

      // Exactly one tank and one healer in the party
      expect(parties[0].members.filter(m => m.role === Role.Tank)).toHaveLength(1);
      expect(parties[0].members.filter(m => m.role === Role.Heal)).toHaveLength(1);
    });

    it('creates one party per tank when tanks dictate the group count', async () => {
      const { service } = await buildService();
      const characters: Character[] = [
        makeTank(1),
        makeTank(2),
        makeHealer(3),
        makeHealer(4),
        makeMelee(5),
        makeMelee(6),
        makeDist(7),
        makeDist(8),
        makeMelee(9),
        makeDist(10),
      ];

      const parties = await service.shuffleGroups(characters, 'EVT');

      expect(parties.length).toBeGreaterThanOrEqual(2);
      // Every non-empty party should contain at most one tank
      for (const party of parties) {
        const tanksInParty = party.members.filter(m => m.role === Role.Tank);
        expect(tanksInParty.length).toBeLessThanOrEqual(1);
      }

      // All characters are assigned exactly once
      const assignedIds = parties.flatMap(p => p.members.map(m => m.id));
      expect(assignedIds.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(new Set(assignedIds).size).toBe(assignedIds.length);
    });

    it('assigns every character to a party (no one is dropped)', async () => {
      const { service } = await buildService();
      const characters: Character[] = [];
      // 3 tanks, 3 heals, 9 dps = 15 total
      for (let i = 1; i <= 3; i++) characters.push(makeTank(i));
      for (let i = 4; i <= 6; i++) characters.push(makeHealer(i));
      for (let i = 7; i <= 11; i++) characters.push(makeMelee(i));
      for (let i = 12; i <= 15; i++) characters.push(makeDist(i));

      const parties = await service.shuffleGroups(characters, 'EVT');

      const assignedIds = parties.flatMap(p => p.members.map(m => m.id)).sort((a, b) => a - b);
      expect(assignedIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });

    it('gives each composed party at most one tank and one healer', async () => {
      const { service } = await buildService();
      const characters: Character[] = [
        makeTank(1),
        makeTank(2),
        makeTank(3),
        makeHealer(4),
        makeHealer(5),
        makeHealer(6),
        makeMelee(7),
        makeMelee(8),
        makeDist(9),
        makeDist(10),
        makeMelee(11),
        makeDist(12),
      ];

      const parties = await service.shuffleGroups(characters, 'EVT');

      for (const party of parties) {
        expect(party.members.filter(m => m.role === Role.Tank).length).toBeLessThanOrEqual(1);
        expect(party.members.filter(m => m.role === Role.Heal).length).toBeLessThanOrEqual(1);
      }
    });

    it('respects the max(tanks, healers, ceil(N/5)) formula for the number of parties', async () => {
      const { service } = await buildService();
      // 2 tanks + 2 heals + 6 dps = 10 characters. Every target has a
      // seeded party so no empty parties are created.
      //   numberOfParties = max(1, tanks=2, healers=2, ceil(10/5)=2) = 2
      const characters: Character[] = [
        makeTank(1),
        makeTank(2),
        makeHealer(3),
        makeHealer(4),
        makeMelee(5),
        makeMelee(6),
        makeMelee(7),
        makeDist(8),
        makeDist(9),
        makeDist(10),
      ];

      const parties = await service.shuffleGroups(characters, 'EVT');

      expect(parties).toHaveLength(2);

      // Every party is fully populated and no character is duplicated.
      const assignedIds = parties.flatMap(p => p.members.map(m => m.id));
      expect(assignedIds).toHaveLength(10);
      expect(new Set(assignedIds).size).toBe(10);

      // Each party has exactly one tank, exactly one healer, and 5 members.
      for (const party of parties) {
        expect(party.members).toHaveLength(5);
        expect(party.members.filter(m => m.role === Role.Tank)).toHaveLength(1);
        expect(party.members.filter(m => m.role === Role.Heal)).toHaveLength(1);
      }
    });

    it('falls back to DPS-only balanced groups when neither tanks nor healers are present', async () => {
      const { service } = await buildService();
      const characters: Character[] = [
        makeMelee(1),
        makeDist(2),
        makeBrDist(3), // battleRez DPS
        makeMelee(4),
        makeBlDist(5), // bloodLust DPS
        makeMelee(6),
        makeDist(7),
      ];

      const parties = await service.shuffleGroups(characters, 'EVT');

      // All DPS assigned
      const ids = parties.flatMap(p => p.members.map(m => m.id)).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7]);

      // No party exceeds 5 members
      for (const party of parties) {
        expect(party.members.length).toBeLessThanOrEqual(5);
      }
    });

    it('places a battle-rez DPS alongside a tank that cannot battle-rez', async () => {
      const { service } = await buildService();
      // Protection warrior (no battle rez), 1 healer, 1 BR DPS, 2 filler DPS
      const characters: Character[] = [
        makeTank(1), // Warrior_Protection -> no BR
        makeHealer(2),
        makeBrDist(3), // Druid Balance -> battleRez true
        makeMelee(4),
        makeDist(5),
      ];

      const parties = await service.shuffleGroups(characters, 'EVT');

      expect(parties).toHaveLength(1);
      const party = parties[0];
      const hasBrMember = party.members.some(m => m.battleRez === true);
      expect(hasBrMember).toBe(true);
    });

    it('keeps using the existing history to influence the next shuffle', async () => {
      const { service, redis } = await buildService();

      // Seed a history that matches the current ids
      const previousShuffle: Party[] = [
        {
          id: 1,
          members: [
            makeTank(1),
            makeHealer(2),
            makeMelee(3),
            makeDist(4),
            makeMelee(5),
          ],
        } as Party,
      ];
      redis.store.set('partyShuffleHistory:EVT', JSON.stringify([previousShuffle]));

      const characters: Character[] = [
        makeTank(1),
        makeHealer(2),
        makeMelee(3),
        makeDist(4),
        makeMelee(5),
      ];

      const parties = await service.shuffleGroups(characters, 'EVT');

      // With only 5 players, there is only one possible party; the test
      // guarantees the history branch of the algorithm runs without crashing
      // and returns a valid party with all members.
      expect(parties).toHaveLength(1);
      expect(parties[0].members.map(m => m.id).sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles an odd number of DPS-only players by creating multiple groups without losing anyone', async () => {
      const { service } = await buildService();
      const characters: Character[] = [];
      for (let i = 1; i <= 11; i++) characters.push(makeDist(i));

      const parties = await service.shuffleGroups(characters, 'EVT');

      const ids = parties.flatMap(p => p.members.map(m => m.id)).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

      // Each party in the DPS-only branch is filled up to 5 before a new
      // party is started, so at most one party can be partially filled.
      const partial = parties.filter(p => p.members.length < 5);
      expect(partial.length).toBeLessThanOrEqual(1);
    });

    it('distributes lone tanks into their own parties (tanks.length > healers.length)', async () => {
      const { service } = await buildService();
      const characters: Character[] = [
        makeTank(1),
        makeTank(2),
        makeTank(3),
        makeHealer(4),
        makeMelee(5),
        makeDist(6),
      ];

      const parties = await service.shuffleGroups(characters, 'EVT');

      // There must be at least one party per tank
      expect(parties.length).toBeGreaterThanOrEqual(3);

      const tanks = parties.flatMap(p => p.members.filter(m => m.role === Role.Tank));
      expect(tanks.map(t => t.id).sort()).toEqual([1, 2, 3]);
    });
  });
});
