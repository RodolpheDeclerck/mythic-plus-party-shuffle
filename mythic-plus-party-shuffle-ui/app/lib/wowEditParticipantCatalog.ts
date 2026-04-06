/** Matches `EventParticipant['role']` in eventPartyModel (kept local to avoid lib → components imports). */
type ParticipantRole = 'tank' | 'healer' | 'meleeDps' | 'rangedDps';

export const WOW_CLASSES_EDIT_PARTICIPANT: string[] = [
  'Death Knight',
  'Demon Hunter',
  'Druid',
  'Evoker',
  'Hunter',
  'Mage',
  'Monk',
  'Paladin',
  'Priest',
  'Rogue',
  'Shaman',
  'Warlock',
  'Warrior',
];

export const WOW_SPECS_BY_CLASS: Record<string, string[]> = {
  'Death Knight': ['Blood', 'Frost', 'Unholy'],
  'Demon Hunter': ['Havoc', 'Devourer', 'Vengeance'],
  Druid: ['Balance', 'Feral', 'Guardian', 'Restoration'],
  Evoker: ['Devastation', 'Preservation', 'Augmentation'],
  Hunter: ['Beast Mastery', 'Marksmanship', 'Survival'],
  Mage: ['Arcane', 'Fire', 'Frost'],
  Monk: ['Brewmaster', 'Mistweaver', 'Windwalker'],
  Paladin: ['Holy', 'Protection', 'Retribution'],
  Priest: ['Discipline', 'Holy', 'Shadow'],
  Rogue: ['Assassination', 'Outlaw', 'Subtlety'],
  Shaman: ['Elemental', 'Enhancement', 'Restoration'],
  Warlock: ['Affliction', 'Demonology', 'Destruction'],
  Warrior: ['Arms', 'Fury', 'Protection'],
};

const SPEC_ROLES: Record<string, Record<string, ParticipantRole>> = {
  'Death Knight': { Blood: 'tank', Frost: 'meleeDps', Unholy: 'meleeDps' },
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
  Mage: { Arcane: 'rangedDps', Fire: 'rangedDps', Frost: 'rangedDps' },
  Monk: {
    Brewmaster: 'tank',
    Mistweaver: 'healer',
    Windwalker: 'meleeDps',
  },
  Paladin: { Holy: 'healer', Protection: 'tank', Retribution: 'meleeDps' },
  Priest: { Discipline: 'healer', Holy: 'healer', Shadow: 'rangedDps' },
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
  Warrior: { Arms: 'meleeDps', Fury: 'meleeDps', Protection: 'tank' },
};

export function getEditParticipantSpecRole(
  wowClass: string,
  spec: string,
): ParticipantRole {
  return SPEC_ROLES[wowClass]?.[spec] ?? 'meleeDps';
}

export function specsForEditParticipantClass(wowClass: string): string[] {
  if (!wowClass) return [];
  return WOW_SPECS_BY_CLASS[wowClass] ?? [];
}
