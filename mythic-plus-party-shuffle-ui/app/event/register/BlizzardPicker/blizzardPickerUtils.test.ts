import { classColor, deriveBuffs, deriveRole } from './blizzardPickerUtils';

describe('blizzardPickerUtils', () => {
  describe('classColor', () => {
    it('returns the class hex color for an enum class value', () => {
      expect(classColor('Mage')).toBe('#3FC7EB');
      expect(classColor('Deathknight')).toBe('#C41E3A');
    });

    it('falls back to white for an unknown class', () => {
      expect(classColor('Nope')).toBe('#FFFFFF');
    });
  });

  describe('deriveBuffs', () => {
    it('flags bloodlust for Shaman and battle rez for Death Knight', () => {
      expect(deriveBuffs('Shaman')).toEqual({ hasBloodlust: true, hasBattleRez: false });
      // enum form `Deathknight` must map to display "Death Knight" for BR
      expect(deriveBuffs('Deathknight')).toEqual({ hasBloodlust: false, hasBattleRez: true });
    });

    it('flags neither for a Warrior', () => {
      expect(deriveBuffs('Warrior')).toEqual({ hasBloodlust: false, hasBattleRez: false });
    });
  });

  describe('deriveRole', () => {
    it('maps Enhancement Shaman to melee dps', () => {
      expect(
        deriveRole({ characterClass: 'Shaman', specialization: 'Shaman_Enhancement' }),
      ).toBe('meleeDps');
    });

    it('maps Restoration Druid to healer', () => {
      expect(
        deriveRole({ characterClass: 'Druid', specialization: 'Druid_Restoration' }),
      ).toBe('healer');
    });

    it('maps Blood Death Knight to tank', () => {
      expect(
        deriveRole({ characterClass: 'Deathknight', specialization: 'DeathKnight_Blood' }),
      ).toBe('tank');
    });
  });
});
