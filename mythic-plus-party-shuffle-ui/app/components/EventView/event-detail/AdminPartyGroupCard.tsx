'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Heart,
  Shield,
  Sword,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BloodlustIcon, BattleRezIcon } from '@/components/EventView/wow-icons';
import type { EventPartyGroup } from '@/components/EventView/eventPartyModel';
import {
  getPartyGroupAggregateStats,
  getPartyGroupCompositionStatus,
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

  const composition = getPartyGroupCompositionStatus(group);
  const isOver = dragOverGroup === group.id;

  const missingItems: ReactNode[] = [];
  if (composition.missingTank)
    missingItems.push(<Shield key="tank" className="h-4 w-4 text-blue-400" />);
  if (composition.missingHealer)
    missingItems.push(
      <Heart key="healer" className="h-4 w-4 text-green-400" />,
    );
  if (composition.missingDps > 0)
    missingItems.push(<Sword key="dps" className="h-4 w-4 text-red-400" />);
  if (!composition.hasBloodlust)
    missingItems.push(
      <BloodlustIcon key="bl" className="h-4 w-4 text-orange-400" />,
    );
  if (!composition.hasBattleRez)
    missingItems.push(
      <BattleRezIcon key="rez" className="h-4 w-4 text-green-400" />,
    );

  const hasWarning = missingItems.length > 0;

  // Find first empty slot for card-level drops
  const firstEmptySlot = group.members.findIndex((m) => m == null);

  return (
    <div
      onDragOver={(e) => handleDragOver(e, group.id)}
      onDragLeave={handleDragLeave}
      onDrop={(e) =>
        handleDrop(
          e,
          group.id,
          firstEmptySlot !== -1
            ? firstEmptySlot
            : draggedItem?.slotIndex ?? 0,
        )
      }
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
        {group.members.map((member, idx) => (
          <GroupParticipantSlot
            key={member?.id ?? `empty-${idx}`}
            participant={member}
            groupId={group.id}
            slotIndex={idx}
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
        ))}
      </div>
    </div>
  );
}
