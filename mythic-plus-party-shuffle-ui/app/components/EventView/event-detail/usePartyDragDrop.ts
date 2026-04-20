'use client';

import type { DragEvent, SetStateAction } from 'react';
import { useCallback, useState } from 'react';
import type {
  EventParticipant,
  EventPartyGroup,
} from '@/components/EventView/eventPartyModel';
import { assignedParticipantIds } from './partyGroupUtils';

export type DraggedPartyItem = {
  participant: EventParticipant;
  fromGroupId: string | 'unassigned';
  slotIndex: number;
};

export function usePartyDragDrop(
  setShuffledGroups: (updater: SetStateAction<EventPartyGroup[]>) => void,
  participants: EventParticipant[],
) {
  const [draggedItem, setDraggedItem] = useState<DraggedPartyItem | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  const [dragOverParticipant, setDragOverParticipant] = useState<string | null>(
    null,
  );

  const handleDragStart = useCallback(
    (
      e: DragEvent,
      participant: EventParticipant,
      fromGroupId: string | 'unassigned',
      slotIndex: number,
    ) => {
      setDraggedItem({ participant, fromGroupId, slotIndex });
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', participant.id);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: DragEvent, groupId: string, participantId?: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverGroup(groupId);
      setDragOverParticipant(participantId || null);
    },
    [],
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverGroup(null);
      setDragOverParticipant(null);
    }
  }, []);

  const handleDrop = useCallback(
    (
      e: DragEvent,
      toGroupId: string,
      toSlotIndex: number,
      targetParticipantId?: string,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverGroup(null);
      setDragOverParticipant(null);

      if (!draggedItem) return;

      const {
        participant,
        fromGroupId,
        slotIndex: fromSlotIndex,
      } = draggedItem;

      // Same group, same slot — no-op
      if (fromGroupId === toGroupId && fromSlotIndex === toSlotIndex) {
        setDraggedItem(null);
        return;
      }

      setShuffledGroups((prevGroups) => {
        const newGroups = prevGroups.map((g) => ({
          ...g,
          members: [...g.members],
        }));

        const toGroup = newGroups.find((g) => g.id === toGroupId);
        if (!toGroup) return prevGroups;

        // Bounds check
        if (toSlotIndex < 0 || toSlotIndex >= toGroup.members.length)
          return prevGroups;

        /* ---- unassigned → group ---- */
        if (fromGroupId === 'unassigned') {
          const existing = toGroup.members[toSlotIndex];
          if (
            existing &&
            (!targetParticipantId || existing.id !== targetParticipantId)
          )
            return prevGroups;
          toGroup.members[toSlotIndex] = participant;
          return newGroups;
        }

        /* ---- group → group ---- */
        const fromGroup = newGroups.find((g) => g.id === fromGroupId);
        if (!fromGroup) return prevGroups;

        if (fromSlotIndex < 0 || fromSlotIndex >= fromGroup.members.length)
          return prevGroups;

        const sameGroup = fromGroupId === toGroupId;

        if (sameGroup) {
          const temp = fromGroup.members[toSlotIndex];
          fromGroup.members[toSlotIndex] = participant;
          fromGroup.members[fromSlotIndex] = temp;
        } else {
          const displaced = toGroup.members[toSlotIndex];
          toGroup.members[toSlotIndex] = participant;
          fromGroup.members[fromSlotIndex] = displaced;
        }

        return newGroups;
      });

      setDraggedItem(null);
    },
    [draggedItem, setShuffledGroups],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverGroup(null);
    setDragOverParticipant(null);
  }, []);

  const handleDropToUnassigned = useCallback(
    (e: DragEvent, targetParticipantId?: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverGroup(null);
      setDragOverParticipant(null);

      if (!draggedItem) return;
      if (draggedItem.fromGroupId === 'unassigned') {
        setDraggedItem(null);
        return;
      }

      const {
        participant,
        fromGroupId,
        slotIndex: fromSlotIndex,
      } = draggedItem;

      setShuffledGroups((prevGroups) => {
        const newGroups = prevGroups.map((g) => ({
          ...g,
          members: [...g.members],
        }));

        const fromGroup = newGroups.find((g) => g.id === fromGroupId);
        if (!fromGroup) return prevGroups;

        if (targetParticipantId) {
          const assigned = assignedParticipantIds(newGroups);
          const targetParticipant = participants.find(
            (p) => p.id === targetParticipantId && !assigned.has(p.id),
          );
          if (targetParticipant) {
            // Replace: unassigned participant takes the group slot
            fromGroup.members[fromSlotIndex] = targetParticipant;
            return newGroups;
          }
        }

        // Just remove from group (slot becomes empty)
        fromGroup.members[fromSlotIndex] = null;
        return newGroups;
      });

      setDraggedItem(null);
    },
    [draggedItem, participants, setShuffledGroups],
  );

  const handleAddGroup = useCallback(() => {
    const newGroup: EventPartyGroup = {
      id: `group-${Date.now()}`,
      members: [null, null, null, null, null],
    };
    setShuffledGroups((prev) => [...prev, newGroup]);
  }, [setShuffledGroups]);

  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      setShuffledGroups((prev) => prev.filter((g) => g.id !== groupId));
    },
    [setShuffledGroups],
  );

  return {
    draggedItem,
    dragOverGroup,
    dragOverParticipant,
    setDragOverGroup,
    setDragOverParticipant,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleDropToUnassigned,
    handleAddGroup,
    handleDeleteGroup,
  };
}

export type PartyDragDropApi = ReturnType<typeof usePartyDragDrop>;
