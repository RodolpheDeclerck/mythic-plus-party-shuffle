'use client';

import type { DragEvent, ElementType } from 'react';
import { Crosshair, GripVertical, Heart, Shield, Sword } from 'lucide-react';
import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';
import type { EventParticipant } from '@/components/EventView/eventPartyModel';
import { wowClassTextColors } from '@/components/EventView/eventClassColors';
import { adminGroupIlvlBadgeClass } from './partyGroupUtils';
import type { DraggedPartyItem } from './usePartyDragDrop';

function participantSlotIcon(p: EventParticipant) {
  if (p.role === 'tank') return { Icon: Shield, color: 'text-blue-400' };
  if (p.role === 'healer') return { Icon: Heart, color: 'text-green-400' };
  if (p.role === 'meleeDps') return { Icon: Sword, color: 'text-red-400' };
  return { Icon: Crosshair, color: 'text-orange-400' };
}

export function GroupParticipantSlot({
  participant,
  groupId,
  slot,
  slotIcon: SlotIcon,
  iconColor,
  emptyText,
  isAdmin,
  draggedItem,
  dragOverParticipant,
  tEv,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  participant: EventParticipant | null;
  groupId: string;
  slot: 'tank' | 'healer' | 'dps';
  slotIcon: ElementType;
  iconColor: string;
  emptyText: string;
  isAdmin: boolean;
  draggedItem: DraggedPartyItem | null;
  dragOverParticipant: string | null;
  tEv: (key: string) => string;
  onDragStart: (
    e: DragEvent,
    p: EventParticipant,
    gid: string,
    s: 'tank' | 'healer' | 'dps',
  ) => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent, gid: string, pid?: string) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (
    e: DragEvent,
    gid: string,
    s: 'tank' | 'healer' | 'dps',
    targetPid?: string,
  ) => void;
}) {
  const isDragging = draggedItem?.participant.id === participant?.id;
  const isDropTarget =
    dragOverParticipant === participant?.id &&
    draggedItem?.participant.id !== participant?.id;
  const canSwap =
    draggedItem &&
    draggedItem.slot === slot &&
    draggedItem.participant.id !== participant?.id;

  if (!participant) {
    return (
      <div
        className="flex items-center gap-2 rounded border border-dashed border-purple-500/20 p-1.5 opacity-50"
        onDragOver={(e) => onDragOver(e, groupId)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, groupId, slot)}
      >
        <SlotIcon className={`h-4 w-4 flex-shrink-0 ${iconColor}`} />
        <span className="text-sm italic text-muted-foreground/50">
          {emptyText}
        </span>
      </div>
    );
  }

  const { Icon: ParticipantIcon, color: participantIconColor } =
    participantSlotIcon(participant);

  return (
    <div
      draggable={isAdmin}
      onDragStart={(e) => onDragStart(e, participant, groupId, slot)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.stopPropagation();
        onDragOver(e, groupId, participant.id);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, groupId, slot, participant.id)}
      className={`flex items-center gap-2 rounded p-1.5 transition-all ${
        isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${
        isDragging
          ? 'scale-95 opacity-50'
          : isDropTarget && canSwap
            ? 'scale-105 bg-cyan-500/30 ring-2 ring-cyan-400'
            : isAdmin
              ? 'hover:bg-purple-500/10'
              : ''
      }`}
    >
      {isAdmin ? (
        <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
      ) : null}
      <ParticipantIcon
        className={`h-4 w-4 flex-shrink-0 ${participantIconColor}`}
      />
      <span
        className={`w-20 truncate font-medium ${wowClassTextColors[participant.class] || 'text-foreground'}`}
      >
        {participant.name}
      </span>
      <span className="hidden w-16 truncate text-xs text-muted-foreground sm:block">
        {participant.spec}
      </span>
      <span className={adminGroupIlvlBadgeClass(participant.ilvl)}>
        {participant.ilvl}
      </span>
      <span
        className="hidden w-12 text-center font-mono text-xs text-cyan-400/70 lg:block"
        title={tEv('keyRange')}
      >
        {participant.keyMin}-{participant.keyMax}
      </span>
      <div className="flex w-10 items-center justify-end gap-1">
        {participant.hasBloodlust ? (
          <BloodlustIcon className="h-4 w-4 text-orange-400" />
        ) : null}
        {participant.hasBattleRez ? (
          <BattleRezIcon className="h-4 w-4 text-green-400" />
        ) : null}
      </div>
    </div>
  );
}
