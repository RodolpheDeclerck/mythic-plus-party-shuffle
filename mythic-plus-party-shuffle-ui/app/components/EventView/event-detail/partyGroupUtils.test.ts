import type {
  EventParticipant,
  EventPartyGroup,
} from '@/components/EventView/eventPartyModel';
import {
  partyGroupContainsCharacterId,
  getGroupSize,
  isGroupEmpty,
  assignedParticipantIds,
  getPartyGroupAggregateStats,
  getPartyGroupCompositionStatus,
  groupHasBL,
  groupHasRez,
  adminGroupIlvlBadgeClass,
} from './partyGroupUtils';
import {
  ITEM_LEVEL_TIER_HIGH,
  ITEM_LEVEL_TIER_MID,
  ITEM_LEVEL_TIER_LOW,
} from '@/constants/itemLevels';

/* ------------------------------------------------------------------ */
/*  Factory                                                            */
/* ------------------------------------------------------------------ */

const p = (
  id: string,
  overrides: Partial<EventParticipant> = {},
): EventParticipant => ({
  id,
  name: `P${id}`,
  class: 'Warrior',
  spec: 'Arms',
  role: 'meleeDps',
  ilvl: 620,
  hasBloodlust: false,
  hasBattleRez: false,
  keyMin: 2,
  keyMax: 10,
  ...overrides,
});

const group = (
  members: (EventParticipant | null)[],
  id = 'g1',
): EventPartyGroup => ({
  id,
  members: [...members, ...Array(5 - members.length).fill(null)].slice(0, 5),
});

/* ------------------------------------------------------------------ */
/*  partyGroupContainsCharacterId                                      */
/* ------------------------------------------------------------------ */

