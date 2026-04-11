'use client';

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';
import {
  type EventParticipant,
  type EventPartyGroup,
  characterToEventParticipant,
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

  // Single effect: derive group structure from parties, overlay fresh
  // character data, and preserve roles from the previous state.
  useEffect(() => {
    // Fresh character data keyed by id
    const freshById = new Map(
      characters.map((c) => [
        String(c.id),
        characterToEventParticipant(c, specLabel(c)),
      ]),
    );

    // Groups from parties (structure = who is in which group/slot)
    // but overlay fresh character data (name, spec, ilvl, etc.)
    const freshGroups = partiesToEventPartyGroups(parties, specLabel).map(
      (g) => ({
        ...g,
        members: g.members.map((m) => {
          if (!m) return null;
          return freshById.get(m.id) ?? m;
        }),
      }),
    );

    setShuffledGroupsFromServer((prev) => {
      if (prev.length === 0) return freshGroups;

      // Merge: keep role from previous state (set at shuffle time)
      const prevById = new Map(prev.map((g) => [g.id, g]));
      return freshGroups.map((fg) => {
        const pg = prevById.get(fg.id);
        if (!pg) return fg;
        return {
          ...fg,
          members: fg.members.map((fm, i) => {
            if (!fm) return null;
            const pm = pg.members[i];
            if (pm && pm.id === fm.id) return { ...fm, role: pm.role };
            return fm;
          }),
        };
      });
    });
  }, [parties, characters, specLabel]);

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

  /**
   * Explicitly update a participant in all groups (including role).
   * Used by admin after editing so the change persists to the backend.
   */
  const updateParticipantInGroups = useCallback(
    (updated: EventParticipant) => {
      setShuffledGroupsFromServer((prev) => {
        const next = prev.map((g) => ({
          ...g,
          members: g.members.map((m) =>
            m && m.id === updated.id ? updated : m,
          ),
        }));
        if (isAdmin) {
          void onPartiesUpdate(eventPartyGroupsToParties(next, characters));
        }
        return next;
      });
    },
    [characters, onPartiesUpdate, isAdmin],
  );

  return { shuffledGroups, setShuffledGroups, updateParticipantInGroups };
}
