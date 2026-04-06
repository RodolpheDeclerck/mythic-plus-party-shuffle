'use client';

import {
  Crosshair,
  GripVertical,
  Heart,
  Shield,
  Sword,
  Users,
} from 'lucide-react';
import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';
import type { EventParticipant } from '@/components/EventView/eventPartyModel';
import { wowClassTextColors } from '@/components/EventView/eventClassColors';
import type { PartyDragDropApi } from './usePartyDragDrop';

type AdminUnassignedParticipantsPanelProps = {
  tEv: (key: string) => string;
  unassignedParticipants: EventParticipant[];
  dragOverGroup: PartyDragDropApi['dragOverGroup'];
  draggedItem: PartyDragDropApi['draggedItem'];
  dragOverParticipant: PartyDragDropApi['dragOverParticipant'];
  setDragOverGroup: PartyDragDropApi['setDragOverGroup'];
  setDragOverParticipant: PartyDragDropApi['setDragOverParticipant'];
  handleDragStart: PartyDragDropApi['handleDragStart'];
  handleDragEnd: PartyDragDropApi['handleDragEnd'];
  handleDropToUnassigned: PartyDragDropApi['handleDropToUnassigned'];
};

function getRoleSlot(role: string): 'tank' | 'healer' | 'dps' {
  if (role === 'tank') return 'tank';
  if (role === 'healer') return 'healer';
  return 'dps';
}

export function AdminUnassignedParticipantsPanel({
  tEv,
  unassignedParticipants,
  dragOverGroup,
  draggedItem,
  dragOverParticipant,
  setDragOverGroup,
  setDragOverParticipant,
  handleDragStart,
  handleDragEnd,
  handleDropToUnassigned,
}: AdminUnassignedParticipantsPanelProps) {
  return (
    <div
      className={`mt-6 rounded-xl border bg-[color-mix(in_srgb,var(--rift-void)_60%,transparent)] p-4 transition-all ${
        dragOverGroup === 'unassigned'
          ? 'border-cyan-400 shadow-lg shadow-cyan-500/20'
          : 'border-orange-500/30'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverGroup('unassigned');
      }}
      onDragLeave={(e) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
          setDragOverGroup(null);
        }
      }}
      onDrop={(e) => handleDropToUnassigned(e)}
    >
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Users className="h-5 w-5 text-orange-400" />
        {tEv('unassignedParticipants')} ({unassignedParticipants.length})
      </h3>
      {unassignedParticipants.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {unassignedParticipants.map((participant) => {
            const isDragging = draggedItem?.participant.id === participant.id;
            const isDropTarget =
              dragOverParticipant === participant.id &&
              draggedItem?.participant.id !== participant.id;
            const slot = getRoleSlot(participant.role);
            const canSwap =
              draggedItem &&
              draggedItem.slot === slot &&
              draggedItem.participant.id !== participant.id;
            const RoleIcon =
              participant.role === 'tank'
                ? Shield
                : participant.role === 'healer'
                  ? Heart
                  : participant.role === 'meleeDps'
                    ? Sword
                    : Crosshair;
            const roleColor =
              participant.role === 'tank'
                ? 'text-blue-400'
                : participant.role === 'healer'
                  ? 'text-green-400'
                  : participant.role === 'meleeDps'
                    ? 'text-red-400'
                    : 'text-orange-400';

            return (
              <div
                key={participant.id}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, participant, 'unassigned', slot)
                }
                onDragEnd={handleDragEnd}
                onDragOver={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDragOverGroup('unassigned');
                  setDragOverParticipant(participant.id);
                }}
                onDrop={(e) => handleDropToUnassigned(e, participant.id)}
                className={`flex cursor-grab items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-900/20 p-2 transition-all active:cursor-grabbing ${
                  isDragging
                    ? 'scale-95 opacity-50'
                    : isDropTarget && canSwap
                      ? 'scale-105 bg-cyan-500/30 ring-2 ring-cyan-400'
                      : 'hover:border-purple-500/40 hover:bg-purple-500/10'
                }`}
              >
                <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
                <RoleIcon className={`h-4 w-4 flex-shrink-0 ${roleColor}`} />
                <span
                  className={`truncate font-medium ${wowClassTextColors[participant.class] || 'text-foreground'}`}
                >
                  {participant.name}
                </span>
                <span className="hidden truncate text-xs text-muted-foreground sm:block">
                  {participant.spec}
                </span>
                <span className="font-mono text-xs text-muted-foreground/60">
                  {participant.ilvl}
                </span>
                <span
                  className="ml-auto font-mono text-xs text-cyan-400/70"
                  title={tEv('keyRange')}
                >
                  {participant.keyMin}-{participant.keyMax}
                </span>
                <div className="flex items-center gap-1">
                  {participant.hasBloodlust ? (
                    <BloodlustIcon className="h-4 w-4 text-orange-400" />
                  ) : null}
                  {participant.hasBattleRez ? (
                    <BattleRezIcon className="h-4 w-4 text-green-400" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-purple-500/20 py-4 text-center italic text-muted-foreground/50">
          {tEv('noUnassigned')}
        </div>
      )}
    </div>
  );
}
