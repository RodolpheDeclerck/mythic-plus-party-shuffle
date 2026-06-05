import axios from 'axios';
import {
  isNotLinkedError,
  fetchBlizzardRoster,
  fetchBlizzardCharacter,
  BATTLENET_NOT_LINKED,
} from './blizzardClient';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('isNotLinkedError', () => {
  it('is true for a 409 with the not-linked code', () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    const err = { response: { status: 409, data: { code: BATTLENET_NOT_LINKED } } };
    expect(isNotLinkedError(err)).toBe(true);
  });

  it('is false for a 409 with a different code', () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    const err = { response: { status: 409, data: { code: 'SOMETHING_ELSE' } } };
    expect(isNotLinkedError(err)).toBe(false);
  });

  it('is false for a non-409 status', () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    const err = { response: { status: 500, data: { code: BATTLENET_NOT_LINKED } } };
    expect(isNotLinkedError(err)).toBe(false);
  });

  it('is false for a non-axios error', () => {
    mockedAxios.isAxiosError.mockReturnValue(false);
    expect(isNotLinkedError(new Error('boom'))).toBe(false);
  });
});

describe('fetch helpers', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetchBlizzardRoster returns the roster data', async () => {
    const roster = [{ name: 'Thrall', realmSlug: 'illidan' }];
    mockedAxios.get.mockResolvedValue({ data: roster });
    await expect(fetchBlizzardRoster()).resolves.toBe(roster);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/blizzard/characters'),
    );
  });

  it('fetchBlizzardCharacter encodes realm and name in the URL', async () => {
    mockedAxios.get.mockResolvedValue({ data: { name: 'Thrall', iLevel: 489 } });
    await fetchBlizzardCharacter('area 52', 'Thrall');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/blizzard/characters/area%2052/Thrall'),
    );
  });
});
