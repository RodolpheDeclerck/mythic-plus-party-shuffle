'use client';

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';
import {
  characterToEventParticipant,
} from './eventPartyModel';
import { wowClassTextColors } from './eventClassColors';
import { EditParticipantDialog } from './EditParticipantDialog';
import { ClearConfirmDialog } from './ClearConfirmDialog';
import { useSyncedPartyGroups } from './event-detail/useSyncedPartyGroups';
import { usePartyDragDrop } from './event-detail/usePartyDragDrop';
import { assignedParticipantIds } from './event-detail/partyGroupUtils';
import { EventDetailHeader } from './event-detail/EventDetailHeader';
import { AdminPartyGrid } from './event-detail/AdminPartyGrid';
import {
  PlayerHiddenGroupsBanner,
  PlayerVisiblePartySections,
} from './event-detail/PlayerPartySections';
import { RoleRosterGrid } from './event-detail/RoleRosterGrid';
import { LeaveEventDialog } from './event-detail/LeaveEventDialog';
import { buildEventDetailRoleCategories } from './event-detail/eventDetailRoleCategories';
import { useEventDetailDialogsAndActions } from './event-detail/useEventDetailDialogsAndActions';

export type EventDetailProps = {
  eventCode: string;
  eventName: string;
  eventCreatedAt?: string;
  homeHref: string;
  isAdmin: boolean;
  characters: Character[];
  parties: Party[];
  arePartiesVisible: boolean;
  shufflePending: boolean;
  onShuffle: () => void | Promise<void>;
  onClearParties: () => void | Promise<void>;
  onToggleVisibility: () => void | Promise<void>;
  onPartiesUpdate: (parties: Party[]) => void | Promise<void>;
  onClearAllCharacters: () => void | Promise<void>;
  onSaveParticipant: (c: Character & { eventCode: string }) => Promise<void>;
  onDeleteParticipant: (id: number) => Promise<void>;
  viewerCharacterId?: number | null;
  onViewerLeaveEvent?: () => void | Promise<void>;
};

