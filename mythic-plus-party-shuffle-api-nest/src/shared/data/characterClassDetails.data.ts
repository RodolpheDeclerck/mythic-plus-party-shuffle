import { CharacterClass } from '../enums/characterClass.enum';
import { Specialization } from '../enums/specialization.enum';

export const CharacterClassDetails: { [key in CharacterClass]: { specializations: Specialization[] } } = {
  
  [CharacterClass.Warrior]: {
    specializations: [
      Specialization.Warrior_Arms,
      Specialization.Warrior_Fury,
      Specialization.Warrior_Protection,
    ],
  },

  [CharacterClass.Deathknight]: {
    specializations: [
      Specialization.DeathKnight_Blood,
      Specialization.DeathKnight_Frost,
      Specialization.DeathKnight_Unholy,
    ],
  },

  [CharacterClass.Paladin]: {
    specializations: [
      Specialization.Paladin_Holy,
      Specialization.Paladin_Protection,
      Specialization.Paladin_Retribution,
    ],
  },

  [CharacterClass.Monk]: {
    specializations: [
      Specialization.Monk_Brewmaster,
      Specialization.Monk_Mistweaver,
      Specialization.Monk_Windwalker,
    ],
  },

  [CharacterClass.Priest]: {
    specializations: [
      Specialization.Priest_Discipline,
      Specialization.Priest_Holy,
      Specialization.Priest_Shadow,
    ],
  },

  [CharacterClass.Mage]: {
    specializations: [
      Specialization.Mage_Arcane,
      Specialization.Mage_Fire,
      Specialization.Mage_Frost,
    ],
  },

  [CharacterClass.Druid]: {
    specializations: [
      Specialization.Druid_Balance,
      Specialization.Druid_Feral,
      Specialization.Druid_Guardian,
      Specialization.Druid_Restoration,
    ],
  },

  [CharacterClass.Rogue]: {
    specializations: [
      Specialization.Rogue_Assassination,
      Specialization.Rogue_Outlaw,
      Specialization.Rogue_Subtlety,
    ],
  },

  [CharacterClass.Hunter]: {
    specializations: [
      Specialization.Hunter_BeastMastery,
      Specialization.Hunter_Marksmanship,
      Specialization.Hunter_Survival,
    ],
  },

  [CharacterClass.DemonHunter]: {
    specializations: [
      Specialization.DemonHunter_Havoc,
      Specialization.DemonHunter_Devourer,
      Specialization.DemonHunter_Vengeance,
    ],
  },

  [CharacterClass.Warlock]: {
    specializations: [
      Specialization.Warlock_Affliction,
      Specialization.Warlock_Demonology,
      Specialization.Warlock_Destruction,
    ],
  },

  [CharacterClass.Evoker]: {
    specializations: [
      Specialization.Evoker_Devastation,
      Specialization.Evoker_Preservation,
      Specialization.Evoker_Augmentation,
    ],
  },

  [CharacterClass.Shaman]: {
    specializations: [
      Specialization.Shaman_Elemental,
      Specialization.Shaman_Enhancement,
      Specialization.Shaman_Restoration,
    ],
  },
};
