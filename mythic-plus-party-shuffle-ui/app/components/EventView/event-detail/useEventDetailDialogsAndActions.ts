'use client';

import { useState, useCallback } from 'react';

import type { Character } from '@/types/Character';

import {
  type EventParticipant,
  eventParticipantToCharacterForUpsert,
} from '../eventPartyModel';

export type UseEventDetailDialogsAndActionsParams = {
  eventCode: string;
  onShuffle: () => void | Promise<void>;
  onSaveParticipant: (c: Character & { eventCode: string }) => Promise<void>;
  onDeleteParticipant: (id: number) => Promise<void>;
  onClearAllCharacters: () => void | Promise<void>;
  onClearParties: () => void | Promise<void>;
  onViewerLeaveEvent?: () => void | Promise<void>;
};

export function useEventDetailDialogsAndActions({
  eventCode,
  onShuffle,
  onSaveParticipant,
  onDeleteParticipant,
  onClearAllCharacters,
  onClearParties,
  onViewerLeaveEvent,
}: UseEventDetailDialogsAndActionsParams) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [editingParticipant, setEditingParticipant] =
    useState<EventParticipant | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'add'>('edit');
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [clearParticipantsOpen, setClearParticipantsOpen] = useState(false);
  const [clearGroupsOpen, setClearGroupsOpen] = useState(false);

  const copyCode = useCallback(() => {
    void navigator.clipboard.writeText(eventCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [eventCode]);

  const handleShuffle = useCallback(() => {
    void onShuffle();
  }, [onShuffle]);

  const handleEditParticipant = useCallback((participant: EventParticipant) => {
    setEditingParticipant(participant);
    setDialogMode('edit');
    setEditDialogOpen(true);
  }, []);

  const handleAddParticipant = useCallback(() => {
    setEditingParticipant(null);
    setDialogMode('add');
    setEditDialogOpen(true);
  }, []);

  const handleSaveParticipant = useCallback(
    async (updatedParticipant: EventParticipant) => {
      await onSaveParticipant(
        eventParticipantToCharacterForUpsert(updatedParticipant, eventCode),
      );
    },
    [eventCode, onSaveParticipant],
  );

  const handleDeleteParticipantFromDialog = useCallback(
    async (participantId: string) => {
      const id = Number.parseInt(participantId, 10);
      if (!Number.isFinite(id)) return;
      await onDeleteParticipant(id);
    },
    [onDeleteParticipant],
  );

  return {
    codeCopied,
    copyCode,
    handleShuffle,
    handleEditParticipant,
    handleAddParticipant,
    clearParticipantsOpen,
    setClearParticipantsOpen,
    clearGroupsOpen,
    setClearGroupsOpen,
    editingParticipant,
    editDialogOpen,
    setEditDialogOpen,
    dialogMode,
    leaveConfirmOpen,
    setLeaveConfirmOpen,
    handleSaveParticipant,
    handleDeleteParticipantFromDialog,
    onClearAllCharacters,
    onClearParties,
    onViewerLeaveEvent,
  };
}
