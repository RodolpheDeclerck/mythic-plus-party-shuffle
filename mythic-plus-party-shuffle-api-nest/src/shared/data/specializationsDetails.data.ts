import { Role, Specialization } from '@prisma/client';

// Mapping des spécialisations avec leurs rôles, Bloodlust et Battle Rez
export const SpecializationDetails: {
  [key in Specialization]: {
    role: Role;
    bloodLust: boolean;
    battleRez: boolean;
  };
} = {
  // Warrior specializations
  [Specialization.Warrior_Arms]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.Warrior_Fury]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.Warrior_Protection]: {
    role: Role.TANK,
    bloodLust: false,
    battleRez: false,
  },

  // Mage specializations
  [Specialization.Mage_Arcane]: {
    role: Role.DIST,
    bloodLust: true,
    battleRez: false,
  },
  [Specialization.Mage_Fire]: {
    role: Role.DIST,
    bloodLust: true,
    battleRez: false,
  },
  [Specialization.Mage_Frost]: {
    role: Role.DIST,
    bloodLust: true,
    battleRez: false,
  },

  // Druid specializations
  [Specialization.Druid_Balance]: {
    role: Role.DIST,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.Druid_Feral]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.Druid_Guardian]: {
    role: Role.TANK,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.Druid_Restoration]: {
    role: Role.HEAL,
    bloodLust: false,
    battleRez: true,
  },

  // Paladin specializations
  [Specialization.Paladin_Holy]: {
    role: Role.HEAL,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.Paladin_Protection]: {
    role: Role.TANK,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.Paladin_Retribution]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: true,
  },

  // Hunter specializations
  [Specialization.Hunter_BeastMastery]: {
    role: Role.DIST,
    bloodLust: true,
    battleRez: false,
  },
  [Specialization.Hunter_Marksmanship]: {
    role: Role.DIST,
    bloodLust: true,
    battleRez: false,
  },
  [Specialization.Hunter_Survival]: {
    role: Role.CAC,
    bloodLust: true,
    battleRez: false,
  },

  // Rogue specializations
  [Specialization.Rogue_Assassination]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.Rogue_Outlaw]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.Rogue_Subtlety]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: false,
  },

  // Priest specializations
  [Specialization.Priest_Discipline]: {
    role: Role.HEAL,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.Priest_Holy]: {
    role: Role.HEAL,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.Priest_Shadow]: {
    role: Role.DIST,
    bloodLust: false,
    battleRez: false,
  },

  // Death Knight specializations
  [Specialization.DeathKnight_Blood]: {
    role: Role.TANK,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.DeathKnight_Frost]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.DeathKnight_Unholy]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: true,
  },

  // Shaman specializations
  [Specialization.Shaman_Elemental]: {
    role: Role.DIST,
    bloodLust: true,
    battleRez: false,
  },
  [Specialization.Shaman_Enhancement]: {
    role: Role.CAC,
    bloodLust: true,
    battleRez: false,
  },
  [Specialization.Shaman_Restoration]: {
    role: Role.HEAL,
    bloodLust: true,
    battleRez: false,
  },

  // Warlock specializations
  [Specialization.Warlock_Affliction]: {
    role: Role.DIST,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.Warlock_Demonology]: {
    role: Role.DIST,
    bloodLust: false,
    battleRez: true,
  },
  [Specialization.Warlock_Destruction]: {
    role: Role.DIST,
    bloodLust: false,
    battleRez: true,
  },

  // Monk specializations
  [Specialization.Monk_Brewmaster]: {
    role: Role.TANK,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.Monk_Mistweaver]: {
    role: Role.HEAL,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.Monk_Windwalker]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: false,
  },

  // Demon Hunter specializations
  [Specialization.DemonHunter_Havoc]: {
    role: Role.CAC,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.DemonHunter_Devourer]: {
    role: Role.DIST,
    bloodLust: false,
    battleRez: false,
  },
  [Specialization.DemonHunter_Vengeance]: {
    role: Role.TANK,
    bloodLust: false,
    battleRez: false,
  },

  // Evoker specializations
  [Specialization.Evoker_Devastation]: {
    role: Role.DIST,
    bloodLust: true,
    battleRez: false,
  },
  [Specialization.Evoker_Preservation]: {
    role: Role.HEAL,
    bloodLust: true,
    battleRez: false,
  },
  [Specialization.Evoker_Augmentation]: {
    role: Role.DIST,
    bloodLust: true,
    battleRez: false,
  },
};
