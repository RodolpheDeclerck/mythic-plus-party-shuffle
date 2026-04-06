'use client';

import { useState, useCallback } from 'react';

import { upsertCharacter } from '@/services/api';
import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';

export type UseEventViewPartyActionsParams = {
  characters: Character[];
  createdCharacter: Character | null;
  setCreatedCharacter: (c: Character | null) => void;
  setParties: (parties: Party[]) => void;
  updatePartiesInBackend: (parties: Party[]) => Promise<void>;
  handleShuffle: (
    createdCharacter: Character | null,
    setCreatedCharacter: (c: Character | null) => void,
  ) => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
  handleClear: (chars: Character[]) => Promise<void>;
  fetchCharacters: () => void | Promise<void>;
  router: { push: (href: string) => void };
};

export function useEventViewPartyActions({
  characters,
  createdCharacter,
  setCreatedCharacter,
  setParties,
  updatePartiesInBackend,
  handleShuffle,
  handleDelete,
  handleClear,
  fetchCharacters,
  router,
}: UseEventViewPartyActionsParams) {
  const [shufflePending, setShufflePending] = useState(false);

  const handleShuffleWrapper = useCallback(async () => {
    setShufflePending(true);
    try {
      await handleShuffle(createdCharacter, setCreatedCharacter);
    } finally {
      setShufflePending(false);
    }
  }, [handleShuffle, createdCharacter, setCreatedCharacter]);

  const handlePartiesUpdate = useCallback(
    async (next: Party[]) => {
      setParties(next);
      await updatePartiesInBackend(next);
    },
    [setParties, updatePartiesInBackend],
  );

  const handleSaveParticipant = useCallback(
    async (payload: Character & { eventCode: string }) => {
      await upsertCharacter(payload);
      await fetchCharacters();
    },
    [fetchCharacters],
  );

  const handleViewerLeave = useCallback(async () => {
    const id = createdCharacter?.id;
    if (id != null) {
      await handleDelete(id);
    }
    localStorage.removeItem('createdCharacter');
    setCreatedCharacter(null);
    router.push('/');
  }, [createdCharacter?.id, handleDelete, router, setCreatedCharacter]);

  const handleClearAllCharacters = useCallback(() => {
    void handleClear(characters);
  }, [handleClear, characters]);

  return {
    shufflePending,
    handleShuffleWrapper,
    handlePartiesUpdate,
    handleSaveParticipant,
    handleViewerLeave,
    handleClearAllCharacters,
  };
}
