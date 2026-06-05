'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import apiUrl from '@/config/apiConfig';
import {
  KEYSTONE_DEFAULT_MIN,
  KEYSTONE_DEFAULT_MAX,
} from '@/constants/keystoneLevels';
import type { Character } from '@/types/Character';
import type { BlizzardEnrichedCharacter } from '@/types/BlizzardCharacter';

interface UseBlizzardJoinResult {
  join: (character: BlizzardEnrichedCharacter) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
}

/**
 * Registers a selected Blizzard character through the existing character
 * creation contract. Auto-fills from Blizzard data; keystone levels use the
 * application defaults (no manual key input in the picker).
 */
export function useBlizzardJoin(
  eventCode: string | null,
  onRegisterSuccess?: (character: Character) => void,
): UseBlizzardJoinResult {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const join = useCallback(
    async (character: BlizzardEnrichedCharacter) => {
      if (!eventCode) return;
      setSaveError(null);
      setIsSaving(true);
      try {
        const payload = {
          name: character.name,
          characterClass: character.characterClass,
          specialization: character.specialization,
          iLevel: character.iLevel,
          eventCode,
          keystoneMinLevel: KEYSTONE_DEFAULT_MIN,
          keystoneMaxLevel: KEYSTONE_DEFAULT_MAX,
        };
        const response = await axios.post(`${apiUrl}/api/characters`, payload);
        localStorage.setItem('createdCharacter', JSON.stringify(response.data));
        if (onRegisterSuccess) {
          onRegisterSuccess(response.data as Character);
          setIsSaving(false);
          return;
        }
        router.push('/event?code=' + eventCode);
      } catch {
        setSaveError(t('eventRegister.saveError'));
        setIsSaving(false);
      }
    },
    [eventCode, onRegisterSuccess, router, t],
  );

  return { join, isSaving, saveError };
}
