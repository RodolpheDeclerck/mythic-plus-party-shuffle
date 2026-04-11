import type { EventPartyGroup } from '@/components/EventView/eventPartyModel';
import {
  partyGroupContainsCharacterId,
  getGroupSize,
  isGroupEmpty,
  assignedParticipantIds,
  getPartyGroupAggregateStats,
} from './partyGroupUtils';

const participant = (
  id: string,
  overrides: Partial<{
    ilvl: number;
    keyMin: number;
    keyMax: number;
    hasBloodlust: boolean;
    hasBattleRez: boolean;
  }> = {},
) => ({
  id,
  name: 'N',
  class: 'Warrior',
  spec: 'Arms',
  role: 'tank' as const,
  ilvl: 100,
  hasBloodlust: false,
  hasBattleRez: false,
  keyMin: 2,
  keyMax: 5,
  ...overrides,
});

describe('partyGroupContainsCharacterId', () => {
  const group: EventPartyGroup = {
    id: 'g1',
    members: [
      participant('1'),
      participant('2'),
      participant('3'),
      participant('4'),
      participant('5'),
    ],
  };

  it('detects member by id', () => {
    expect(partyGroupContainsCharacterId(group, 1)).toBe(true);
  });

  it('detects member in any slot', () => {
    expect(partyGroupContainsCharacterId(group, 4)).toBe(true);
  });

  it('returns false when absent', () => {
    expect(partyGroupContainsCharacterId(group, 99)).toBe(false);
  });
});

describe('getGroupSize', () => {
  it('counts filled slots', () => {
    expect(
      getGroupSize({
        id: 'g',
        members: [null, null, null, null, null],
      }),
    ).toBe(0);
    expect(
      getGroupSize({
        id: 'g',
        members: [participant('1'), participant('2'), participant('3'), null, null],
      }),
    ).toBe(3);
  });
});

describe('isGroupEmpty', () => {
  it('is true when no members', () => {
    expect(
      isGroupEmpty({
        id: 'g',
        members: [null, null, null, null, null],
      }),
    ).toBe(true);
  });
});

describe('assignedParticipantIds', () => {
  it('collects all ids', () => {
    const groups: EventPartyGroup[] = [
      {
        id: 'a',
        members: [participant('10'), null, participant('11'), null, null],
      },
      {
        id: 'b',
        members: [null, participant('20'), null, null, null],
      },
    ];
    expect(assignedParticipantIds(groups)).toEqual(new Set(['10', '11', '20']));
  });
});

describe('getPartyGroupAggregateStats', () => {
  it('returns null for empty group', () => {
    expect(
      getPartyGroupAggregateStats({
        id: 'g',
        members: [null, null, null, null, null],
      }),
    ).toBeNull();
  });

  it('aggregates ilvl and keys', () => {
    const stats = getPartyGroupAggregateStats({
      id: 'g',
      members: [
        participant('1', { ilvl: 100, keyMin: 2, keyMax: 4 }),
        participant('2', { ilvl: 200, keyMin: 5, keyMax: 8 }),
        null,
        null,
        null,
      ],
    });
    expect(stats).toEqual({
      minIlvl: 100,
      maxIlvl: 200,
      avgIlvlRounded: 150,
      minKey: 2,
      maxKey: 8,
    });
  });
});
