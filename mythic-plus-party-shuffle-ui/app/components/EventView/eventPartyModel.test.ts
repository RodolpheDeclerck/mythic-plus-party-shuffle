import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';
import {
  characterRoleToEventView,
  eventViewRoleToCharacterRole,
  characterToEventParticipant,
  partyToEventPartyGroup,
  partiesToEventPartyGroups,
  eventPartyGroupsToParties,
} from './eventPartyModel';

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

const mkChar = (
  id: number,
  role: Character['role'],
  overrides: Partial<Character> = {},
): Character => ({
  id,
  name: `C${id}`,
  characterClass: 'Warrior',
  specialization: 'Warrior_Arms',
  iLevel: 620,
  role,
  bloodLust: false,
  battleRez: false,
  keystoneMinLevel: 2,
  keystoneMaxLevel: 10,
  ...overrides,
});

const specLabel = (c: Character) => `Spec_${c.id}`;

/* ------------------------------------------------------------------ */
/*  Role mapping                                                       */
/* ------------------------------------------------------------------ */

describe('characterRoleToEventView', () => {
  it('maps API roles to UI roles', () => {
    expect(characterRoleToEventView('TANK')).toBe('tank');
    expect(characterRoleToEventView('HEAL')).toBe('healer');
    expect(characterRoleToEventView('DIST')).toBe('rangedDps');
    expect(characterRoleToEventView('CAC')).toBe('meleeDps');
    expect(characterRoleToEventView('OTHER')).toBe('meleeDps');
  });
});

describe('eventViewRoleToCharacterRole', () => {
  it('maps UI roles to API roles', () => {
    expect(eventViewRoleToCharacterRole('tank')).toBe('TANK');
    expect(eventViewRoleToCharacterRole('healer')).toBe('HEAL');
    expect(eventViewRoleToCharacterRole('rangedDps')).toBe('DIST');
    expect(eventViewRoleToCharacterRole('meleeDps')).toBe('CAC');
  });
});

/* ------------------------------------------------------------------ */
/*  characterToEventParticipant                                        */
/* ------------------------------------------------------------------ */

describe('characterToEventParticipant', () => {
  it('converts all fields correctly', () => {
    const c = mkChar(42, 'TANK', { bloodLust: true, iLevel: 635 });
    const ep = characterToEventParticipant(c, 'Protection');
    expect(ep).toEqual(
      expect.objectContaining({
        id: '42',
        name: 'C42',
        role: 'tank',
        spec: 'Protection',
        ilvl: 635,
        hasBloodlust: true,
        hasBattleRez: false,
      }),
    );
  });
});

/* ------------------------------------------------------------------ */
/*  partyToEventPartyGroup                                             */
/* ------------------------------------------------------------------ */

describe('partyToEventPartyGroup', () => {
  it('preserves member order from the party', () => {
    const party: Party = {
      members: [mkChar(3, 'CAC'), mkChar(1, 'TANK'), mkChar(2, 'HEAL')],
    };
    const g = partyToEventPartyGroup(party, 0, specLabel);
    expect(g.members[0]?.id).toBe('3');
    expect(g.members[1]?.id).toBe('1');
    expect(g.members[2]?.id).toBe('2');
  });

  it('pads to 5 slots with nulls', () => {
    const party: Party = { members: [mkChar(1, 'TANK')] };
    const g = partyToEventPartyGroup(party, 0, specLabel);
    expect(g.members).toHaveLength(5);
    expect(g.members[0]?.id).toBe('1');
    expect(g.members.slice(1)).toEqual([null, null, null, null]);
  });

  it('truncates to 5 members if party has more', () => {
    const party: Party = {
      members: Array.from({ length: 7 }, (_, i) => mkChar(i + 1, 'CAC')),
    };
    const g = partyToEventPartyGroup(party, 0, specLabel);
    expect(g.members).toHaveLength(5);
  });

  it('uses the provided index in the group id', () => {
    const party: Party = { members: [mkChar(1, 'TANK')] };
    expect(partyToEventPartyGroup(party, 3, specLabel).id).toBe('group-3');
  });
});

/* ------------------------------------------------------------------ */
/*  partiesToEventPartyGroups                                          */
/* ------------------------------------------------------------------ */

describe('partiesToEventPartyGroups', () => {
  it('converts multiple parties maintaining order', () => {
    const parties: Party[] = [
      { members: [mkChar(1, 'TANK')] },
      { members: [mkChar(2, 'HEAL'), mkChar(3, 'CAC')] },
    ];
    const groups = partiesToEventPartyGroups(parties, specLabel);
    expect(groups).toHaveLength(2);
    expect(groups[0].id).toBe('group-0');
    expect(groups[1].members[0]?.id).toBe('2');
  });
});

/* ------------------------------------------------------------------ */
/*  Round-trip: groups → parties → groups                               */
/* ------------------------------------------------------------------ */

describe('eventPartyGroupsToParties round-trip', () => {
  it('preserves member data through conversion', () => {
    const characters = [mkChar(1, 'TANK'), mkChar(2, 'HEAL'), mkChar(3, 'CAC')];
    const party: Party = { members: characters };
    const groups = partiesToEventPartyGroups([party], specLabel);

    const roundTripped = eventPartyGroupsToParties(groups, characters);
    expect(roundTripped).toHaveLength(1);
    expect(roundTripped[0].members).toHaveLength(3);

    const ids = roundTripped[0].members.map((m) => m.id).sort();
    expect(ids).toEqual([1, 2, 3]);
  });

  it('skips null slots in conversion', () => {
    const characters = [mkChar(1, 'TANK')];
    const party: Party = { members: characters };
    const groups = partiesToEventPartyGroups([party], specLabel);

    // Group has 5 slots but only 1 member
    expect(groups[0].members).toHaveLength(5);

    const roundTripped = eventPartyGroupsToParties(groups, characters);
    expect(roundTripped[0].members).toHaveLength(1);
    expect(roundTripped[0].members[0].id).toBe(1);
  });
});
