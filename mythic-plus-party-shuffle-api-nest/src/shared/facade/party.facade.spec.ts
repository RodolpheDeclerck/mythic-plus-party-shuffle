import { PartyFacade } from './party.facade';

describe('PartyFacade', () => {
  it('shuffles, saves to redis and records history in order', async () => {
    const calls: string[] = [];
    const characters = [{ id: 1 }];
    const parties = [{ id: 1 }] as any;

    const eventService = {
      getCharactersByEventCode: jest.fn(async () => {
        calls.push('getCharacters');
        return characters;
      }),
    };
    const partyService = {
      shuffleGroups: jest.fn(async () => {
        calls.push('shuffle');
        return parties;
      }),
      saveGroupsToRedis: jest.fn(async () => {
        calls.push('save');
      }),
      saveShuffleToHistory: jest.fn(async () => {
        calls.push('history');
      }),
    };

    const facade = new PartyFacade(partyService as any, eventService as any);
    const result = await facade.shuffleAndSaveGroups('C');

    expect(eventService.getCharactersByEventCode).toHaveBeenCalledWith('C');
    expect(partyService.shuffleGroups).toHaveBeenCalledWith(characters, 'C');
    expect(partyService.saveGroupsToRedis).toHaveBeenCalledWith(parties, 'C');
    expect(partyService.saveShuffleToHistory).toHaveBeenCalledWith('C', parties);
    expect(calls).toEqual(['getCharacters', 'shuffle', 'save', 'history']);
    expect(result).toBe(parties);
  });
});
