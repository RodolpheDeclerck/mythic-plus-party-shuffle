'use client';

import { useEffect } from 'react';

import type { Character } from '@/types/Character';

type UseEventViewBootstrapParams = {
  eventCode: string | null;
  isAuthChecked: boolean;
  /** From `AuthContext` — `null` until the session check finishes. */
  isAuthenticated: boolean | null;
  router: { push: (href: string) => void };
  checkEventExistence: () => Promise<boolean>;
  setCreatedCharacter: (character: Character | null) => void;
  setIsVerifying: (value: boolean) => void;
};

/**
 * On load: redirect if event missing; restore guest character from localStorage;
 * redirect anonymous users without a character to /event/register.
 */
export function useEventViewBootstrap({
  eventCode,
  isAuthChecked,
  isAuthenticated,
  router,
  checkEventExistence,
  setCreatedCharacter,
  setIsVerifying,
}: UseEventViewBootstrapParams) {
  useEffect(() => {
    const verifyAndRedirect = async () => {
      const eventExists = await checkEventExistence();
      if (!eventExists) {
        router.push('/');
        return;
      }

      const characterData = localStorage.getItem('createdCharacter');
      if (characterData) {
        setCreatedCharacter(JSON.parse(characterData) as Character);
      } else if (
        isAuthChecked &&
        isAuthenticated === false &&
        eventCode
      ) {
        router.push('/event/register?code=' + eventCode);
      }

      setIsVerifying(false);
    };

    void verifyAndRedirect();
  }, [
    eventCode,
    isAuthChecked,
    isAuthenticated,
    router,
    checkEventExistence,
    setCreatedCharacter,
    setIsVerifying,
  ]);
}
