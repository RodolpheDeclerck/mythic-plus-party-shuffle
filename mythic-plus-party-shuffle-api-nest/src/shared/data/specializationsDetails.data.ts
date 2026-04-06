import { Role } from '../enums/role.enum';
import { Specialization } from '../enums/specialization.enum';

// Mapping des spécialisations avec leurs rôles, Bloodlust et Battle Rez
export const SpecializationDetails: { [key in Specialization]: { role: Role; bloodLust: boolean; battleRez: boolean } } = {
    // Warrior specializations
    [Specialization.Warrior_Arms]: { role: Role.DPS_CAC, bloodLust: false, battleRez: false },
    [Specialization.Warrior_Fury]: { role: Role.DPS_CAC, bloodLust: false, battleRez: false },
    [Specialization.Warrior_Protection]: { role: Role.Tank, bloodLust: false, battleRez: false },
  
    // Mage specializations
    [Specialization.Mage_Arcane]: { role: Role.DPS_DIST, bloodLust: true, battleRez: false },
    [Specialization.Mage_Fire]: { role: Role.DPS_DIST, bloodLust: true, battleRez: false },
    [Specialization.Mage_Frost]: { role: Role.DPS_DIST, bloodLust: true, battleRez: false },
  
    // Druid specializations
    [Specialization.Druid_Balance]: { role: Role.DPS_DIST, bloodLust: false, battleRez: true },
    [Specialization.Druid_Feral]: { role: Role.DPS_CAC, bloodLust: false, battleRez: true },
    [Specialization.Druid_Guardian]: { role: Role.Tank, bloodLust: false, battleRez: true },
    [Specialization.Druid_Restoration]: { role: Role.Heal, bloodLust: false, battleRez: true },
  
    // Paladin specializations
    [Specialization.Paladin_Holy]: { role: Role.Heal, bloodLust: false, battleRez: true },
    [Specialization.Paladin_Protection]: { role: Role.Tank, bloodLust: false, battleRez: true },
    [Specialization.Paladin_Retribution]: { role: Role.DPS_CAC, bloodLust: false, battleRez: true },
  
    // Hunter specializations
    [Specialization.Hunter_BeastMastery]: { role: Role.DPS_DIST, bloodLust: true, battleRez: false },
    [Specialization.Hunter_Marksmanship]: { role: Role.DPS_DIST, bloodLust: true, battleRez: false },
    [Specialization.Hunter_Survival]: { role: Role.DPS_CAC, bloodLust: true, battleRez: false },
  
    // Rogue specializations
    [Specialization.Rogue_Assassination]: { role: Role.DPS_CAC, bloodLust: false, battleRez: false },
    [Specialization.Rogue_Outlaw]: { role: Role.DPS_CAC, bloodLust: false, battleRez: false },
    [Specialization.Rogue_Subtlety]: { role: Role.DPS_CAC, bloodLust: false, battleRez: false },
  
    // Priest specializations
    [Specialization.Priest_Discipline]: { role: Role.Heal, bloodLust: false, battleRez: false },
    [Specialization.Priest_Holy]: { role: Role.Heal, bloodLust: false, battleRez: false },
    [Specialization.Priest_Shadow]: { role: Role.DPS_DIST, bloodLust: false, battleRez: false },
  
    // Death Knight specializations
    [Specialization.DeathKnight_Blood]: { role: Role.Tank, bloodLust: false, battleRez: true },
    [Specialization.DeathKnight_Frost]: { role: Role.DPS_CAC, bloodLust: false, battleRez: true },
    [Specialization.DeathKnight_Unholy]: { role: Role.DPS_CAC, bloodLust: false, battleRez: true },
  
    // Shaman specializations
    [Specialization.Shaman_Elemental]: { role: Role.DPS_DIST, bloodLust: true, battleRez: false },
    [Specialization.Shaman_Enhancement]: { role: Role.DPS_CAC, bloodLust: true, battleRez: false },
    [Specialization.Shaman_Restoration]: { role: Role.Heal, bloodLust: true, battleRez: false },
  
    // Warlock specializations
    [Specialization.Warlock_Affliction]: { role: Role.DPS_DIST, bloodLust: false, battleRez: true },
    [Specialization.Warlock_Demonology]: { role: Role.DPS_DIST, bloodLust: false, battleRez: true },
    [Specialization.Warlock_Destruction]: { role: Role.DPS_DIST, bloodLust: false, battleRez: true },
  
    // Monk specializations
    [Specialization.Monk_Brewmaster]: { role: Role.Tank, bloodLust: false, battleRez: false },
    [Specialization.Monk_Mistweaver]: { role: Role.Heal, bloodLust: false, battleRez: false },
    [Specialization.Monk_Windwalker]: { role: Role.DPS_CAC, bloodLust: false, battleRez: false },
  
    // Demon Hunter specializations
    [Specialization.DemonHunter_Havoc]: { role: Role.DPS_CAC, bloodLust: false, battleRez: false },
    [Specialization.DemonHunter_Devourer]: { role: Role.DPS_DIST, bloodLust: false, battleRez: false },
    [Specialization.DemonHunter_Vengeance]: { role: Role.Tank, bloodLust: false, battleRez: false },
  
    // Evoker specializations (avec la nouvelle spécialisation Augmentation)
    [Specialization.Evoker_Devastation]: { role: Role.DPS_DIST, bloodLust: true, battleRez: false },
    [Specialization.Evoker_Preservation]: { role: Role.Heal, bloodLust: true, battleRez: false },
    [Specialization.Evoker_Augmentation]: { role: Role.DPS_DIST, bloodLust: true, battleRez: false },
  };
  