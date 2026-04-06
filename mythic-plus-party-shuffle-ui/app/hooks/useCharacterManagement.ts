import { useState } from 'react';
import type { Character } from '@/types/Character';
import {
  deleteCharacter,
  deleteCharacters,
  fetchCharacters as fetchCharactersApi,
} from '@/services/api';

export const useCharacterManagement = (
  eventCode: string,
  refetchCharacters?: () => void,
) => {
  const [createdCharacter, setCreatedCharacter] = useState<Character | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveCharacter = (updatedCharacter: Character) => {
    setCreatedCharacter({ ...updatedCharacter });
    localStorage.setItem('createdCharacter', JSON.stringify(updatedCharacter));
    refetchCharacters?.();
  };

  const handleUpdate = (character: Character) => {
    setCreatedCharacter(character);
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCharacter(id);
      refetchCharacters?.();
    } catch {
      setError('Failed to delete character');
    }
  };

  const handleClear = async (characters: Character[]) => {
    try {
      const ids = characters.map((character) => character.id);
      await deleteCharacters(ids);
      refetchCharacters?.();
    } catch {
      setError('Failed to delete characters');
    }
  };

  return {
    createdCharacter,
    setCreatedCharacter,
    isEditing,
    setIsEditing,
    error,
    handleSaveCharacter,
    handleUpdate,
    handleDelete,
    handleClear,
  };
};
