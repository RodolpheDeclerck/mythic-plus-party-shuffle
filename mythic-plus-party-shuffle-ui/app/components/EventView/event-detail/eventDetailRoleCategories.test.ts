import { buildEventDetailRoleCategories } from './eventDetailRoleCategories';
import type { EventParticipant } from '@/components/EventView/eventPartyModel';

const tEv = (key: string) => key;

const p = (id: string, role: EventParticipant['role']): EventParticipant => ({
  id,
  name: id,
  class: 'Warrior',
  spec: 'Arms',
  role,
  ilvl: 100,
  hasBloodlust: false,
  hasBattleRez: false,
  keyMin: 2,
  keyMax: 5,
});

describe('buildEventDetailRoleCategories', () => {
  it('splits participants by role in fixed order', () => {
    const participants = [
      p('1', 'tank'),
      p('2', 'healer'),
      p('3', 'meleeDps'),
      p('4', 'rangedDps'),
    ];
    const rows = buildEventDetailRoleCategories(tEv, participants);
    expect(rows).toHaveLength(4);
    expect(rows[0].key).toBe('tank');
    expect(rows[0].participants.map((x) => x.id)).toEqual(['1']);
    expect(rows[1].participants.map((x) => x.id)).toEqual(['2']);
    expect(rows[2].participants.map((x) => x.id)).toEqual(['3']);
    expect(rows[3].participants.map((x) => x.id)).toEqual(['4']);
  });
});
