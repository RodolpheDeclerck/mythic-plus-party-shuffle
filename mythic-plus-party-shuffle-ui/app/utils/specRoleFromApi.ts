import { WOW_CLASS_SPEC_TO_KEY } from '@/lib/wowClassSpecKeys';

export type EventPartyRolePreview =
  | 'tank'
  | 'healer'
  | 'meleeDps'
  | 'rangedDps';

/** Matches participant dialog / registration preview role mapping. */
const SPEC_ROLES: Record<string, Record<string, EventPartyRolePreview>> = {
  'Death Knight': {
    Blood: 'tank',
    Frost: 'meleeDps',
    Unholy: 'meleeDps',
  },
  Deathknight: {
    Blood: 'tank',
    Frost: 'meleeDps',
    Unholy: 'meleeDps',
  },
  'Demon Hunter': {
    Havoc: 'meleeDps',
    Devourer: 'rangedDps',
    Vengeance: 'tank',
  },
  Druid: {
    Balance: 'rangedDps',
    Feral: 'meleeDps',
    Guardian: 'tank',
    Restoration: 'healer',
  },
  Evoker: {
    Devastation: 'rangedDps',
    Preservation: 'healer',
    Augmentation: 'rangedDps',
  },
  Hunter: {
    'Beast Mastery': 'rangedDps',
    Marksmanship: 'rangedDps',
    Survival: 'meleeDps',
  },
  Mage: {
    Arcane: 'rangedDps',
    Fire: 'rangedDps',
    Frost: 'rangedDps',
  },
  Monk: {
    Brewmaster: 'tank',
    Mistweaver: 'healer',
    Windwalker: 'meleeDps',
  },
  Paladin: {
    Holy: 'healer',
    Protection: 'tank',
    Retribution: 'meleeDps',
  },
  Priest: {
    Discipline: 'healer',
    Holy: 'healer',
    Shadow: 'rangedDps',
  },
  Rogue: {
    Assassination: 'meleeDps',
    Outlaw: 'meleeDps',
    Subtlety: 'meleeDps',
  },
  Shaman: {
    Elemental: 'rangedDps',
    Enhancement: 'meleeDps',
    Restoration: 'healer',
  },
  Warlock: {
    Affliction: 'rangedDps',
    Demonology: 'rangedDps',
    Destruction: 'rangedDps',
  },
  Warrior: {
    Arms: 'meleeDps',
    Fury: 'meleeDps',
    Protection: 'tank',
  },
};

function normalizedClassName(wowClass: string): string {
  return wowClass === 'Deathknight' ? 'Death Knight' : wowClass;
}

function findSpecLabelForApiKey(
  wowClass: string,
  apiSpecKey: string,
): string | undefined {
  const candidates = Array.from(
    new Set(
      [
        wowClass,
        normalizedClassName(wowClass),
        'Death Knight',
        'Deathknight',
      ].filter(Boolean),
    ),
  );
  for (const c of candidates) {
    const byClass = WOW_CLASS_SPEC_TO_KEY[c];
    if (!byClass) continue;
    const hit = Object.entries(byClass).find(([, v]) => v === apiSpecKey);
    if (hit) return hit[0];
  }
  return undefined;
}

export function roleFromApiSpecialization(
  characterClass: string,
  apiSpecKey: string,
): EventPartyRolePreview {
  const label = findSpecLabelForApiKey(characterClass, apiSpecKey);
  const nk = normalizedClassName(characterClass);
  if (label && SPEC_ROLES[nk]?.[label]) return SPEC_ROLES[nk][label];
  return 'meleeDps';
}
