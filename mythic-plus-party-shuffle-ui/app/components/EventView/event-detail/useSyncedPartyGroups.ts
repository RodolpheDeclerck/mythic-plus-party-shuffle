'use client';

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';
import {
  type EventPartyGroup,
  eventPartyGroupsToParties,
  partiesToEventPartyGroups,
} from '@/components/EventView/eventPartyModel';

export function useSyncedPartyGroups({
  parties,
  characters,
  isAdmin,
  specLabel,
  onPartiesUpdate,
}: {
  parties: Party[];
  characters: Character[];
  isAdmin: boolean;
  specLabel: (c: Character) => string;
  onPartiesUpdate: (parties: Party[]) => void | Promise<void>;
}) {
  const [shuffledGroups, setShuffledGroupsFromServer] = useState<
    EventPartyGroup[]
  >([]);

  useEffect(() => {
    setShuffledGroupsFromServer(partiesToEventPartyGroups(parties, specLabel));
  }, [parties, specLabel]);

  const setShuffledGroups = useCallback(
    (updater: React.SetStateAction<EventPartyGroup[]>) => {
      setShuffledGroupsFromServer((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (p: EventPartyGroup[]) => EventPartyGroup[])(prev)
            : updater;
        if (isAdmin) {
          void onPartiesUpdate(eventPartyGroupsToParties(next, characters));
        }
        return next;
      });
    },
    [characters, onPartiesUpdate, isAdmin],
  );

  return { shuffledGroups, setShuffledGroups };
}
