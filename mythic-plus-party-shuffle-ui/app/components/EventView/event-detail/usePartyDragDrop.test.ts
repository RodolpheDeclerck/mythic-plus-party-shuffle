/**
 * Tests for the party drag-and-drop logic.
 *
 * We test via renderHook so we exercise the real React state transitions
 * (same-group swap, cross-group swap, unassigned→group, group→unassigned)
 * without mounting any DOM.
 */
import { renderHook, act } from '@testing-library/react';
import type {
  EventParticipant,
  EventPartyGroup,
} from '@/components/EventView/eventPartyModel';
import { usePartyDragDrop } from './usePartyDragDrop';

/* ------------------------------------------------------------------ */
/*  Factories                                                          */
/* ------------------------------------------------------------------ */

const p = (
  id: string,
  role: EventParticipant['role'] = 'meleeDps',
): EventParticipant => ({
  id,
  name: `P${id}`,
  class: 'Warrior',
  spec: 'Arms',
  role,
  ilvl: 620,
  hasBloodlust: false,
  hasBattleRez: false,
  keyMin: 2,
  keyMax: 10,
});

const emptyGroup = (id: string): EventPartyGroup => ({
  id,
  members: [null, null, null, null, null],
});

const fakeEvent = (overrides: Partial<React.DragEvent> = {}) =>
  ({
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    dataTransfer: { effectAllowed: '', dropEffect: '', setData: jest.fn() },
    ...overrides,
  }) as unknown as React.DragEvent;

/* ------------------------------------------------------------------ */
/*  Helper: set up hook with initial groups                            */
/* ------------------------------------------------------------------ */

function setup(initialGroups: EventPartyGroup[], allParticipants: EventParticipant[] = []) {
  let groups = initialGroups;

  const { result } = renderHook(() =>
    usePartyDragDrop((updater) => {
      groups =
        typeof updater === 'function'
          ? (updater as (prev: EventPartyGroup[]) => EventPartyGroup[])(groups)
          : updater;
    }, allParticipants),
  );

  return { result, getGroups: () => groups };
}

/* ------------------------------------------------------------------ */
/*  Same-group swap                                                    */
/* ------------------------------------------------------------------ */

describe('same-group swap', () => {
  it('swaps two members within the same group', () => {
    const tank = p('1', 'tank');
    const healer = p('2', 'healer');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [tank, healer, null, null, null],
    };
    const { result, getGroups } = setup([g]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), tank, 'g1', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g1', 1, healer.id);
    });

    const members = getGroups()[0].members;
    expect(members[0]?.id).toBe('2'); // healer moved to slot 0
    expect(members[1]?.id).toBe('1'); // tank moved to slot 1
  });

  it('moves a member to an empty slot in the same group', () => {
    const tank = p('1', 'tank');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [tank, null, null, null, null],
    };
    const { result, getGroups } = setup([g]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), tank, 'g1', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g1', 3);
    });

    const members = getGroups()[0].members;
    expect(members[0]).toBeNull();       // old slot cleared
    expect(members[3]?.id).toBe('1');    // tank in new slot
  });
});

/* ------------------------------------------------------------------ */
/*  Cross-group swap                                                   */
/* ------------------------------------------------------------------ */

describe('cross-group swap', () => {
  it('swaps members between two groups', () => {
    const dps1 = p('1', 'meleeDps');
    const dps2 = p('2', 'rangedDps');
    const g1: EventPartyGroup = {
      id: 'g1',
      members: [dps1, null, null, null, null],
    };
    const g2: EventPartyGroup = {
      id: 'g2',
      members: [dps2, null, null, null, null],
    };
    const { result, getGroups } = setup([g1, g2]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), dps1, 'g1', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g2', 0, dps2.id);
    });

    expect(getGroups()[0].members[0]?.id).toBe('2'); // dps2 now in g1
    expect(getGroups()[1].members[0]?.id).toBe('1'); // dps1 now in g2
  });

  it('moves a member to an empty slot in another group', () => {
    const tank = p('1', 'tank');
    const g1: EventPartyGroup = {
      id: 'g1',
      members: [tank, null, null, null, null],
    };
    const g2 = emptyGroup('g2');
    const { result, getGroups } = setup([g1, g2]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), tank, 'g1', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g2', 2);
    });

    expect(getGroups()[0].members[0]).toBeNull();
    expect(getGroups()[1].members[2]?.id).toBe('1');
  });
});

