const deathKnightSpecs: Record<string, string> = {
  Blood: 'DeathKnight_Blood',
  Frost: 'DeathKnight_Frost',
  Unholy: 'DeathKnight_Unholy',
};

/** Maps UI class + spec labels to API specialization keys (translation keys). */
export const WOW_CLASS_SPEC_TO_KEY: Record<string, Record<string, string>> = {
  'Death Knight': deathKnightSpecs,
  /** Same keys as API / PostgreSQL enum (`Deathknight`). */
  Deathknight: deathKnightSpecs,
  'Demon Hunter': {
    Havoc: 'DemonHunter_Havoc',
    Devourer: 'DemonHunter_Devourer',
    Vengeance: 'DemonHunter_Vengeance',
  },
  Druid: {
    Balance: 'Druid_Balance',
    Feral: 'Druid_Feral',
    Guardian: 'Druid_Guardian',
    Restoration: 'Druid_Restoration',
  },
  Evoker: {
    Devastation: 'Evoker_Devastation',
    Preservation: 'Evoker_Preservation',
    Augmentation: 'Evoker_Augmentation',
  },
  Hunter: {
    'Beast Mastery': 'Hunter_BeastMastery',
    Marksmanship: 'Hunter_Marksmanship',
    Survival: 'Hunter_Survival',
  },
  Mage: {
    Arcane: 'Mage_Arcane',
    Fire: 'Mage_Fire',
    Frost: 'Mage_Frost',
  },
  Monk: {
    Brewmaster: 'Monk_Brewmaster',
    Mistweaver: 'Monk_Mistweaver',
    Windwalker: 'Monk_Windwalker',
  },
  Paladin: {
    Holy: 'Paladin_Holy',
    Protection: 'Paladin_Protection',
    Retribution: 'Paladin_Retribution',
  },
  Priest: {
    Discipline: 'Priest_Discipline',
    Holy: 'Priest_Holy',
    Shadow: 'Priest_Shadow',
  },
  Rogue: {
    Assassination: 'Rogue_Assassination',
    Outlaw: 'Rogue_Outlaw',
    Subtlety: 'Rogue_Subtlety',
  },
  Shaman: {
    Elemental: 'Shaman_Elemental',
    Enhancement: 'Shaman_Enhancement',
    Restoration: 'Shaman_Restoration',
  },
  Warlock: {
    Affliction: 'Warlock_Affliction',
    Demonology: 'Warlock_Demonology',
    Destruction: 'Warlock_Destruction',
  },
  Warrior: {
    Arms: 'Warrior_Arms',
    Fury: 'Warrior_Fury',
    Protection: 'Warrior_Protection',
  },
};

export function resolveSpecializationKey(
  wowClass: string,
  specLabel: string,
): string {
  const byClass = WOW_CLASS_SPEC_TO_KEY[wowClass];
  if (!byClass) return 'Warrior_Arms';
  const direct = byClass[specLabel];
  if (direct) return direct;
  const found = Object.entries(byClass).find(
    ([k]) => k.toLowerCase() === specLabel.toLowerCase(),
  );
  return found?.[1] ?? 'Warrior_Arms';
}
