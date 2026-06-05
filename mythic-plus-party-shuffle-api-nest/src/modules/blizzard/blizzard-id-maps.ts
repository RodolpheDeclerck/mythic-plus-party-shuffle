import { CharacterClass, Specialization } from '@prisma/client';

/**
 * Blizzard playable-class IDs → Prisma `CharacterClass`.
 * IDs are stable across locales, so we map on them rather than localized names.
 */
export const BLIZZARD_CLASS_ID_TO_ENUM: Record<number, CharacterClass> = {
  1: CharacterClass.Warrior,
  2: CharacterClass.Paladin,
  3: CharacterClass.Hunter,
  4: CharacterClass.Rogue,
  5: CharacterClass.Priest,
  6: CharacterClass.Deathknight,
  7: CharacterClass.Shaman,
  8: CharacterClass.Mage,
  9: CharacterClass.Warlock,
  10: CharacterClass.Monk,
  11: CharacterClass.Druid,
  12: CharacterClass.DemonHunter,
  13: CharacterClass.Evoker,
};

/**
 * Blizzard specialization IDs → Prisma `Specialization`.
 * Mapping on IDs disambiguates same-named specs (e.g. Mage "Frost" 64 vs
 * Death Knight "Frost" 251). The non-real `DemonHunter_Devourer` enum value
 * has no Blizzard ID and is intentionally absent.
 */
export const BLIZZARD_SPEC_ID_TO_ENUM: Record<number, Specialization> = {
  // Warrior
  71: Specialization.Warrior_Arms,
  72: Specialization.Warrior_Fury,
  73: Specialization.Warrior_Protection,
  // Paladin
  65: Specialization.Paladin_Holy,
  66: Specialization.Paladin_Protection,
  70: Specialization.Paladin_Retribution,
  // Hunter
  253: Specialization.Hunter_BeastMastery,
  254: Specialization.Hunter_Marksmanship,
  255: Specialization.Hunter_Survival,
  // Rogue
  259: Specialization.Rogue_Assassination,
  260: Specialization.Rogue_Outlaw,
  261: Specialization.Rogue_Subtlety,
  // Priest
  256: Specialization.Priest_Discipline,
  257: Specialization.Priest_Holy,
  258: Specialization.Priest_Shadow,
  // Death Knight
  250: Specialization.DeathKnight_Blood,
  251: Specialization.DeathKnight_Frost,
  252: Specialization.DeathKnight_Unholy,
  // Shaman
  262: Specialization.Shaman_Elemental,
  263: Specialization.Shaman_Enhancement,
  264: Specialization.Shaman_Restoration,
  // Mage
  62: Specialization.Mage_Arcane,
  63: Specialization.Mage_Fire,
  64: Specialization.Mage_Frost,
  // Warlock
  265: Specialization.Warlock_Affliction,
  266: Specialization.Warlock_Demonology,
  267: Specialization.Warlock_Destruction,
  // Monk
  268: Specialization.Monk_Brewmaster,
  269: Specialization.Monk_Windwalker,
  270: Specialization.Monk_Mistweaver,
  // Druid
  102: Specialization.Druid_Balance,
  103: Specialization.Druid_Feral,
  104: Specialization.Druid_Guardian,
  105: Specialization.Druid_Restoration,
  // Demon Hunter
  577: Specialization.DemonHunter_Havoc,
  581: Specialization.DemonHunter_Vengeance,
  // Evoker
  1467: Specialization.Evoker_Devastation,
  1468: Specialization.Evoker_Preservation,
  1473: Specialization.Evoker_Augmentation,
};

export function resolveCharacterClass(
  classId: number | undefined,
): CharacterClass | undefined {
  return classId === undefined ? undefined : BLIZZARD_CLASS_ID_TO_ENUM[classId];
}

export function resolveSpecialization(
  specId: number | undefined,
): Specialization | undefined {
  return specId === undefined ? undefined : BLIZZARD_SPEC_ID_TO_ENUM[specId];
}
