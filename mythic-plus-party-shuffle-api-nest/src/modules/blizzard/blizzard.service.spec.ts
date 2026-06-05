import { CharacterClass, Specialization } from '@prisma/client';
import { BlizzardService } from './blizzard.service';
import { UnmappableBlizzardCharacterException } from './errors';

function createConfig() {
  const values: Record<string, unknown> = {
    'blizzard.apiHost': 'https://us.api.blizzard.com',
    'blizzard.namespace': 'profile-us',
    'blizzard.locale': 'en_US',
  };
  return { get: jest.fn((k: string) => values[k]) };
}

function createTokenVault() {
  return { getBlizzardToken: jest.fn().mockResolvedValue('blizz-token') };
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('BlizzardService', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  function makeService(fetchImpl: jest.Mock) {
    global.fetch = fetchImpl as unknown as typeof fetch;
    return new BlizzardService(
      createConfig() as any,
      createTokenVault() as any,
    );
  }

  describe('getCharacters', () => {
    it('flattens wow_accounts and maps class ids to enums', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          wow_accounts: [
            {
              characters: [
                {
                  name: 'Thrall',
                  level: 70,
                  realm: { slug: 'illidan', name: 'Illidan' },
                  playable_class: { id: 7 },
                },
                {
                  name: 'Jaina',
                  level: 70,
                  realm: { slug: 'area-52', name: 'Area 52' },
                  playable_class: { id: 8 },
                },
              ],
            },
          ],
        }),
      );
      const service = makeService(fetchMock);

      const roster = await service.getCharacters('auth', 1);

      expect(roster).toEqual([
        {
          name: 'Thrall',
          realmSlug: 'illidan',
          realmName: 'Illidan',
          characterClass: CharacterClass.Shaman,
          level: 70,
        },
        {
          name: 'Jaina',
          realmSlug: 'area-52',
          realmName: 'Area 52',
          characterClass: CharacterClass.Mage,
          level: 70,
        },
      ]);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/profile/user/wow');
      expect(url).toContain('namespace=profile-us');
    });

    it('returns an empty list when there are no characters', async () => {
      const service = makeService(
        jest.fn().mockResolvedValue(jsonResponse({ wow_accounts: [] })),
      );
      expect(await service.getCharacters('auth', 1)).toEqual([]);
    });

    it('skips characters whose class id is unmapped', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          wow_accounts: [
            {
              characters: [
                {
                  name: 'Known',
                  level: 70,
                  realm: { slug: 'r', name: 'R' },
                  playable_class: { id: 1 },
                },
                {
                  name: 'Future',
                  level: 70,
                  realm: { slug: 'r', name: 'R' },
                  playable_class: { id: 999 },
                },
              ],
            },
          ],
        }),
      );
      const service = makeService(fetchMock);

      const roster = await service.getCharacters('auth', 1);

      expect(roster.map((c) => c.name)).toEqual(['Known']);
    });
  });

  describe('getCharacter', () => {
    it('maps spec + item level and lowercases realm/name in the URL', async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        jsonResponse({
          name: 'Thrall',
          realm: { slug: 'illidan' },
          character_class: { id: 7 },
          active_spec: { id: 263 },
          average_item_level: 489,
        }),
      );
      const service = makeService(fetchMock);

      const result = await service.getCharacter('auth', 1, 'Illidan', 'Thrall');

      expect(result).toEqual({
        name: 'Thrall',
        realmSlug: 'illidan',
        characterClass: CharacterClass.Shaman,
        specialization: Specialization.Shaman_Enhancement,
        iLevel: 489,
      });
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('/profile/wow/character/illidan/thrall');
    });

    it('throws NotFoundException on a 404', async () => {
      const service = makeService(
        jest.fn().mockResolvedValue(jsonResponse({}, 404)),
      );
      await expect(
        service.getCharacter('auth', 1, 'r', 'ghost'),
      ).rejects.toThrow('Character not found');
    });
  });

  describe('mapToCharacter (Frost disambiguation)', () => {
    it('maps Mage Frost (spec 64) to Mage_Frost', () => {
      const service = new BlizzardService(
        createConfig() as any,
        createTokenVault() as any,
      );
      const r = service.mapToCharacter({
        name: 'M',
        realmSlug: 'r',
        classId: 8,
        specId: 64,
        averageItemLevel: 600,
      });
      expect(r.specialization).toBe(Specialization.Mage_Frost);
      expect(r.characterClass).toBe(CharacterClass.Mage);
    });

    it('maps Death Knight Frost (spec 251) to DeathKnight_Frost', () => {
      const service = new BlizzardService(
        createConfig() as any,
        createTokenVault() as any,
      );
      const r = service.mapToCharacter({
        name: 'D',
        realmSlug: 'r',
        classId: 6,
        specId: 251,
        averageItemLevel: 600,
      });
      expect(r.specialization).toBe(Specialization.DeathKnight_Frost);
      expect(r.characterClass).toBe(CharacterClass.Deathknight);
    });

    it('rejects an unknown class id', () => {
      const service = new BlizzardService(
        createConfig() as any,
        createTokenVault() as any,
      );
      expect(() =>
        service.mapToCharacter({
          name: 'X',
          realmSlug: 'r',
          classId: 999,
          specId: 64,
        }),
      ).toThrow(UnmappableBlizzardCharacterException);
    });

    it('rejects an unknown spec id', () => {
      const service = new BlizzardService(
        createConfig() as any,
        createTokenVault() as any,
      );
      expect(() =>
        service.mapToCharacter({
          name: 'X',
          realmSlug: 'r',
          classId: 8,
          specId: 99999,
        }),
      ).toThrow(UnmappableBlizzardCharacterException);
    });
  });
});
