'use client';

import type {
  EventParticipant,
  EventPartyGroup,
} from '@/components/EventView/eventPartyModel';
import { AdminPartyGridToolbar } from './AdminPartyGridToolbar';
import { AdminPartyGroupCard } from './AdminPartyGroupCard';
import { AdminUnassignedParticipantsPanel } from './AdminUnassignedParticipantsPanel';
import type { PartyDragDropApi } from './usePartyDragDrop';

type AdminPartyGridProps = {
  tEv: (key: string) => string;
  shuffledGroups: EventPartyGroup[];
  groupsToRender: EventPartyGroup[];
  arePartiesVisible: boolean;
  unassignedParticipants: EventParticipant[];
  onToggleVisibility: () => void | Promise<void>;
  onClearGroupsOpen: () => void;
  onShuffle: () => void;
  drag: PartyDragDropApi;
};

export function AdminPartyGrid({
  tEv,
  shuffledGroups,
  groupsToRender,
  arePartiesVisible,
  unassignedParticipants,
  onToggleVisibility,
  onClearGroupsOpen,
  onShuffle,
  drag,
}: AdminPartyGridProps) {
  const {
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
  } = drag;

  const groupCardDrag = {
    draggedItem,
    dragOverGroup,
    dragOverParticipant,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleDeleteGroup,
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-blue-500/10 p-6">
      <AdminPartyGridToolbar
        tEv={tEv}
        arePartiesVisible={arePartiesVisible}
        onToggleVisibility={onToggleVisibility}
        onClearGroupsOpen={onClearGroupsOpen}
        onShuffle={onShuffle}
        onAddGroup={handleAddGroup}
      />

      <p className="mb-4 text-xs text-muted-foreground">{tEv('dragHint')}</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groupsToRender.map((group, index) => {
          const groupNumberRaw = shuffledGroups.findIndex(
            (x) => x.id === group.id,
          );
          const groupNumber =
            groupNumberRaw >= 0 ? groupNumberRaw + 1 : index + 1;

          return (
            <AdminPartyGroupCard
              key={group.id}
              group={group}
              groupNumber={groupNumber}
              tEv={tEv}
              drag={groupCardDrag}
            />
          );
        })}
      </div>

      <AdminUnassignedParticipantsPanel
        tEv={tEv}
        unassignedParticipants={unassignedParticipants}
        dragOverGroup={dragOverGroup}
        draggedItem={draggedItem}
        dragOverParticipant={dragOverParticipant}
        setDragOverGroup={setDragOverGroup}
        setDragOverParticipant={setDragOverParticipant}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
        handleDropToUnassigned={handleDropToUnassigned}
      />
    </div>
  );
}
