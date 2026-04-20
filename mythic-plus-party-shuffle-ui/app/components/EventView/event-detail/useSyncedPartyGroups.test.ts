/**
 * Tests for useSyncedPartyGroups — the hook that keeps the generated
 * groups in sync with backend parties and edited characters.
 *
 * Key business rules tested:
 * 1. Groups are derived from parties (source of truth for structure).
 * 2. Character edits update display data (name, spec, ilvl…) in groups.
 * 3. Role is ALWAYS preserved in groups (set at shuffle time).
 * 4. Admin can explicitly push role changes via updateParticipantInGroups.
 */
import { renderHook, act } from '@testing-library/react';
import type { Character } from '@/types/Character';
import type { Party } from '@/types/Party';
import type { EventParticipant } from '@/components/EventView/eventPartyModel';
import { useSyncedPartyGroups } from './useSyncedPartyGroups';

/* ------------------------------------------------------------------ */
/*  Factories                                                          */
/* ------------------------------------------------------------------ */

const mkChar = (
  id: number,
  role: Character['role'] = 'CAC',
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
/*  Helper to render the hook with controllable props                   */
/* ------------------------------------------------------------------ */

function setup({
  parties = [] as Party[],
  characters = [] as Character[],
  isAdmin = false,
}: {
  parties?: Party[];
  characters?: Character[];
  isAdmin?: boolean;
} = {}) {
  const onPartiesUpdate = jest.fn();

  const { result, rerender } = renderHook(
    (props: { parties: Party[]; characters: Character[]; isAdmin: boolean }) =>
      useSyncedPartyGroups({
        parties: props.parties,
        characters: props.characters,
        isAdmin: props.isAdmin,
        specLabel,
        onPartiesUpdate,
      }),
    { initialProps: { parties, characters, isAdmin } },
  );

  return { result, rerender, onPartiesUpdate };
}

/* ------------------------------------------------------------------ */
/*  Initial derivation from parties                                    */
/* ------------------------------------------------------------------ */

describe('initial derivation from parties', () => {
  it('creates groups from parties with correct member data', () => {
    const chars = [mkChar(1, 'TANK'), mkChar(2, 'HEAL'), mkChar(3, 'CAC')];
    const parties: Party[] = [{ members: chars }];

    const { result } = setup({ parties, characters: chars });

    expect(result.current.shuffledGroups).toHaveLength(1);
    const members = result.current.shuffledGroups[0].members;
    expect(members[0]?.id).toBe('1');
    expect(members[1]?.id).toBe('2');
    expect(members[2]?.id).toBe('3');
  });

  it('pads groups to 5 slots', () => {
    const chars = [mkChar(1, 'TANK')];
    const parties: Party[] = [{ members: chars }];

    const { result } = setup({ parties, characters: chars });

    expect(result.current.shuffledGroups[0].members).toHaveLength(5);
  });
});

/* ------------------------------------------------------------------ */
/*  Character edit sync — role preservation                            */
/* ------------------------------------------------------------------ */

describe('character edit sync', () => {
  it('updates display data (name, ilvl) when characters change', () => {
    const chars = [mkChar(1, 'TANK', { name: 'OldName', iLevel: 600 })];
    const parties: Party[] = [{ members: chars }];

    const { result, rerender } = setup({ parties, characters: chars });
    expect(result.current.shuffledGroups[0].members[0]?.name).toBe('OldName');

    // Simulate character edit
    const updatedChars = [mkChar(1, 'TANK', { name: 'NewName', iLevel: 640 })];
    rerender({ parties, characters: updatedChars, isAdmin: false });

    const member = result.current.shuffledGroups[0].members[0]!;
    expect(member.name).toBe('NewName');
    expect(member.ilvl).toBe(640);
  });

  it('preserves group role when a non-admin user changes their role', () => {
    const chars = [mkChar(1, 'TANK')];
    const parties: Party[] = [{ members: chars }];

    const { result, rerender } = setup({
      parties,
      characters: chars,
      isAdmin: false,
    });

    expect(result.current.shuffledGroups[0].members[0]?.role).toBe('tank');

    // User changes role from TANK to CAC
    const updatedChars = [mkChar(1, 'CAC')];
    rerender({ parties, characters: updatedChars, isAdmin: false });

    // Group still shows tank role (assigned at shuffle time)
    expect(result.current.shuffledGroups[0].members[0]?.role).toBe('tank');
  });

  it('preserves group role even when viewed by admin', () => {
    const chars = [mkChar(1, 'TANK')];
    const parties: Party[] = [{ members: chars }];

    const { result, rerender } = setup({
      parties,
      characters: chars,
      isAdmin: true,
    });

    // User (not admin) changed their role — parties re-fetched with old data
    const updatedChars = [mkChar(1, 'CAC')];
    rerender({ parties, characters: updatedChars, isAdmin: true });

    // Role still preserved from initial shuffle
    expect(result.current.shuffledGroups[0].members[0]?.role).toBe('tank');
  });
});

/* ------------------------------------------------------------------ */
/*  Parties refresh — role preservation                                */
/* ------------------------------------------------------------------ */

describe('parties refresh with stale data', () => {
  it('preserves roles when parties re-fetch with same structure', () => {
    const chars = [mkChar(1, 'TANK')];
    const parties: Party[] = [{ members: chars }];

    const { result, rerender } = setup({ parties, characters: chars });
    expect(result.current.shuffledGroups[0].members[0]?.role).toBe('tank');

    // Backend re-fetches parties (same structure, possibly stale char data)
    const staleParties: Party[] = [{ members: [mkChar(1, 'CAC')] }];
    rerender({
      parties: staleParties,
      characters: chars,
      isAdmin: false,
    });

    // Role preserved from previous state
    expect(result.current.shuffledGroups[0].members[0]?.role).toBe('tank');
  });

  it('accepts new roles when group structure changes (new shuffle)', () => {
    const chars = [mkChar(1, 'TANK'), mkChar(2, 'HEAL')];
    const parties1: Party[] = [{ members: chars }];

    const { result, rerender } = setup({
      parties: parties1,
      characters: chars,
    });
    expect(result.current.shuffledGroups[0].members[0]?.id).toBe('1');

    // New shuffle — completely different group with new id
    const parties2: Party[] = [
      { members: [mkChar(2, 'HEAL'), mkChar(1, 'TANK')] },
    ];
    rerender({ parties: parties2, characters: chars, isAdmin: false });

    // New group (different id = group-0 but different member order)
    // Member at slot 0 is now char 2, role should come from fresh data
    const g = result.current.shuffledGroups[0];
    expect(g.members[0]?.id).toBe('2');
  });
});

/* ------------------------------------------------------------------ */
/*  updateParticipantInGroups (admin explicit update)                   */
/* ------------------------------------------------------------------ */

describe('updateParticipantInGroups', () => {
  it('updates a participant in all groups including role', () => {
    const chars = [mkChar(1, 'TANK'), mkChar(2, 'HEAL')];
    const parties: Party[] = [
      { members: [mkChar(1, 'TANK')] },
      { members: [mkChar(1, 'TANK'), mkChar(2, 'HEAL')] },
    ];

    const { result, onPartiesUpdate } = setup({
      parties,
      characters: chars,
      isAdmin: true,
    });

    const updated: EventParticipant = {
      id: '1',
      name: 'NewTank',
      class: 'Warrior',
      spec: 'Protection',
      role: 'healer', // admin changed role
      ilvl: 650,
      hasBloodlust: true,
      hasBattleRez: false,
      keyMin: 5,
      keyMax: 15,
    };

    act(() => {
      result.current.updateParticipantInGroups(updated);
    });

    // Updated in both groups
    expect(result.current.shuffledGroups[0].members[0]?.role).toBe('healer');
    expect(result.current.shuffledGroups[0].members[0]?.name).toBe('NewTank');
    expect(result.current.shuffledGroups[1].members[0]?.role).toBe('healer');

    // Persisted to backend
    expect(onPartiesUpdate).toHaveBeenCalled();
  });

  it('does not affect members with different ids', () => {
    const chars = [mkChar(1, 'TANK'), mkChar(2, 'HEAL')];
    const parties: Party[] = [{ members: chars }];

    const { result } = setup({ parties, characters: chars, isAdmin: true });

    const updated: EventParticipant = {
      id: '1',
      name: 'Changed',
      class: 'Warrior',
      spec: 'Arms',
      role: 'meleeDps',
      ilvl: 650,
      hasBloodlust: false,
      hasBattleRez: false,
      keyMin: 2,
      keyMax: 10,
    };

    act(() => {
      result.current.updateParticipantInGroups(updated);
    });

    // Member 2 unchanged
    expect(result.current.shuffledGroups[0].members[1]?.id).toBe('2');
    expect(result.current.shuffledGroups[0].members[1]?.role).toBe('healer');
  });
});
