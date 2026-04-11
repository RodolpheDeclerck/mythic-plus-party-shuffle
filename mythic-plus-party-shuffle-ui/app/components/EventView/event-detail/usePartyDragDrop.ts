'use client';

import type { DragEvent, SetStateAction } from 'react';
import { useCallback, useState } from 'react';
import type {
  EventParticipant,
  EventPartyGroup,
} from '@/components/EventView/eventPartyModel';
import { assignedParticipantIds, getGroupSize } from './partyGroupUtils';

export type DraggedPartyItem = {
  participant: EventParticipant;
  fromGroupId: string | 'unassigned';
  slot: 'tank' | 'healer' | 'dps';
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
      slot: 'tank' | 'healer' | 'dps',
    ) => {
      setDraggedItem({ participant, fromGroupId, slot });
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
      toSlot: 'tank' | 'healer' | 'dps',
      targetParticipantId?: string,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverGroup(null);
      setDragOverParticipant(null);

      if (!draggedItem) return;

      const { participant, fromGroupId, slot: fromSlot } = draggedItem;

      if (fromSlot !== toSlot) {
        setDraggedItem(null);
        return;
      }

      if (fromGroupId === toGroupId && !targetParticipantId) {
        setDraggedItem(null);
        return;
      }

      setShuffledGroups((prevGroups) => {
        const newGroups = prevGroups.map((g) => ({
          ...g,
          dps: [...g.dps],
        }));

        const toGroup = newGroups.find((g) => g.id === toGroupId);
        if (!toGroup) return prevGroups;

        if (fromGroupId === 'unassigned') {
          if (toSlot === 'tank') {
            if (toGroup.tank && targetParticipantId === toGroup.tank.id) {
              toGroup.tank = participant;
            } else if (!toGroup.tank) {
              toGroup.tank = participant;
            } else {
              return prevGroups;
            }
          } else if (toSlot === 'healer') {
            if (toGroup.healer && targetParticipantId === toGroup.healer.id) {
              toGroup.healer = participant;
            } else if (!toGroup.healer) {
              toGroup.healer = participant;
            } else {
              return prevGroups;
            }
          } else if (toSlot === 'dps') {
            if (targetParticipantId) {
              const targetIndex = toGroup.dps.findIndex(
                (d) => d.id === targetParticipantId,
              );
              if (targetIndex !== -1) {
                toGroup.dps[targetIndex] = participant;
                return newGroups;
              }
            }
            const toGroupSize = getGroupSize(toGroup);
            if (toGroupSize >= 5) return prevGroups;
            toGroup.dps.push(participant);
          }
          return newGroups;
        }

        const fromGroup = newGroups.find((g) => g.id === fromGroupId);
        if (!fromGroup) return prevGroups;

        if (fromSlot === 'tank') {
          const temp = toGroup.tank;
          toGroup.tank = fromGroup.tank;
          fromGroup.tank = temp;
        } else if (fromSlot === 'healer') {
          const temp = toGroup.healer;
          toGroup.healer = fromGroup.healer;
          fromGroup.healer = temp;
        } else if (fromSlot === 'dps') {
          const fromIndex = fromGroup.dps.findIndex(
            (d) => d.id === participant.id,
          );
          if (fromIndex === -1) return prevGroups;

          if (targetParticipantId) {
            const toIndex = toGroup.dps.findIndex(
              (d) => d.id === targetParticipantId,
            );
            if (toIndex !== -1) {
              const temp = toGroup.dps[toIndex];
              toGroup.dps[toIndex] = fromGroup.dps[fromIndex];
              fromGroup.dps[fromIndex] = temp;
              return newGroups;
            }
          }

          const toGroupSize = getGroupSize(toGroup);
          if (toGroupSize >= 5) {
            return prevGroups;
          }

          const [movedDps] = fromGroup.dps.splice(fromIndex, 1);
          toGroup.dps.push(movedDps);
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

      const { participant, fromGroupId, slot: fromSlot } = draggedItem;

      setShuffledGroups((prevGroups) => {
        const newGroups = prevGroups.map((g) => ({
          ...g,
          dps: [...g.dps],
        }));

        const fromGroup = newGroups.find((g) => g.id === fromGroupId);
        if (!fromGroup) return prevGroups;

        const assigned = assignedParticipantIds(newGroups);

        if (targetParticipantId) {
          const targetParticipant = participants.find(
            (p) => p.id === targetParticipantId && !assigned.has(p.id),
          );
          if (targetParticipant) {
            const targetSlot =
              targetParticipant.role === 'tank'
                ? 'tank'
                : targetParticipant.role === 'healer'
                  ? 'healer'
                  : 'dps';
            if (targetSlot !== fromSlot) {
              return prevGroups;
            }

            if (fromSlot === 'tank') {
              fromGroup.tank = targetParticipant;
            } else if (fromSlot === 'healer') {
              fromGroup.healer = targetParticipant;
            } else {
              const idx = fromGroup.dps.findIndex(
                (d) => d.id === participant.id,
              );
              if (idx !== -1) {
                fromGroup.dps[idx] = targetParticipant;
              }
            }
            return newGroups;
          }
        }

        if (fromSlot === 'tank') {
          fromGroup.tank = null;
        } else if (fromSlot === 'healer') {
          fromGroup.healer = null;
        } else {
          const idx = fromGroup.dps.findIndex((d) => d.id === participant.id);
          if (idx !== -1) {
            fromGroup.dps.splice(idx, 1);
          }
        }

        return newGroups;
      });

      setDraggedItem(null);
    },
    [draggedItem, participants, setShuffledGroups],
  );

  const handleAddGroup = useCallback(() => {
    const newGroup: EventPartyGroup = {
      id: `group-${Date.now()}`,
      tank: null,
      healer: null,
      dps: [],
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
