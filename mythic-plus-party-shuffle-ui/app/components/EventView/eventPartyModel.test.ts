import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';
import {
  characterRoleToEventView,
  eventViewRoleToCharacterRole,
  characterToEventParticipant,
  partyToEventPartyGroup,
} from './eventPartyModel';

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

describe('characterToEventParticipant', () => {
  const base: Character = {
    id: 42,
    name: 'Test',
    characterClass: 'Warrior',
    specialization: 'Warrior_Arms',
    iLevel: 600,
    role: 'TANK',
    bloodLust: true,
    battleRez: false,
    keystoneMinLevel: 10,
    keystoneMaxLevel: 15,
  };

  it('builds participant with spec label', () => {
    const p = characterToEventParticipant(base, 'Arms');
    expect(p.id).toBe('42');
    expect(p.name).toBe('Test');
    expect(p.role).toBe('tank');
    expect(p.spec).toBe('Arms');
    expect(p.ilvl).toBe(600);
    expect(p.hasBloodlust).toBe(true);
    expect(p.hasBattleRez).toBe(false);
    expect(p.keyMin).toBe(10);
    expect(p.keyMax).toBe(15);
  });
});

describe('partyToEventPartyGroup', () => {
  const mk = (id: number, role: Character['role']): Character => ({
    id,
    name: `N${id}`,
    characterClass: 'Warrior',
    specialization: 'Warrior_Arms',
    iLevel: 100,
    role,
    bloodLust: false,
    battleRez: false,
    keystoneMinLevel: 2,
    keystoneMaxLevel: 5,
  });

  const specLabel = (c: Character) => `S${c.id}`;

  it('assigns tank, healer, and remaining as dps', () => {
    const party: Party = {
      members: [mk(1, 'TANK'), mk(2, 'HEAL'), mk(3, 'CAC'), mk(4, 'DIST')],
    };
    const g = partyToEventPartyGroup(party, 0, specLabel);
    expect(g.id).toBe('group-0');
    expect(g.tank?.id).toBe('1');
    expect(g.tank?.spec).toBe('S1');
    expect(g.healer?.id).toBe('2');
    const dpsIds = g.dps.map((d) => d.id).sort();
    expect(dpsIds).toEqual(['3', '4']);
  });
});
