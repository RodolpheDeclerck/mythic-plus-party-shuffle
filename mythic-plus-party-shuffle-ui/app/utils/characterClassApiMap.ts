/**
 * PostgreSQL / Nest enums use compact identifiers (`Deathknight`, `DemonHunter`);
 * the WoW UI uses spaced labels (`Death Knight`, `Demon Hunter`).
 */
const DISPLAY_TO_API: Record<string, string> = {
  'Death Knight': 'Deathknight',
  'Demon Hunter': 'DemonHunter',
};

const API_TO_DISPLAY: Record<string, string> = {
  Deathknight: 'Death Knight',
  DemonHunter: 'Demon Hunter',
};

export function toApiCharacterClass(className: string): string {
  return DISPLAY_TO_API[className] ?? className;
}

export function toDisplayCharacterClass(className: string): string {
  return API_TO_DISPLAY[className] ?? className;
}
