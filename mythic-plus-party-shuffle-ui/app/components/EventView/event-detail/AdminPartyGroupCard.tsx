'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Crosshair,
  GripVertical,
  Heart,
  Shield,
  Sword,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';
import type {
  EventParticipant,
  EventPartyGroup,
} from '@/components/EventView/eventPartyModel';
import { wowClassTextColors } from '@/components/EventView/eventClassColors';
import {
  adminGroupIlvlBadgeClass,
  getGroupSize,
  getPartyGroupAggregateStats,
  groupHasBL,
  groupHasRez,
  isGroupEmpty,
} from './partyGroupUtils';
import { GroupParticipantSlot } from './GroupParticipantSlot';
import type { PartyDragDropApi } from './usePartyDragDrop';

type AdminPartyGroupCardProps = {
  group: EventPartyGroup;
  groupNumber: number;
  tEv: (key: string) => string;
  drag: Pick<
    PartyDragDropApi,
    | 'draggedItem'
    | 'dragOverGroup'
    | 'dragOverParticipant'
    | 'handleDragStart'
    | 'handleDragOver'
    | 'handleDragLeave'
    | 'handleDrop'
    | 'handleDragEnd'
    | 'handleDeleteGroup'
  >;
};

export function AdminPartyGroupCard({
  group,
  groupNumber,
  tEv,
  drag,
}: AdminPartyGroupCardProps) {
  const {
    draggedItem,
    dragOverGroup,
    dragOverParticipant,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleDeleteGroup,
  } = drag;

  const hasBL = groupHasBL(group);
  const hasRez = groupHasRez(group);
  const hasTank = !!group.tank;
  const hasHealer = !!group.healer;
  const hasEnoughDps = group.dps.length >= 3;
  const isOver = dragOverGroup === group.id;

  const missingItems: ReactNode[] = [];
  if (!hasTank)
    missingItems.push(<Shield key="tank" className="h-4 w-4 text-blue-400" />);
  if (!hasHealer)
    missingItems.push(
      <Heart key="healer" className="h-4 w-4 text-green-400" />,
    );
  if (!hasEnoughDps)
    missingItems.push(<Sword key="dps" className="h-4 w-4 text-red-400" />);
  if (!hasBL)
    missingItems.push(
      <BloodlustIcon key="bl" className="h-4 w-4 text-orange-400" />,
    );
  if (!hasRez)
    missingItems.push(
      <BattleRezIcon key="rez" className="h-4 w-4 text-green-400" />,
    );

  const hasWarning = missingItems.length > 0;

  return (
    <div
      onDragOver={(e) => handleDragOver(e, group.id)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, group.id, draggedItem?.slot || 'dps')}
      className={`overflow-hidden rounded-xl border bg-[color-mix(in_srgb,var(--rift-void)_80%,transparent)] transition-all ${
        isOver
          ? 'border-cyan-400 shadow-lg shadow-cyan-500/20'
          : hasWarning
            ? 'border-yellow-500/40'
            : 'border-green-500/40'
      }`}
    >
      <div className="flex items-center justify-between border-b border-purple-500/20 bg-purple-900/30 px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h3 className="truncate font-semibold text-foreground">
            {tEv('group')} {groupNumber}
          </h3>
          {(() => {
            const stats = getPartyGroupAggregateStats(group);
            if (!stats) return null;
            return (
              <div className="flex shrink-0 items-center gap-2 text-xs">
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono font-bold text-blue-300">
                  {stats.minIlvl}-{stats.maxIlvl}
                </span>
                <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-purple-300">
                  ~{stats.avgIlvlRounded}
                </span>
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-cyan-300">
                  +{stats.minKey}-{stats.maxKey}
                </span>
              </div>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          {isGroupEmpty(group) ? (
            <Button
              onClick={() => handleDeleteGroup(group.id)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              title={tEv('deleteGroup')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {hasWarning ? (
        <div className="flex items-center gap-2 border-b border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
          <span className="text-yellow-500/80">{tEv('missing')}</span>
          <div className="flex items-center gap-1.5">{missingItems}</div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs">
          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
          <span className="text-green-500/80">{tEv('complete')}</span>
        </div>
      )}
      <div className="space-y-1 p-3 text-sm">
        <GroupParticipantSlot
          participant={group.tank}
          groupId={group.id}
          slot="tank"
          slotIcon={Shield}
          iconColor="text-blue-400"
          emptyText={tEv('noTank')}
          isAdmin
          draggedItem={draggedItem}
          dragOverParticipant={dragOverParticipant}
          tEv={tEv}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
        <GroupParticipantSlot
          participant={group.healer}
          groupId={group.id}
          slot="healer"
          slotIcon={Heart}
          iconColor="text-green-400"
          emptyText={tEv('noHealer')}
          isAdmin
          draggedItem={draggedItem}
          dragOverParticipant={dragOverParticipant}
          tEv={tEv}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
        <AdminPartyGroupDpsRows
          group={group}
          tEv={tEv}
          draggedItem={draggedItem}
          dragOverParticipant={dragOverParticipant}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
        />
      </div>
    </div>
  );
}

function AdminPartyGroupDpsRows({
  group,
  tEv,
  draggedItem,
  dragOverParticipant,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}: {
  group: EventPartyGroup;
  tEv: (key: string) => string;
  draggedItem: PartyDragDropApi['draggedItem'];
  dragOverParticipant: PartyDragDropApi['dragOverParticipant'];
  handleDragStart: PartyDragDropApi['handleDragStart'];
  handleDragEnd: PartyDragDropApi['handleDragEnd'];
  handleDragOver: PartyDragDropApi['handleDragOver'];
  handleDragLeave: PartyDragDropApi['handleDragLeave'];
  handleDrop: PartyDragDropApi['handleDrop'];
}) {
  const groupSize = getGroupSize(group);
  const maxDpsSlots = Math.min(
    3,
    5 - (group.tank ? 1 : 0) - (group.healer ? 1 : 0),
  );
  const slotsToShow = Math.max(3, Math.min(group.dps.length, maxDpsSlots));

  return (
    <>
      {Array.from({ length: slotsToShow }, (_, slotIndex) => {
        const dps = group.dps[slotIndex];
        if (!dps) {
          if (groupSize >= 5) return null;
          return (
            <div
              key={`empty-dps-${slotIndex}`}
              className="flex items-center gap-2 rounded border border-dashed border-purple-500/20 p-1.5 opacity-50"
              onDragOver={(e) => handleDragOver(e, group.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.id, 'dps')}
            >
              <Sword className="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
              <span className="text-sm italic text-muted-foreground/50">
                DPS {slotIndex + 1}
              </span>
            </div>
          );
        }
        const isDpsDragging = draggedItem?.participant.id === dps.id;
        const isDpsDropTarget =
          dragOverParticipant === dps.id &&
          draggedItem?.participant.id !== dps.id;
        const canDpsSwap =
          draggedItem &&
          draggedItem.slot === 'dps' &&
          draggedItem.participant.id !== dps.id;

        return (
          <div
            key={dps.id}
            draggable
            onDragStart={(e) => handleDragStart(e, dps, group.id, 'dps')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              e.stopPropagation();
              handleDragOver(e, group.id, dps.id);
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, group.id, 'dps', dps.id)}
            className={`flex items-center gap-2 rounded p-1.5 transition-all ${'cursor-grab active:cursor-grabbing'} ${
              isDpsDragging
                ? 'scale-95 opacity-50'
                : isDpsDropTarget && canDpsSwap
                  ? 'scale-105 bg-cyan-500/30 ring-2 ring-cyan-400'
                  : 'hover:bg-purple-500/10'
            }`}
          >
            <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground/40" />
            {dps.role === 'tank' ? (
              <Shield className="h-4 w-4 flex-shrink-0 text-blue-400" />
            ) : dps.role === 'healer' ? (
              <Heart className="h-4 w-4 flex-shrink-0 text-green-400" />
            ) : dps.role === 'meleeDps' ? (
              <Sword className="h-4 w-4 flex-shrink-0 text-red-400" />
            ) : (
              <Crosshair className="h-4 w-4 flex-shrink-0 text-orange-400" />
            )}
            <span
              className={`w-20 truncate font-medium ${wowClassTextColors[dps.class] || 'text-foreground'}`}
            >
              {dps.name}
            </span>
            <span className="hidden w-16 truncate text-xs text-muted-foreground sm:block">
              {dps.spec}
            </span>
            <span className={adminGroupIlvlBadgeClass(dps.ilvl)}>
              {dps.ilvl}
            </span>
            <span
              className="hidden w-12 text-center font-mono text-xs text-cyan-400/70 lg:block"
              title={tEv('keyRange')}
            >
              {dps.keyMin}-{dps.keyMax}
            </span>
            <div className="flex w-10 items-center justify-end gap-1">
              {dps.hasBloodlust ? (
                <BloodlustIcon className="h-4 w-4 text-orange-400" />
              ) : null}
              {dps.hasBattleRez ? (
                <BattleRezIcon className="h-4 w-4 text-green-400" />
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}
