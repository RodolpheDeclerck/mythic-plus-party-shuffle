'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import {
  KEYSTONE_MAX_LEVEL,
  KEYSTONE_MIN_LEVEL,
} from '@/constants/keystoneLevels';
import { ITEM_LEVEL_MAX, ITEM_LEVEL_MIN } from '@/constants/itemLevels';
import {
  wowClassHasBattleRez,
  wowClassHasBloodlust,
} from '@/constants/wowRaidBuffClasses';
import {
  getEditParticipantSpecRole,
  specsForEditParticipantClass,
} from '@/lib/wowEditParticipantCatalog';

import type { EventParticipant } from '../eventPartyModel';

export type EditParticipantFormProps = {
  participant: EventParticipant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (participant: EventParticipant) => void | Promise<void>;
  onDelete: (participantId: string) => void | Promise<void>;
  mode?: 'edit' | 'add';
};

export function useEditParticipantForm({
  participant,
  open,
  onOpenChange,
  onSave,
  onDelete,
  mode = 'edit',
}: EditParticipantFormProps) {
  const [name, setName] = useState('');
  const [wowClass, setWowClass] = useState('');
  const [spec, setSpec] = useState('');
  const [ilvl, setIlvl] = useState(0);
  const [keyMin, setKeyMin] = useState(KEYSTONE_MIN_LEVEL);
  const [keyMax, setKeyMax] = useState(KEYSTONE_MAX_LEVEL);

  useEffect(() => {
    if (mode === 'edit' && participant) {
      setName(participant.name);
      setWowClass(participant.class);
      setSpec(participant.spec);
      setIlvl(participant.ilvl);
      setKeyMin(participant.keyMin ?? KEYSTONE_MIN_LEVEL);
      setKeyMax(participant.keyMax ?? KEYSTONE_MAX_LEVEL);
    } else if (mode === 'add') {
      setName('');
      setWowClass('');
      setSpec('');
      setIlvl(ITEM_LEVEL_MIN);
      setKeyMin(KEYSTONE_MIN_LEVEL);
      setKeyMax(KEYSTONE_MAX_LEVEL);
    }
  }, [participant, mode, open]);

  const role = useMemo(
    () => getEditParticipantSpecRole(wowClass, spec),
    [wowClass, spec],
  );

  const hasBloodlust = wowClassHasBloodlust(wowClass);
  const hasBattleRez = wowClassHasBattleRez(wowClass);

  const availableSpecs = useMemo(
    () => specsForEditParticipantClass(wowClass),
    [wowClass],
  );

  const onClassChange = useCallback((value: string) => {
    setWowClass(value);
    setSpec('');
  }, []);

  const handleSave = useCallback(async () => {
    if (mode === 'edit' && !participant) return;
    if (!name || !wowClass || !spec) return;

    const newParticipant: EventParticipant = {
      id: mode === 'add' ? `participant-${Date.now()}` : participant!.id,
      name,
      class: wowClass,
      spec,
      role,
      ilvl: Math.max(ITEM_LEVEL_MIN, Math.min(ilvl, ITEM_LEVEL_MAX)),
      hasBloodlust,
      hasBattleRez,
      keyMin,
      keyMax,
    };

    await onSave(newParticipant);
    onOpenChange(false);
  }, [
    mode,
    participant,
    name,
    wowClass,
    spec,
    role,
    ilvl,
    hasBloodlust,
    hasBattleRez,
    keyMin,
    keyMax,
    onSave,
    onOpenChange,
  ]);

  const handleDelete = useCallback(async () => {
    if (!participant) return;
    await onDelete(participant.id);
    onOpenChange(false);
  }, [participant, onDelete, onOpenChange]);

  const onKeyMinChange = useCallback((raw: string) => {
    const val = Math.max(
      KEYSTONE_MIN_LEVEL,
      Math.min(
        KEYSTONE_MAX_LEVEL,
        parseInt(raw, 10) || KEYSTONE_MIN_LEVEL,
      ),
    );
    setKeyMin(val);
    setKeyMax((max) => (val > max ? val : max));
  }, []);

  const onKeyMaxChange = useCallback((raw: string) => {
    const val = Math.max(
      KEYSTONE_MIN_LEVEL,
      Math.min(
        KEYSTONE_MAX_LEVEL,
        parseInt(raw, 10) || KEYSTONE_MAX_LEVEL,
      ),
    );
    setKeyMax(val);
    setKeyMin((min) => (val < min ? val : min));
  }, []);

  const canSave = Boolean(name && wowClass && spec);

  return {
    name,
    setName,
    wowClass,
    onClassChange,
    spec,
    setSpec,
    ilvl,
    setIlvl,
    keyMin,
    keyMax,
    onKeyMinChange,
    onKeyMaxChange,
    role,
    hasBloodlust,
    hasBattleRez,
    availableSpecs,
    handleSave,
    handleDelete,
    canSave,
    mode,
  };
}

export type EditParticipantFormState = ReturnType<
  typeof useEditParticipantForm
>;
