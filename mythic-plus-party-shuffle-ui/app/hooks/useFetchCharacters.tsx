import { useState, useEffect } from 'react';
import axios from 'axios';
import { Character } from '@/types/Character';
import apiUrl from '@/config/apiConfig';
import {
  CHARACTERS_FETCH_FAILED,
  type CharactersFetchErrorCode,
} from '@/lib/event/eventViewErrors';

const useFetchCharacters = (eventCode: string) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [charactersFetchErrorCode, setCharactersFetchErrorCode] =
    useState<CharactersFetchErrorCode | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await axios.get<Character[]>(
          `${apiUrl}/api/events/${eventCode}/characters`,
        );
        setCharacters(response.data);
      } catch (error) {
        console.error('Error fetching characters:', error);
        setCharactersFetchErrorCode(CHARACTERS_FETCH_FAILED);
      } finally {
        setLoading(false);
      }
    };

    void fetchCharacters();
  }, [eventCode]);

  return {
    characters,
    loading,
    charactersFetchErrorCode,
    setCharacters,
  };
};

export default useFetchCharacters;
