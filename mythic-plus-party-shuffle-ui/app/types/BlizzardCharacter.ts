/** Lightweight roster entry from the Account Profile Summary (no spec/iLevel). */
export interface BlizzardRosterCharacter {
  name: string;
  realmSlug: string;
  realmName: string;
  characterClass: string;
  level: number;
}

/** Character enriched from the Character Profile Summary (spec + iLevel). */
export interface BlizzardEnrichedCharacter {
  name: string;
  realmSlug: string;
  characterClass: string;
  specialization: string;
  iLevel: number;
}
