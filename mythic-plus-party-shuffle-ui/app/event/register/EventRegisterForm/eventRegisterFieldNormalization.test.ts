import {
  normalizeIlvlOnBlur,
  normalizeKeystoneMinOnBlur,
  normalizeKeystoneMaxOnBlur,
} from './eventRegisterFieldNormalization';

describe('normalizeIlvlOnBlur', () => {
  it('uses min when empty', () => {
    expect(normalizeIlvlOnBlur('')).toBe('240');
  });

  it('clamps to item level range', () => {
    expect(normalizeIlvlOnBlur('200')).toBe('240');
    expect(normalizeIlvlOnBlur('300')).toBe('290');
    expect(normalizeIlvlOnBlur('265')).toBe('265');
  });

  it('falls back to min on invalid', () => {
    expect(normalizeIlvlOnBlur('abc')).toBe('240');
  });
});

describe('normalizeKeystoneMinOnBlur', () => {
  it('uses min when empty', () => {
    expect(normalizeKeystoneMinOnBlur('', '20')).toBe('2');
  });

  it('caps by max string', () => {
    expect(normalizeKeystoneMinOnBlur('25', '10')).toBe('10');
  });

  it('falls back to min on invalid', () => {
    expect(normalizeKeystoneMinOnBlur('x', '20')).toBe('2');
  });
});

describe('normalizeKeystoneMaxOnBlur', () => {
  it('uses max when empty', () => {
    expect(normalizeKeystoneMaxOnBlur('', '5')).toBe('30');
  });

  it('floors by min string', () => {
    expect(normalizeKeystoneMaxOnBlur('3', '10')).toBe('10');
  });

  it('falls back to max on invalid', () => {
    expect(normalizeKeystoneMaxOnBlur('x', '5')).toBe('30');
  });
});
