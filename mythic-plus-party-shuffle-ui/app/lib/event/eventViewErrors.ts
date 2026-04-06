/** Data-layer error code; UI translates via i18n. */
export const CHARACTERS_FETCH_FAILED = 'CHARACTERS_FETCH_FAILED' as const;

export type CharactersFetchErrorCode = typeof CHARACTERS_FETCH_FAILED;

type TranslateFn = (key: string) => string;

export function resolveEventViewErrorMessage(
  t: TranslateFn,
  input: {
    charactersFetchErrorCode: CharactersFetchErrorCode | null;
    errorState: string | null;
    characterError: string | null;
    partyError: string | null;
  },
): string {
  const {
    charactersFetchErrorCode,
    errorState,
    characterError,
    partyError,
  } = input;

  if (charactersFetchErrorCode === CHARACTERS_FETCH_FAILED) {
    return t('eventPage.fetchCharactersError');
  }
  if (errorState === CHARACTERS_FETCH_FAILED) {
    return t('eventPage.fetchCharactersError');
  }
  if (errorState) return errorState;
  if (characterError) return characterError;
  if (partyError) return partyError;
  return t('eventPage.loadError');
}
