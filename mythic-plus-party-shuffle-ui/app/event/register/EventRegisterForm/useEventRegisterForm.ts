'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import type { Character } from '@/types/Character';
import { useClasses } from '@/context/ClassesContext';
import { useSpecializations } from '@/context/SpecializationsContext';
import apiUrl from '@/config/apiConfig';
import {
  KEYSTONE_MIN_LEVEL,
  KEYSTONE_MAX_LEVEL,
} from '@/constants/keystoneLevels';
import { ITEM_LEVEL_MIN, ITEM_LEVEL_MAX } from '@/constants/itemLevels';
import { roleFromApiSpecialization } from '@/utils/specRoleFromApi';

import {
  EVENT_REGISTER_BATTLEREZ_CLASSES,
  EVENT_REGISTER_BLOODLUST_CLASSES,
  EVENT_REGISTER_NAME_MAX_LENGTH,
} from './eventRegisterFormConstants';
import type { EventRegisterFormProps } from './eventRegisterFormProps';
import {
  normalizeIlvlOnBlur,
  normalizeKeystoneMaxOnBlur,
  normalizeKeystoneMinOnBlur,
} from './eventRegisterFieldNormalization';

export function useEventRegisterForm({
  variant = 'page',
  eventCodeOverride = null,
  formIdPrefix = 'event-reg',
  initialCharacter = null,
  onRegisterSuccess,
}: EventRegisterFormProps) {
  const [name, setName] = useState(() => initialCharacter?.name ?? '');
  const [selectCharacterClass, setSelectCharacterClass] = useState(
    () => initialCharacter?.characterClass ?? '',
  );
  const [selectSpecialization, setSelectSpecialization] = useState(
    () => initialCharacter?.specialization ?? '',
  );
  const [iLevel, setILevel] = useState(() =>
    String(initialCharacter?.iLevel ?? ITEM_LEVEL_MIN),
  );
  const [kStoneMin, setKStoneMin] = useState(() =>
    String(initialCharacter?.keystoneMinLevel ?? KEYSTONE_MIN_LEVEL),
  );
  const [kStoneMax, setKStoneMax] = useState(() =>
    String(initialCharacter?.keystoneMaxLevel ?? 15),
  );
  const [isFirstInputAfterFocus, setIsFirstInputAfterFocus] = useState(false);
  const [isFirstInputAfterFocusKeyMin, setIsFirstInputAfterFocusKeyMin] =
    useState(false);
  const [isFirstInputAfterFocusKeyMax, setIsFirstInputAfterFocusKeyMax] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const { classes } = useClasses();
  const { specializations, fetchSpecializations } = useSpecializations();

  const eventCode = eventCodeOverride ?? searchParams.get('code');

  const previewRole = useMemo(() => {
    if (!selectCharacterClass || !selectSpecialization) return null;
    return roleFromApiSpecialization(
      selectCharacterClass,
      selectSpecialization,
    );
  }, [selectCharacterClass, selectSpecialization]);

  const hasBloodlust =
    !!selectCharacterClass &&
    EVENT_REGISTER_BLOODLUST_CLASSES.includes(selectCharacterClass);
  const hasBattleRez =
    !!selectCharacterClass &&
    EVENT_REGISTER_BATTLEREZ_CLASSES.includes(selectCharacterClass);

  useEffect(() => {
    if (variant !== 'page') return;
    const storedCharacter = localStorage.getItem('createdCharacter');
    if (storedCharacter && eventCode) {
      router.push('/event?code=' + eventCode);
    }
  }, [router, eventCode, variant]);

  useEffect(() => {
    if (!selectCharacterClass) return;
    fetchSpecializations(selectCharacterClass);
  }, [selectCharacterClass, fetchSpecializations]);

  const handleClassChange = useCallback(
    (selectedClass: string) => {
      setSelectCharacterClass(selectedClass);
      setSelectSpecialization('');
      fetchSpecializations(selectedClass);
    },
    [fetchSpecializations],
  );

  const handleSpecializationChange = useCallback(
    (selectedSpecialization: string) => {
      setSelectSpecialization(selectedSpecialization);
    },
    [],
  );

  const handleILevelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;

      if (isFirstInputAfterFocus) {
        setIsFirstInputAfterFocus(false);
        const lastChar = inputValue.slice(-1);
        setILevel(lastChar);
        return;
      }

      if (inputValue.length > 3) {
        const lastChar = inputValue.slice(-1);
        setILevel(lastChar);
        return;
      }

      setILevel(inputValue);
    },
    [isFirstInputAfterFocus],
  );

  const handleILevelBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setILevel(normalizeIlvlOnBlur(event.target.value));
    },
    [],
  );

  const handleILevelFocus = useCallback(() => {
    setIsFirstInputAfterFocus(true);
  }, []);

  const handleKeystoneMinChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;

      if (isFirstInputAfterFocusKeyMin) {
        setIsFirstInputAfterFocusKeyMin(false);
        const lastChar = inputValue.slice(-1);
        setKStoneMin(lastChar);
        return;
      }

      if (inputValue.length > 2) {
        const lastChar = inputValue.slice(-1);
        setKStoneMin(lastChar);
        return;
      }

      setKStoneMin(inputValue);
    },
    [isFirstInputAfterFocusKeyMin],
  );

  const handleKeystoneMaxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;

      if (isFirstInputAfterFocusKeyMax) {
        setIsFirstInputAfterFocusKeyMax(false);
        const lastChar = inputValue.slice(-1);
        setKStoneMax(lastChar);
        return;
      }

      if (inputValue.length > 2) {
        const lastChar = inputValue.slice(-1);
        setKStoneMax(lastChar);
        return;
      }

      setKStoneMax(inputValue);
    },
    [isFirstInputAfterFocusKeyMax],
  );

  const handleKeystoneMinFocus = useCallback(() => {
    setIsFirstInputAfterFocusKeyMin(true);
  }, []);

  const handleKeystoneMaxFocus = useCallback(() => {
    setIsFirstInputAfterFocusKeyMax(true);
  }, []);

  const handleKeystoneMinBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setKStoneMin(
        normalizeKeystoneMinOnBlur(event.target.value, kStoneMax),
      );
    },
    [kStoneMax],
  );

  const handleKeystoneMaxBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setKStoneMax(
        normalizeKeystoneMaxOnBlur(event.target.value, kStoneMin),
      );
    },
    [kStoneMin],
  );

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      if (inputValue.length <= EVENT_REGISTER_NAME_MAX_LENGTH) {
        setName(inputValue);
      }
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!eventCode) {
      return;
    }

    setSaveError(null);
    setIsSaving(true);

    try {
      const characterData = {
        name,
        characterClass: selectCharacterClass,
        specialization: selectSpecialization,
        iLevel: Math.max(
          ITEM_LEVEL_MIN,
          Math.min(parseInt(iLevel, 10) || ITEM_LEVEL_MIN, ITEM_LEVEL_MAX),
        ),
        eventCode,
        keystoneMinLevel: Math.max(
          KEYSTONE_MIN_LEVEL,
          parseInt(kStoneMin, 10) || KEYSTONE_MIN_LEVEL,
        ),
        keystoneMaxLevel: Math.min(
          KEYSTONE_MAX_LEVEL,
          Math.max(
            parseInt(kStoneMin, 10) || KEYSTONE_MIN_LEVEL,
            parseInt(kStoneMax, 10) || KEYSTONE_MAX_LEVEL,
          ),
        ),
      };

      const response = await axios.post(
        `${apiUrl}/api/characters`,
        characterData,
      );
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
  }, [
    eventCode,
    name,
    selectCharacterClass,
    selectSpecialization,
    iLevel,
    kStoneMin,
    kStoneMax,
    onRegisterSuccess,
    router,
    t,
  ]);

  const canSubmit =
    !!eventCode &&
    name.trim().length > 0 &&
    !!selectCharacterClass &&
    !!selectSpecialization;

  const fid = useCallback(
    (suffix: string) => `${formIdPrefix}-${suffix}`,
    [formIdPrefix],
  );

  return {
    eventCode,
    variant,
    t,
    fid,
    classes,
    specializations,
    name,
    selectCharacterClass,
    selectSpecialization,
    iLevel,
    kStoneMin,
    kStoneMax,
    isSaving,
    saveError,
    previewRole,
    hasBloodlust,
    hasBattleRez,
    canSubmit,
    handleNameChange,
    handleClassChange,
    handleSpecializationChange,
    handleILevelChange,
    handleILevelBlur,
    handleILevelFocus,
    handleKeystoneMinChange,
    handleKeystoneMaxChange,
    handleKeystoneMinBlur,
    handleKeystoneMaxBlur,
    handleKeystoneMinFocus,
    handleKeystoneMaxFocus,
    handleSave,
    nameMaxLength: EVENT_REGISTER_NAME_MAX_LENGTH,
  };
}
