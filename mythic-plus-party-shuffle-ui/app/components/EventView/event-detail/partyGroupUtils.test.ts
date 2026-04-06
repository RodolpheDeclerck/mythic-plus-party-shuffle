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
    tank: participant('1'),
    healer: participant('2'),
    dps: [participant('3'), participant('4'), participant('5')],
  };

  it('detects tank', () => {
    expect(partyGroupContainsCharacterId(group, 1)).toBe(true);
  });

  it('detects dps', () => {
    expect(partyGroupContainsCharacterId(group, 4)).toBe(true);
  });

  it('returns false when absent', () => {
    expect(partyGroupContainsCharacterId(group, 99)).toBe(false);
  });
});

describe('getGroupSize', () => {
  it('counts slots', () => {
    expect(
      getGroupSize({
        id: 'g',
        tank: null,
        healer: null,
        dps: [],
      }),
    ).toBe(0);
    expect(
      getGroupSize({
        id: 'g',
        tank: participant('1'),
        healer: participant('2'),
        dps: [participant('3')],
      }),
    ).toBe(3);
  });
});

describe('isGroupEmpty', () => {
  it('is true when no members', () => {
    expect(
      isGroupEmpty({
        id: 'g',
        tank: null,
        healer: null,
        dps: [],
      }),
    ).toBe(true);
  });
});

describe('assignedParticipantIds', () => {
  it('collects all ids', () => {
    const groups: EventPartyGroup[] = [
      {
        id: 'a',
        tank: participant('10'),
        healer: null,
        dps: [participant('11')],
      },
      {
        id: 'b',
        tank: null,
        healer: participant('20'),
        dps: [],
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
        tank: null,
        healer: null,
        dps: [],
      }),
    ).toBeNull();
  });

  it('aggregates ilvl and keys', () => {
    const stats = getPartyGroupAggregateStats({
      id: 'g',
      tank: participant('1', { ilvl: 100, keyMin: 2, keyMax: 4 }),
      healer: participant('2', { ilvl: 200, keyMin: 5, keyMax: 8 }),
      dps: [],
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
