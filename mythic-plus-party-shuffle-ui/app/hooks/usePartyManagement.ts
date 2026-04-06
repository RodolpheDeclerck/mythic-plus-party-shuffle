import { useState, useCallback } from 'react';
import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';
import {
  fetchParties as fetchPartiesApi,
  deleteParties,
  shuffleParties,
  saveEventParties,
  setEventPartiesVisibility,
} from '@/services/api';

export const usePartyManagement = (eventCode: string) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchParties = useCallback(async () => {
    if (!eventCode) {
      return;
    }
    try {
      const updatedParties = await fetchPartiesApi(eventCode);
      setParties([...updatedParties]);
    } catch {
      setError('Failed to fetch parties');
    }
  }, [eventCode]);

  const handleClearEvent = async () => {
    if (!eventCode) {
      return;
    }
    try {
      await deleteParties(eventCode);
      setParties([]);
    } catch {
      setError('Failed to delete parties');
    }
  };

  const updatePartiesInBackend = useCallback(
    async (updatedParties: Party[]) => {
      if (!eventCode) {
        return;
      }
      try {
        await saveEventParties(eventCode, updatedParties);
        setError(null);
      } catch {
        setError('Failed to sync party layout');
        try {
          const fresh = await fetchPartiesApi(eventCode);
          setParties([...fresh]);
        } catch {
          setError('Failed to refresh parties');
        }
      }
    },
    [eventCode],
  );

  const swapCharacters = (
    fromPartyIndex: number,
    toPartyIndex: number,
    sourceId: number,
    targetId: number,
  ) => {
    setParties((prevParties) => {
      const updatedParties = prevParties.map((party) => ({
        ...party,
        members: [...party.members],
      }));

      const sourceParty = updatedParties[fromPartyIndex];
      const targetParty = updatedParties[toPartyIndex];

      const sourceMemberIndex = sourceParty.members.findIndex(
        (m) => m.id === sourceId,
      );
      const targetMemberIndex = targetParty.members.findIndex(
        (m) => m.id === targetId,
      );

      if (sourceMemberIndex === -1 || targetMemberIndex === -1) {
        return prevParties;
      }

      [
        sourceParty.members[sourceMemberIndex],
        targetParty.members[targetMemberIndex],
      ] = [
        targetParty.members[targetMemberIndex],
        sourceParty.members[sourceMemberIndex],
      ];

      void updatePartiesInBackend(updatedParties);

      return updatedParties;
    });
  };

  const moveCharacter = (
    fromPartyIndex: number,
    toPartyIndex: number,
    memberId: number,
    toIndex: number,
  ) => {
    setParties((prevParties) => {
      const updatedParties = [...prevParties];
      const sourceParty = updatedParties[fromPartyIndex];
      const targetParty = updatedParties[toPartyIndex];

      if (!sourceParty || !targetParty) {
        return prevParties;
      }

      const memberIndex = sourceParty.members.findIndex(
        (m) => m.id === memberId,
      );
      if (memberIndex === -1) {
        return prevParties;
      }

      const [movedCharacter] = sourceParty.members.splice(memberIndex, 1);

      if (targetParty.members.length < 5) {
        targetParty.members.splice(toIndex, 0, movedCharacter);
      } else {
        sourceParty.members.splice(memberIndex, 0, movedCharacter);
        return prevParties;
      }

      void updatePartiesInBackend(updatedParties);

      return updatedParties;
    });
  };

  const handleShuffle = async (
    createdCharacter: Character | null,
    setCreatedCharacter: (character: Character | null) => void,
  ) => {
    if (!eventCode) {
      return;
    }
    try {
      await setEventPartiesVisibility(eventCode, false);

      const shuffledParties = await shuffleParties(eventCode);
      let updatedCharacter: Character | null = null;

      if (createdCharacter) {
        updatedCharacter =
          shuffledParties
            .flatMap((party) => party.members)
            .find((member) => member.id === createdCharacter.id) ?? null;
      }

      if (updatedCharacter) {
        setCreatedCharacter({ ...updatedCharacter });
        localStorage.setItem(
          'createdCharacter',
          JSON.stringify(updatedCharacter),
        );
      } else {
        setCreatedCharacter(null);
        localStorage.removeItem('createdCharacter');
      }

      setParties([...shuffledParties]);
    } catch {
      setError('Failed to shuffle parties');
    }
  };

  return {
    parties,
    setParties,
    error,
    fetchParties,
    handleClearEvent,
    updatePartiesInBackend,
    swapCharacters,
    moveCharacter,
    handleShuffle,
  };
};