export function EventDetail({
  eventCode,
  eventName,
  eventCreatedAt,
  homeHref,
  isAdmin,
  characters,
  parties,
  arePartiesVisible,
  shufflePending,
  onShuffle,
  onClearParties,
  onToggleVisibility,
  onPartiesUpdate,
  onClearAllCharacters,
  onSaveParticipant,
  onDeleteParticipant,
  viewerCharacterId = null,
  onViewerLeaveEvent,
}: EventDetailProps) {
  const { t } = useTranslation();
  const tEv = (key: string) => t(`eventDetail.${key}`);

  const specLabel = useCallback(
    (c: Character) => t(`specializations.${c.specialization}`),
    [t],
  );

  const participants = useMemo(
    () => characters.map((c) => characterToEventParticipant(c, specLabel(c))),
    [characters, specLabel],
  );

  const { shuffledGroups, setShuffledGroups } = useSyncedPartyGroups({
    parties,
    characters,
    isAdmin,
    specLabel,
    onPartiesUpdate,
  });

  const groupsToRender = useMemo(() => {
    if (isAdmin) return shuffledGroups;
    if (!arePartiesVisible) return shuffledGroups;
    if (viewerCharacterId == null) return [];
    return shuffledGroups.filter((g) => {
      const sid = String(viewerCharacterId);
      return (
        g.tank?.id === sid ||
        g.healer?.id === sid ||
        g.dps.some((d) => d.id === sid)
      );
    });
  }, [isAdmin, arePartiesVisible, shuffledGroups, viewerCharacterId]);

  const drag = usePartyDragDrop(setShuffledGroups, participants);

  const dialogs = useEventDetailDialogsAndActions({
    eventCode,
    onShuffle,
    onSaveParticipant,
    onDeleteParticipant,
    onClearAllCharacters,
    onClearParties,
    onViewerLeaveEvent,
  });

  const roleCategories = useMemo(
    () =>
      buildEventDetailRoleCategories(
        (key) => t(`eventDetail.${key}`),
        participants,
      ),
    [t, participants],
  );

  const viewerSid =
    viewerCharacterId != null ? String(viewerCharacterId) : null;

  const viewerParticipant = useMemo(() => {
    if (viewerSid == null) return null;
    return participants.find((p) => p.id === viewerSid) ?? null;
  }, [participants, viewerSid]);

  const assignedIds = useMemo(
    () => assignedParticipantIds(shuffledGroups),
    [shuffledGroups],
  );

  const unassignedParticipants = useMemo(() => {
    if (shuffledGroups.length === 0) return [];
    return participants.filter((p) => !assignedIds.has(p.id));
  }, [participants, shuffledGroups.length, assignedIds]);

  return (
    <div className="w-full space-y-8">
      <EventDetailHeader
        isAdmin={isAdmin}
        homeHref={homeHref}
        eventName={eventName}
        eventCode={eventCode}
        eventCreatedAt={eventCreatedAt}
        participantsCount={participants.length}
        codeCopied={dialogs.codeCopied}
        onCopyCode={dialogs.copyCode}
        shufflePending={shufflePending}
        onAddParticipant={dialogs.handleAddParticipant}
        onClearParticipantsOpen={() => dialogs.setClearParticipantsOpen(true)}
        onShuffle={dialogs.handleShuffle}
        viewerParticipant={viewerParticipant}
        onEditParticipant={dialogs.handleEditParticipant}
        onLeaveOpen={() => dialogs.setLeaveConfirmOpen(true)}
        tEv={tEv}
      />

      <PlayerHiddenGroupsBanner
        tEv={tEv}
        isAdmin={isAdmin}
        shuffledGroups={shuffledGroups}
        arePartiesVisible={arePartiesVisible}
      />

      {isAdmin && shuffledGroups.length > 0 ? (
        <AdminPartyGrid
          tEv={tEv}
          shuffledGroups={shuffledGroups}
          groupsToRender={groupsToRender}
          arePartiesVisible={arePartiesVisible}
          unassignedParticipants={unassignedParticipants}
          onToggleVisibility={onToggleVisibility}
          onClearGroupsOpen={() => dialogs.setClearGroupsOpen(true)}
          onShuffle={dialogs.handleShuffle}
          drag={drag}
        />
      ) : null}

      <PlayerVisiblePartySections
        tEv={tEv}
        isAdmin={isAdmin}
        shuffledGroups={shuffledGroups}
        groupsToRender={groupsToRender}
        arePartiesVisible={arePartiesVisible}
        viewerCharacterId={viewerCharacterId}
        viewerSid={viewerSid}
        classColors={wowClassTextColors}
      />

      <RoleRosterGrid
        tEv={tEv}
        isAdmin={isAdmin}
        participantsCount={participants.length}
        roleCategories={roleCategories}
        classColors={wowClassTextColors}
        viewerSid={viewerSid}
        onEditParticipant={dialogs.handleEditParticipant}
        onDeleteParticipant={(id) =>
          void dialogs.handleDeleteParticipantFromDialog(id)
        }
      />

      <ClearConfirmDialog
        open={dialogs.clearParticipantsOpen}
        onOpenChange={dialogs.setClearParticipantsOpen}
        type="participants"
        onConfirm={() => void dialogs.onClearAllCharacters()}
      />
      <ClearConfirmDialog
        open={dialogs.clearGroupsOpen}
        onOpenChange={dialogs.setClearGroupsOpen}
        type="groups"
        onConfirm={() => void dialogs.onClearParties()}
      />

      <EditParticipantDialog
        participant={dialogs.editingParticipant}
        open={dialogs.editDialogOpen}
        onOpenChange={dialogs.setEditDialogOpen}
        onSave={(p) => void dialogs.handleSaveParticipant(p)}
        onDelete={(id) => void dialogs.handleDeleteParticipantFromDialog(id)}
        mode={dialogs.dialogMode}
      />

      <LeaveEventDialog
        open={dialogs.leaveConfirmOpen}
        onOpenChange={dialogs.setLeaveConfirmOpen}
        onConfirmLeave={() => void dialogs.onViewerLeaveEvent?.()}
      />
    </div>
  );
}
