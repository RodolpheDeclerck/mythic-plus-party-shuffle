// Enum pour les spécialisations par classe
export enum Specialization {
    // Guerrier a des spécialisations associées à des rôles
    Warrior_Arms = 'Warrior_Arms',
    Warrior_Fury = 'Warrior_Fury',
    Warrior_Protection = 'Warrior_Protection',
  
    // Paladin peut être Tank, Heal, ou DPS
    Paladin_Holy = 'Paladin_Holy',
    Paladin_Protection = 'Paladin_Protection',
    Paladin_Retribution = 'Paladin_Retribution',
  
    // Chasseur (Hunter) a des spécialisations DPS
    Hunter_BeastMastery = 'Hunter_BeastMastery',
    Hunter_Marksmanship = 'Hunter_Marksmanship',
    Hunter_Survival = 'Hunter_Survival',
  
    // Rogue (Voleur) a des spécialisations DPS
    Rogue_Assassination = 'Rogue_Assassination',
    Rogue_Outlaw = 'Rogue_Outlaw',
    Rogue_Subtlety = 'Rogue_Subtlety',
  
    // Prêtre (Priest) peut être Heal ou DPS
    Priest_Discipline = 'Priest_Discipline',
    Priest_Holy = 'Priest_Holy',
    Priest_Shadow = 'Priest_Shadow',
  
    // Chevalier de la mort (Death Knight) a des spécialisations Tank ou DPS
    DeathKnight_Blood = 'DeathKnight_Blood',
    DeathKnight_Frost = 'DeathKnight_Frost',
    DeathKnight_Unholy = 'DeathKnight_Unholy',
  
    // Chaman (Shaman) peut être Heal ou DPS
    Shaman_Elemental = 'Shaman_Elemental',
    Shaman_Enhancement = 'Shaman_Enhancement',
    Shaman_Restoration = 'Shaman_Restoration',
  
    // Mage a des spécialisations purement DPS
    Mage_Arcane = 'Mage_Arcane',
    Mage_Fire = 'Mage_Fire',
    Mage_Frost = 'Mage_Frost',
  
    // Démoniste (Warlock) a des spécialisations purement DPS
    Warlock_Affliction = 'Warlock_Affliction',
    Warlock_Demonology = 'Warlock_Demonology',
    Warlock_Destruction = 'Warlock_Destruction',
  
    // Moine (Monk) peut être Tank, Heal, ou DPS
    Monk_Brewmaster = 'Monk_Brewmaster',
    Monk_Mistweaver = 'Monk_Mistweaver',
    Monk_Windwalker = 'Monk_Windwalker',
  
    // Druide peut être Tank, Heal, ou DPS
    Druid_Balance = 'Druid_Balance',
    Druid_Feral = 'Druid_Feral',
    Druid_Guardian = 'Druid_Guardian',
    Druid_Restoration = 'Druid_Restoration',
  
    // Chasseur de démons (Demon Hunter) : Tank, DPS mêlée ou DPS à distance
    DemonHunter_Havoc = 'DemonHunter_Havoc',
    DemonHunter_Devourer = 'DemonHunter_Devourer',
    DemonHunter_Vengeance = 'DemonHunter_Vengeance',
  
    // Évocateur (Evoker) peut être Heal ou DPS
    Evoker_Devastation = 'Evoker_Devastation',
    Evoker_Preservation = 'Evoker_Preservation',
    Evoker_Augmentation = 'Evoker_Augmentation',
  }