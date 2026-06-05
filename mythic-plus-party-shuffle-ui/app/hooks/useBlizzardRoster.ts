'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BlizzardRosterCharacter } from '@/types/BlizzardCharacter';
import { fetchBlizzardRoster, isNotLinkedError } from '@/lib/blizzard/blizzardClient';

interface UseBlizzardRosterResult {
  characters: BlizzardRosterCharacter[];
  loading: boolean;
  /** True when the user has not linked their Battle.net account yet. */
  notLinked: boolean;
  /** Generic load failure (not the not-linked case). */
  error: boolean;
  reload: () => void;
}

/** Loads the authenticated user's WoW roster, distinguishing the not-linked state. */
export function useBlizzardRoster(): UseBlizzardRosterResult {
  const [characters, setCharacters] = useState<BlizzardRosterCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setNotLinked(false);
    setError(false);

    fetchBlizzardRoster()
      .then((data) => {
        if (!cancelled) setCharacters(data);
      })
      .catch((e) => {
        if (cancelled) return;
        if (isNotLinkedError(e)) {
          setNotLinked(true);
        } else {
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { characters, loading, notLinked, error, reload };
}