describe('partyGroupContainsCharacterId', () => {
  const g = group([p('1'), p('2'), null, p('4'), null]);

  it('returns true for a member present in any slot', () => {
    expect(partyGroupContainsCharacterId(g, 1)).toBe(true);
    expect(partyGroupContainsCharacterId(g, 4)).toBe(true);
  });

  it('returns false for an absent id', () => {
    expect(partyGroupContainsCharacterId(g, 99)).toBe(false);
  });

  it('ignores null slots', () => {
    expect(partyGroupContainsCharacterId(g, 3)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  getGroupSize                                                       */
/* ------------------------------------------------------------------ */

describe('getGroupSize', () => {
  it('returns 0 for an empty group', () => {
    expect(getGroupSize(group([]))).toBe(0);
  });

  it('counts only filled slots', () => {
    expect(getGroupSize(group([p('1'), null, p('3')]))).toBe(2);
  });

  it('returns 5 for a full group', () => {
    expect(getGroupSize(group([p('1'), p('2'), p('3'), p('4'), p('5')]))).toBe(
      5,
    );
  });
});

/* ------------------------------------------------------------------ */
/*  isGroupEmpty                                                       */
/* ------------------------------------------------------------------ */

describe('isGroupEmpty', () => {
  it('is true when all slots are null', () => {
    expect(isGroupEmpty(group([]))).toBe(true);
  });

  it('is false when at least one slot is filled', () => {
    expect(isGroupEmpty(group([null, p('1')]))).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  groupHasBL / groupHasRez                                           */
/* ------------------------------------------------------------------ */

describe('groupHasBL', () => {
  it('returns false when no member has bloodlust', () => {
    expect(groupHasBL(group([p('1'), p('2')]))).toBe(false);
  });

  it('returns true when any member has bloodlust', () => {
    expect(groupHasBL(group([p('1'), p('2', { hasBloodlust: true })]))).toBe(
      true,
    );
  });

  it('returns false for an empty group', () => {
    expect(groupHasBL(group([]))).toBe(false);
  });
});

describe('groupHasRez', () => {
  it('returns false when no member has battle rez', () => {
    expect(groupHasRez(group([p('1'), p('2')]))).toBe(false);
  });

  it('returns true when any member has battle rez', () => {
    expect(groupHasRez(group([p('1', { hasBattleRez: true }), p('2')]))).toBe(
      true,
    );
  });
});

/* ------------------------------------------------------------------ */
/*  assignedParticipantIds                                             */
/* ------------------------------------------------------------------ */

describe('assignedParticipantIds', () => {
  it('collects ids across multiple groups, skipping nulls', () => {
    const groups = [
      group([p('10'), null, p('11')], 'a'),
      group([null, p('20'), null], 'b'),
    ];
    expect(assignedParticipantIds(groups)).toEqual(new Set(['10', '11', '20']));
  });

  it('returns empty set for empty groups', () => {
    expect(assignedParticipantIds([group([], 'a')])).toEqual(new Set());
  });
});

/* ------------------------------------------------------------------ */
/*  getPartyGroupAggregateStats                                        */
/* ------------------------------------------------------------------ */

describe('getPartyGroupAggregateStats', () => {
  it('returns null for an empty group', () => {
    expect(getPartyGroupAggregateStats(group([]))).toBeNull();
  });

  it('computes min/max/avg ilvl and key range', () => {
    const g = group([
      p('1', { ilvl: 600, keyMin: 2, keyMax: 8 }),
      p('2', { ilvl: 640, keyMin: 5, keyMax: 12 }),
    ]);
    expect(getPartyGroupAggregateStats(g)).toEqual({
      minIlvl: 600,
      maxIlvl: 640,
      avgIlvlRounded: 620,
      minKey: 2,
      maxKey: 12,
    });
  });

  it('handles a single member', () => {
    const g = group([p('1', { ilvl: 615, keyMin: 7, keyMax: 7 })]);
    const stats = getPartyGroupAggregateStats(g)!;
    expect(stats.avgIlvlRounded).toBe(615);
    expect(stats.minKey).toBe(7);
    expect(stats.maxKey).toBe(7);
  });
});

/* ------------------------------------------------------------------ */
/*  getPartyGroupCompositionStatus                                     */
/* ------------------------------------------------------------------ */

describe('getPartyGroupCompositionStatus', () => {
  it('reports all missing for an empty group', () => {
    const comp = getPartyGroupCompositionStatus(group([]));
    expect(comp.missingTank).toBe(true);
    expect(comp.missingHealer).toBe(true);
    expect(comp.missingDps).toBe(3);
    expect(comp.hasBloodlust).toBe(false);
    expect(comp.hasBattleRez).toBe(false);
    expect(comp.hasMissing).toBe(true);
  });

  it('reports nothing missing for a full valid comp', () => {
    const comp = getPartyGroupCompositionStatus(
      group([
        p('1', { role: 'tank' }),
        p('2', { role: 'healer', hasBloodlust: true }),
        p('3', { role: 'meleeDps', hasBattleRez: true }),
        p('4', { role: 'rangedDps' }),
        p('5', { role: 'meleeDps' }),
      ]),
    );
    expect(comp.missingTank).toBe(false);
    expect(comp.missingHealer).toBe(false);
    expect(comp.missingDps).toBe(0);
    expect(comp.hasBloodlust).toBe(true);
    expect(comp.hasBattleRez).toBe(true);
    expect(comp.hasMissing).toBe(false);
  });

  it('counts DPS correctly regardless of slot position', () => {
    const comp = getPartyGroupCompositionStatus(
      group([
        p('1', { role: 'meleeDps' }),
        p('2', { role: 'tank' }),
        p('3', { role: 'rangedDps' }),
      ]),
    );
    expect(comp.missingTank).toBe(false);
    expect(comp.missingHealer).toBe(true);
    expect(comp.missingDps).toBe(1); // 2 dps present, need 3
  });

  it('detects missing BL/BR independently from roles', () => {
    const comp = getPartyGroupCompositionStatus(
      group([
        p('1', { role: 'tank' }),
        p('2', { role: 'healer' }),
        p('3', { role: 'meleeDps' }),
        p('4', { role: 'rangedDps' }),
        p('5', { role: 'meleeDps' }),
      ]),
    );
    expect(comp.missingTank).toBe(false);
    expect(comp.missingHealer).toBe(false);
    expect(comp.missingDps).toBe(0);
    expect(comp.hasBloodlust).toBe(false);
    expect(comp.hasBattleRez).toBe(false);
    expect(comp.hasMissing).toBe(true); // missing BL + BR
  });
});

describe('adminGroupIlvlBadgeClass', () => {
  it('uses the high band at and above the high tier', () => {
    expect(adminGroupIlvlBadgeClass(ITEM_LEVEL_TIER_HIGH)).toContain('text-purple-300');
    expect(adminGroupIlvlBadgeClass(ITEM_LEVEL_TIER_HIGH + 10)).toContain('text-purple-300');
  });

  it('uses the mid band between mid and high tiers', () => {
    expect(adminGroupIlvlBadgeClass(ITEM_LEVEL_TIER_MID)).toContain('text-blue-300');
    expect(adminGroupIlvlBadgeClass(ITEM_LEVEL_TIER_HIGH - 1)).toContain('text-blue-300');
  });

  it('uses the low band between low and mid tiers', () => {
    expect(adminGroupIlvlBadgeClass(ITEM_LEVEL_TIER_LOW)).toContain('text-green-300');
    expect(adminGroupIlvlBadgeClass(ITEM_LEVEL_TIER_MID - 1)).toContain('text-green-300');
  });

  it('uses the muted band below the low tier', () => {
    expect(adminGroupIlvlBadgeClass(ITEM_LEVEL_TIER_LOW - 1)).toContain('text-muted-foreground');
  });
});
