import {
  normalizeIlvlOnBlur,
  normalizeKeystoneMinOnBlur,
  normalizeKeystoneMaxOnBlur,
} from './eventRegisterFieldNormalization';
import { ITEM_LEVEL_MIN, ITEM_LEVEL_MAX } from '@/constants/itemLevels';

const MIN = ITEM_LEVEL_MIN.toString();
const MAX = ITEM_LEVEL_MAX.toString();
const IN_RANGE = Math.round((ITEM_LEVEL_MIN + ITEM_LEVEL_MAX) / 2);

describe('normalizeIlvlOnBlur', () => {
  it('uses min when empty', () => {
    expect(normalizeIlvlOnBlur('')).toBe(MIN);
  });

  it('clamps to item level range', () => {
    expect(normalizeIlvlOnBlur(String(ITEM_LEVEL_MIN - 50))).toBe(MIN);
    expect(normalizeIlvlOnBlur(String(ITEM_LEVEL_MAX + 50))).toBe(MAX);
    expect(normalizeIlvlOnBlur(String(IN_RANGE))).toBe(String(IN_RANGE));
  });

  it('falls back to min on invalid', () => {
    expect(normalizeIlvlOnBlur('abc')).toBe(MIN);
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
