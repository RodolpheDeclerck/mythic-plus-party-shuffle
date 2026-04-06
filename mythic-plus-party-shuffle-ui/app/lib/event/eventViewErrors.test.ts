import {
  CHARACTERS_FETCH_FAILED,
  resolveEventViewErrorMessage,
} from './eventViewErrors';

const mockT = (key: string) =>
  (
    {
      'eventPage.fetchCharactersError': 'FETCH_MSG',
      'eventPage.loadError': 'LOAD_MSG',
    } as Record<string, string>
  )[key] ?? key;

describe('resolveEventViewErrorMessage', () => {
  it('maps hook charactersFetchErrorCode to i18n fetch message', () => {
    expect(
      resolveEventViewErrorMessage(mockT, {
        charactersFetchErrorCode: CHARACTERS_FETCH_FAILED,
        errorState: null,
        characterError: null,
        partyError: null,
      }),
    ).toBe('FETCH_MSG');
  });

  it('maps errorState CHARACTERS_FETCH_FAILED to i18n fetch message', () => {
    expect(
      resolveEventViewErrorMessage(mockT, {
        charactersFetchErrorCode: null,
        errorState: CHARACTERS_FETCH_FAILED,
        characterError: null,
        partyError: null,
      }),
    ).toBe('FETCH_MSG');
  });

  it('prefers fetch code over other errorState strings', () => {
    expect(
      resolveEventViewErrorMessage(mockT, {
        charactersFetchErrorCode: CHARACTERS_FETCH_FAILED,
        errorState: 'Other',
        characterError: null,
        partyError: null,
      }),
    ).toBe('FETCH_MSG');
  });

  it('returns raw errorState when not a fetch code', () => {
    expect(
      resolveEventViewErrorMessage(mockT, {
        charactersFetchErrorCode: null,
        errorState: 'Custom backend',
        characterError: null,
        partyError: null,
      }),
    ).toBe('Custom backend');
  });

  it('falls back to characterError then partyError then loadError', () => {
    expect(
      resolveEventViewErrorMessage(mockT, {
        charactersFetchErrorCode: null,
        errorState: null,
        characterError: 'Char err',
        partyError: null,
      }),
    ).toBe('Char err');

    expect(
      resolveEventViewErrorMessage(mockT, {
        charactersFetchErrorCode: null,
        errorState: null,
        characterError: null,
        partyError: 'Party err',
      }),
    ).toBe('Party err');

    expect(
      resolveEventViewErrorMessage(mockT, {
        charactersFetchErrorCode: null,
        errorState: null,
        characterError: null,
        partyError: null,
      }),
    ).toBe('LOAD_MSG');
  });
});
