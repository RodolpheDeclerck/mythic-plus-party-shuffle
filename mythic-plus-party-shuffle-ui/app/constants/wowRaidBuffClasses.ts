/** Classes that can provide Bloodlust / Heroism / similar raid cooldown. */
export const WOW_BLOODLUST_CLASSES: string[] = [
  'Shaman',
  'Mage',
  'Hunter',
  'Evoker',
];

/** Classes that can provide combat resurrection. */
export const WOW_BATTLEREZ_CLASSES: string[] = [
  'Death Knight',
  'Druid',
  'Warlock',
  'Paladin',
];

export function wowClassHasBloodlust(wowClass: string): boolean {
  return WOW_BLOODLUST_CLASSES.includes(wowClass);
}

export function wowClassHasBattleRez(wowClass: string): boolean {
  return WOW_BATTLEREZ_CLASSES.includes(wowClass);
}
