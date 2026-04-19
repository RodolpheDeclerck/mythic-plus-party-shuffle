import {
  toApiCharacterClass,
  toDisplayCharacterClass,
} from './characterClassApiMap';

describe('characterClassApiMap', () => {
  describe('toApiCharacterClass', () => {
    it('maps the spaced "Demon Hunter" UI label to the compact "DemonHunter" enum value', () => {
      expect(toApiCharacterClass('Demon Hunter')).toBe('DemonHunter');
    });

    it('maps the spaced "Death Knight" UI label to "Deathknight"', () => {
      expect(toApiCharacterClass('Death Knight')).toBe('Deathknight');
    });

    it('returns unmapped class names unchanged', () => {
      expect(toApiCharacterClass('Druid')).toBe('Druid');
      expect(toApiCharacterClass('Warrior')).toBe('Warrior');
    });
  });

  describe('toDisplayCharacterClass', () => {
    it('maps the compact "DemonHunter" enum value back to the spaced UI label', () => {
      expect(toDisplayCharacterClass('DemonHunter')).toBe('Demon Hunter');
    });

    it('maps "Deathknight" back to "Death Knight"', () => {
      expect(toDisplayCharacterClass('Deathknight')).toBe('Death Knight');
    });

    it('returns unmapped class names unchanged', () => {
      expect(toDisplayCharacterClass('Druid')).toBe('Druid');
      expect(toDisplayCharacterClass('Warrior')).toBe('Warrior');
    });
  });

  describe('round-trip', () => {
    it('round-trips display → api → display for Demon Hunter', () => {
      expect(toDisplayCharacterClass(toApiCharacterClass('Demon Hunter'))).toBe(
        'Demon Hunter',
      );
    });

    it('round-trips display → api → display for Death Knight', () => {
      expect(toDisplayCharacterClass(toApiCharacterClass('Death Knight'))).toBe(
        'Death Knight',
      );
    });
  });
});
