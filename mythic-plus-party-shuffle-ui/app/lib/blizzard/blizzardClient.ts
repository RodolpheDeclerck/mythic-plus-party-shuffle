import axios from 'axios';
import apiUrl from '@/config/apiConfig';
import type {
  BlizzardRosterCharacter,
  BlizzardEnrichedCharacter,
} from '@/types/BlizzardCharacter';

/** Stable code returned by the backend (409) when Battle.net is not linked. */
export const BATTLENET_NOT_LINKED = 'BATTLENET_NOT_LINKED';

/** True when the error is the backend's "Battle.net not linked" signal. */
export function isNotLinkedError(error: unknown): boolean {
  return (
    axios.isAxiosError(error) &&
    error.response?.status === 409 &&
    (error.response?.data as { code?: string } | undefined)?.code ===
      BATTLENET_NOT_LINKED
  );
}

/** Fetches the authenticated user's WoW roster (light list, no spec/iLevel). */
export async function fetchBlizzardRoster(): Promise<BlizzardRosterCharacter[]> {
  const response = await axios.get<BlizzardRosterCharacter[]>(
    `${apiUrl}/api/blizzard/characters`,
  );
  return response.data;
}

/** Enriches one character with its specialization and item level (on selection). */
export async function fetchBlizzardCharacter(
  realmSlug: string,
  name: string,
): Promise<BlizzardEnrichedCharacter> {
  const response = await axios.get<BlizzardEnrichedCharacter>(
    `${apiUrl}/api/blizzard/characters/${encodeURIComponent(
      realmSlug,
    )}/${encodeURIComponent(name)}`,
  );
  return response.data;
}
