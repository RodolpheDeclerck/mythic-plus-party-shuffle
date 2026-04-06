'use client';

import { useState, useCallback } from 'react';

import { fetchCharacters as fetchCharactersApi } from '@/services/api';
import type { Character } from '@/types/Character';
import { CHARACTERS_FETCH_FAILED } from '@/lib/event/eventViewErrors';

export function useEventCharactersRefresh(
  eventCode: string | null,
  setCharacters: (characters: Character[]) => void,
) {
  const [errorState, setErrorState] = useState<string | null>(null);

  const fetchCharacters = useCallback(async () => {
    if (!eventCode) return;
    try {
      const updatedCharacters = await fetchCharactersApi(eventCode);
      setCharacters(updatedCharacters);
    } catch {
      setErrorState(CHARACTERS_FETCH_FAILED);
    }
  }, [eventCode, setCharacters]);

  return { fetchCharacters, errorState };
}