/* ------------------------------------------------------------------ */
/*  Unassigned → group                                                 */
/* ------------------------------------------------------------------ */

describe('unassigned → group', () => {
  it('places an unassigned participant into an empty slot', () => {
    const unassigned = p('99', 'healer');
    const g = emptyGroup('g1');
    const { result, getGroups } = setup([g], [unassigned]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), unassigned, 'unassigned', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g1', 2);
    });

    expect(getGroups()[0].members[2]?.id).toBe('99');
  });

  it('replaces an existing member when targetParticipantId matches', () => {
    const existing = p('1', 'tank');
    const unassigned = p('99', 'tank');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [existing, null, null, null, null],
    };
    const { result, getGroups } = setup([g], [unassigned]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), unassigned, 'unassigned', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g1', 0, existing.id);
    });

    expect(getGroups()[0].members[0]?.id).toBe('99');
  });

  it('rejects drop on occupied slot without matching targetParticipantId', () => {
    const existing = p('1', 'tank');
    const unassigned = p('99', 'tank');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [existing, null, null, null, null],
    };
    const { result, getGroups } = setup([g], [unassigned]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), unassigned, 'unassigned', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g1', 0); // no targetPid
    });

    expect(getGroups()[0].members[0]?.id).toBe('1'); // unchanged
  });
});

/* ------------------------------------------------------------------ */
/*  Group → unassigned                                                 */
/* ------------------------------------------------------------------ */

describe('group → unassigned', () => {
  it('removes a member from a group (slot becomes null)', () => {
    const tank = p('1', 'tank');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [tank, null, null, null, null],
    };
    const { result, getGroups } = setup([g]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), tank, 'g1', 0);
    });
    act(() => {
      result.current.handleDropToUnassigned(fakeEvent());
    });

    expect(getGroups()[0].members[0]).toBeNull();
  });

  it('replaces with an unassigned participant when targetId is provided', () => {
    const tank = p('1', 'tank');
    const replacement = p('99', 'tank');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [tank, null, null, null, null],
    };
    const { result, getGroups } = setup([g], [replacement]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), tank, 'g1', 0);
    });
    act(() => {
      result.current.handleDropToUnassigned(fakeEvent(), replacement.id);
    });

    expect(getGroups()[0].members[0]?.id).toBe('99');
  });
});

/* ------------------------------------------------------------------ */
/*  Bounds / safety                                                    */
/* ------------------------------------------------------------------ */

describe('bounds and safety checks', () => {
  it('rejects drop on out-of-bounds slot index', () => {
    const tank = p('1', 'tank');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [tank, null, null, null, null],
    };
    const { result, getGroups } = setup([g]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), tank, 'g1', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g1', 10);
    });

    expect(getGroups()[0].members[0]?.id).toBe('1'); // unchanged
  });

  it('rejects drop on non-existent group', () => {
    const tank = p('1', 'tank');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [tank, null, null, null, null],
    };
    const { result, getGroups } = setup([g]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), tank, 'g1', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'nonexistent', 0);
    });

    expect(getGroups()[0].members[0]?.id).toBe('1'); // unchanged
  });

  it('no-op when dropping on the same slot', () => {
    const tank = p('1', 'tank');
    const g: EventPartyGroup = {
      id: 'g1',
      members: [tank, null, null, null, null],
    };
    const { result, getGroups } = setup([g]);

    act(() => {
      result.current.handleDragStart(fakeEvent(), tank, 'g1', 0);
    });
    act(() => {
      result.current.handleDrop(fakeEvent(), 'g1', 0);
    });

    expect(getGroups()[0].members[0]?.id).toBe('1');
  });
});

/* ------------------------------------------------------------------ */
/*  Group management                                                   */
/* ------------------------------------------------------------------ */

describe('group management', () => {
  it('adds a new empty group', () => {
    const { result, getGroups } = setup([]);

    act(() => {
      result.current.handleAddGroup();
    });

    const groups = getGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].members).toEqual([null, null, null, null, null]);
  });

  it('deletes a group by id', () => {
    const g1 = emptyGroup('g1');
    const g2 = emptyGroup('g2');
    const { result, getGroups } = setup([g1, g2]);

    act(() => {
      result.current.handleDeleteGroup('g1');
    });

    expect(getGroups()).toHaveLength(1);
    expect(getGroups()[0].id).toBe('g2');
  });
});
