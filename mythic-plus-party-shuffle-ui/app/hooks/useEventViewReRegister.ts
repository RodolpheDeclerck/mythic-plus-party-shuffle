'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import type { Character } from '@/types/Character';

type UseEventViewReRegisterParams = {
  loading: boolean;
  eventCode: string | null;
  createdCharacter: Character | null;
  characters: Character[];
  fetchCharacters: () => void | Promise<void>;
  setCreatedCharacter: (character: Character | null) => void;
  router: { push: (href: string) => void };
};

/**
 * When the guest's saved character is no longer on the roster, open re-register flow.
 */
export function useEventViewReRegister({
  loading,
  eventCode,
  createdCharacter,
  characters,
  fetchCharacters,
  setCreatedCharacter,
  router,
}: UseEventViewReRegisterParams) {
  const [reRegisterOpen, setReRegisterOpen] = useState(false);
  const [reRegisterFormKey, setReRegisterFormKey] = useState(0);
  const reRegisterDismissedRef = useRef(false);
  const reRegisterPrevInListRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (loading || !eventCode || !createdCharacter) return;
    const inList = characters.some((c) => c.id === createdCharacter.id);
    if (inList) {
      reRegisterDismissedRef.current = false;
      setReRegisterOpen(false);
      reRegisterPrevInListRef.current = true;
      return;
    }
    if (reRegisterDismissedRef.current) {
      reRegisterPrevInListRef.current = false;
      return;
    }
    const wasInList = reRegisterPrevInListRef.current;
    reRegisterPrevInListRef.current = false;
    setReRegisterOpen(true);
    if (wasInList === true || wasInList === null) {
      setReRegisterFormKey((k) => k + 1);
    }
  }, [loading, eventCode, createdCharacter, characters]);

  const handleReRegisterSuccess = useCallback(
    (data: Character) => {
      localStorage.setItem('createdCharacter', JSON.stringify(data));
      setCreatedCharacter(data);
      setReRegisterOpen(false);
      reRegisterDismissedRef.current = false;
      void fetchCharacters();
    },
    [fetchCharacters, setCreatedCharacter],
  );

  const handleReRegisterCancel = useCallback(() => {
    reRegisterDismissedRef.current = true;
    setReRegisterOpen(false);
    localStorage.removeItem('createdCharacter');
    setCreatedCharacter(null);
    if (eventCode) {
      router.push(`/event/register?code=${encodeURIComponent(eventCode)}`);
    }
  }, [eventCode, router, setCreatedCharacter]);

  return {
    reRegisterOpen,
    reRegisterFormKey,
    handleReRegisterSuccess,
    handleReRegisterCancel,
  };
}
