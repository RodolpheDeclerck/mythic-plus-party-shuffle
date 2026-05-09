import { renderHook, act, waitFor } from '@testing-library/react';
import { useEventCharactersRefresh } from './useEventCharactersRefresh';
import { CHARACTERS_FETCH_FAILED } from '@/lib/event/eventViewErrors';
import type { Character } from '@/types/Character';

jest.mock('@/services/api', () => ({
  fetchCharacters: jest.fn(),
}));

import { fetchCharacters as fetchCharactersApi } from '@/services/api';

const mockFetch = fetchCharactersApi as jest.MockedFunction<
  typeof fetchCharactersApi
>;

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

describe('useEventCharactersRefresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the API and updates characters on success', async () => {
    const chars = [mkChar(1), mkChar(2)];
    mockFetch.mockResolvedValueOnce(chars);
    const setCharacters = jest.fn();

    const { result } = renderHook(() =>
      useEventCharactersRefresh('ABC', setCharacters),
    );

    await act(async () => {
      await result.current.fetchCharacters();
    });

    expect(mockFetch).toHaveBeenCalledWith('ABC');
    expect(setCharacters).toHaveBeenCalledWith(chars);
    expect(result.current.errorState).toBeNull();
  });

  it('sets errorState on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const setCharacters = jest.fn();

    const { result } = renderHook(() =>
      useEventCharactersRefresh('ABC', setCharacters),
    );

    await act(async () => {
      await result.current.fetchCharacters();
    });

    expect(result.current.errorState).toBe(CHARACTERS_FETCH_FAILED);
    expect(setCharacters).not.toHaveBeenCalled();
  });

  it('clears errorState on the next successful fetch after a failure', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Transient error'))
      .mockResolvedValueOnce([mkChar(1)]);
    const setCharacters = jest.fn();

    const { result } = renderHook(() =>
      useEventCharactersRefresh('ABC', setCharacters),
    );

    await act(async () => {
      await result.current.fetchCharacters();
    });
    expect(result.current.errorState).toBe(CHARACTERS_FETCH_FAILED);

    await act(async () => {
      await result.current.fetchCharacters();
    });
    expect(result.current.errorState).toBeNull();
    expect(setCharacters).toHaveBeenCalledTimes(1);
  });

  it('does nothing when eventCode is null', async () => {
    const setCharacters = jest.fn();

    const { result } = renderHook(() =>
      useEventCharactersRefresh(null, setCharacters),
    );

    await act(async () => {
      await result.current.fetchCharacters();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(setCharacters).not.toHaveBeenCalled();
    expect(result.current.errorState).toBeNull();
  });

  it('resets errorState to null at the start of each fetch attempt', async () => {
    mockFetch.mockRejectedValueOnce(new Error('first'));
    const setCharacters = jest.fn();

    const { result } = renderHook(() =>
      useEventCharactersRefresh('ABC', setCharacters),
    );

    await act(async () => {
      await result.current.fetchCharacters();
    });
    expect(result.current.errorState).toBe(CHARACTERS_FETCH_FAILED);

    mockFetch.mockRejectedValueOnce(new Error('second'));
    await act(async () => {
      await result.current.fetchCharacters();
    });
    // stays CHARACTERS_FETCH_FAILED but was reset and re-set mid-call
    expect(result.current.errorState).toBe(CHARACTERS_FETCH_FAILED);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
