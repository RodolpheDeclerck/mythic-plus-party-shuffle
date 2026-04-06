import { isLegacyPasswordHash, verifyLegacyPassword, legacyDeriveHex } from './legacy-password';

describe('legacy-password', () => {
  it('isLegacyPasswordHash matches 64 hex chars', () => {
    expect(isLegacyPasswordHash('a'.repeat(64))).toBe(true);
    expect(isLegacyPasswordHash('A'.repeat(64))).toBe(true);
    expect(isLegacyPasswordHash('g'.repeat(64))).toBe(false);
    expect(isLegacyPasswordHash('$argon2$v=19')).toBe(false);
    expect(isLegacyPasswordHash('short')).toBe(false);
  });

  it('verifyLegacyPassword accepts correct password', () => {
    const salt = 'testsalt';
    const plain = 'secret';
    const hex = legacyDeriveHex(salt, plain);
    expect(verifyLegacyPassword(salt, hex, plain)).toBe(true);
    expect(verifyLegacyPassword(salt, hex, 'wrong')).toBe(false);
  });
});
