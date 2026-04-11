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

        /* ---- unassigned → group ---- */
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

        /* ---- group → group (same or cross-role) ---- */
        const fromGroup = newGroups.find((g) => g.id === fromGroupId);
        if (!fromGroup) return prevGroups;

        const fromDpsIndex =
          fromSlot === 'dps'
            ? fromGroup.dps.findIndex((d) => d.id === participant.id)
            : -1;
        if (fromSlot === 'dps' && fromDpsIndex === -1) return prevGroups;

        // Identify displaced participant in target slot
        let displaced: EventParticipant | null = null;
        let displacedDpsIndex = -1;
        if (targetParticipantId) {
          if (
            toSlot === 'tank' &&
            toGroup.tank?.id === targetParticipantId
          ) {
            displaced = toGroup.tank;
          } else if (
            toSlot === 'healer' &&
            toGroup.healer?.id === targetParticipantId
          ) {
            displaced = toGroup.healer;
          } else if (toSlot === 'dps') {
            displacedDpsIndex = toGroup.dps.findIndex(
              (d) => d.id === targetParticipantId,
            );
            if (displacedDpsIndex !== -1)
              displaced = toGroup.dps[displacedDpsIndex];
          }
        }

        // Check capacity for non-swap moves into DPS
        if (toSlot === 'dps' && !displaced) {
          const toGroupSize = getGroupSize(toGroup);
          if (fromGroupId !== toGroupId && toGroupSize >= 5) return prevGroups;
        }

        // Check target slot is available for tank/healer (when no swap)
        if ((toSlot === 'tank' || toSlot === 'healer') && !displaced) {
          const occupant =
            toSlot === 'tank' ? toGroup.tank : toGroup.healer;
          if (occupant && occupant.id !== participant.id) return prevGroups;
        }

        const sameGroup = fromGroupId === toGroupId;

        if (sameGroup) {
          // Same-group swap: write directly by index to preserve DPS order
          if (displaced) {
            // Place dragged in target slot
            if (toSlot === 'tank') fromGroup.tank = participant;
            else if (toSlot === 'healer') fromGroup.healer = participant;
            else fromGroup.dps[displacedDpsIndex] = participant;

            // Place displaced in source slot
            if (fromSlot === 'tank') fromGroup.tank = displaced;
            else if (fromSlot === 'healer') fromGroup.healer = displaced;
            else fromGroup.dps[fromDpsIndex] = displaced;
          } else {
            return prevGroups;
          }
        } else {
          // Different-group swap
          // 1. Remove dragged from source
          if (fromSlot === 'tank') fromGroup.tank = null;
          else if (fromSlot === 'healer') fromGroup.healer = null;
          else fromGroup.dps.splice(fromDpsIndex, 1);

          // 2. Swap displaced to source slot
          if (displaced) {
            if (toSlot === 'tank') toGroup.tank = null;
            else if (toSlot === 'healer') toGroup.healer = null;
            else if (displacedDpsIndex !== -1)
              toGroup.dps.splice(displacedDpsIndex, 1);

            if (fromSlot === 'tank') fromGroup.tank = displaced;
            else if (fromSlot === 'healer') fromGroup.healer = displaced;
            else fromGroup.dps.push(displaced);
          }

          // 3. Place dragged in target slot
          if (toSlot === 'tank') toGroup.tank = participant;
          else if (toSlot === 'healer') toGroup.healer = participant;
          else toGroup.dps.push(participant);
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
