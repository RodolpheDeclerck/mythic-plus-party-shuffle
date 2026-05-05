import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import useFetchCharacters from './useFetchCharacters';
import { CHARACTERS_FETCH_FAILED } from '@/lib/event/eventViewErrors';
import type { Character } from '@/types/Character';

jest.mock('axios');
const mockAxiosGet = axios.get as jest.MockedFunction<typeof axios.get>;

const mkChar = (id: number): Character => ({
  id,
  name: `C${id}`,
  characterClass: 'Warrior',
  specialization: 'Warrior_Arms',
  iLevel: 620,
  role: 'CAC',
  bloodLust: false,
  battleRez: false,
  keystoneMinLevel: 2,
  keystoneMaxLevel: 10,
});

describe('useFetchCharacters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches characters on mount and sets loading to false on success', async () => {
    const chars = [mkChar(1), mkChar(2)];
    mockAxiosGet.mockResolvedValueOnce({ data: chars });

    const { result } = renderHook(() => useFetchCharacters('ABC'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.characters).toEqual(chars);
    expect(result.current.charactersFetchErrorCode).toBeNull();
  });

  it('returns empty characters and no error code initially', () => {
    mockAxiosGet.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useFetchCharacters('ABC'));

    expect(result.current.characters).toEqual([]);
    expect(result.current.charactersFetchErrorCode).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it(
    'sets charactersFetchErrorCode after all retries are exhausted',
    async () => {
      mockAxiosGet.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFetchCharacters('ABC'));

      await waitFor(
        () => expect(result.current.loading).toBe(false),
        { timeout: 6000 },
      );

      expect(result.current.charactersFetchErrorCode).toBe(
        CHARACTERS_FETCH_FAILED,
      );
      expect(result.current.characters).toEqual([]);
      // initial attempt + 2 retries
      expect(mockAxiosGet).toHaveBeenCalledTimes(3);
    },
    10000,
  );

  it(
    'succeeds on a later retry and clears the error',
    async () => {
      const chars = [mkChar(42)];
      mockAxiosGet
        .mockRejectedValueOnce(new Error('first fail'))
        .mockResolvedValueOnce({ data: chars });

      const { result } = renderHook(() => useFetchCharacters('ABC'));

      await waitFor(
        () => expect(result.current.loading).toBe(false),
        { timeout: 4000 },
      );

      expect(result.current.characters).toEqual(chars);
      expect(result.current.charactersFetchErrorCode).toBeNull();
      expect(mockAxiosGet).toHaveBeenCalledTimes(2);
    },
    8000,
  );

  it('does not update state after unmount', async () => {
    let resolve!: (v: unknown) => void;
    mockAxiosGet.mockReturnValueOnce(
      new Promise((res) => {
        resolve = res;
      }),
    );

    const { result, unmount } = renderHook(() => useFetchCharacters('ABC'));
    unmount();
    resolve({ data: [mkChar(1)] });

    // wait a tick to ensure no state update throws
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.characters).toEqual([]);
  });

  it('re-fetches when eventCode changes', async () => {
    const chars1 = [mkChar(1)];
    const chars2 = [mkChar(2)];
    mockAxiosGet
      .mockResolvedValueOnce({ data: chars1 })
      .mockResolvedValueOnce({ data: chars2 });

    const { result, rerender } = renderHook(
      ({ code }) => useFetchCharacters(code),
      { initialProps: { code: 'CODE1' } },
    );

    await waitFor(() => expect(result.current.characters).toEqual(chars1));

    rerender({ code: 'CODE2' });

    await waitFor(() => expect(result.current.characters).toEqual(chars2));
    expect(mockAxiosGet).toHaveBeenCalledTimes(2);
  });
});
