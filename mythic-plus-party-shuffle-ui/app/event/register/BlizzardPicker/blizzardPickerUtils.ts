import { CharacterClass } from '@/enums/CharacterClass';
import { CharacterClassColors } from '@/enums/CharacterClassColours';
import { toDisplayCharacterClass } from '@/utils/characterClassApiMap';
import { roleFromApiSpecialization } from '@/utils/specRoleFromApi';
import {
  WOW_BLOODLUST_CLASSES,
  WOW_BATTLEREZ_CLASSES,
} from '@/constants/wowRaidBuffClasses';
import type { EventPartyRolePreview } from '@/utils/specRoleFromApi';
import type { BlizzardEnrichedCharacter } from '@/types/BlizzardCharacter';

/** Hex class color for an API class value (enum form, e.g. `Deathknight`). */
export function classColor(characterClass: string): string {
  return CharacterClassColors[characterClass as CharacterClass] ?? '#FFFFFF';
}

/** Raid-buff flags derived from the class display name. */
export function deriveBuffs(characterClass: string): {
  hasBloodlust: boolean;
  hasBattleRez: boolean;
} {
  const display = toDisplayCharacterClass(characterClass);
  return {
    hasBloodlust: WOW_BLOODLUST_CLASSES.includes(display),
    hasBattleRez: WOW_BATTLEREZ_CLASSES.includes(display),
  };
}

/** Role derived from class + specialization (same mapping as the manual form). */
export function deriveRole(
  character: Pick<BlizzardEnrichedCharacter, 'characterClass' | 'specialization'>,
): EventPartyRolePreview {
  return roleFromApiSpecialization(
    character.characterClass,
    character.specialization,
  );
}
