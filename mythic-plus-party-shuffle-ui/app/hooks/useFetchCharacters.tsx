import { useState, useEffect } from 'react';
import axios from 'axios';
import { Character } from '@/types/Character';
import apiUrl from '@/config/apiConfig';
import {
  CHARACTERS_FETCH_FAILED,
  type CharactersFetchErrorCode,
} from '@/lib/event/eventViewErrors';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const useFetchCharacters = (eventCode: string) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [charactersFetchErrorCode, setCharactersFetchErrorCode] =
    useState<CharactersFetchErrorCode | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchWithRetry = async () => {
      let lastError: unknown;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (cancelled) return;
        setCharactersFetchErrorCode(null);
        try {
          const response = await axios.get<Character[]>(
            `${apiUrl}/api/events/${eventCode}/characters`,
          );
          if (!cancelled) setCharacters(response.data);
          return;
        } catch (error) {
          lastError = error;
          if (attempt < MAX_RETRIES) {
            await new Promise<void>((resolve) =>
              setTimeout(resolve, RETRY_DELAY_MS),
            );
          }
        }
      }

      if (!cancelled) {
        console.error('Error fetching characters:', lastError);
        setCharactersFetchErrorCode(CHARACTERS_FETCH_FAILED);
      }
    };

    void fetchWithRetry().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [eventCode]);

  return {
    characters,
    loading,
    charactersFetchErrorCode,
    setCharacters,
  };
};

export default useFetchCharacters;
