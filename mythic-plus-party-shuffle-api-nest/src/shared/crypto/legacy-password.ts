import * as crypto from 'crypto';

/** Same value as historical app code; only for verifying existing DB rows. */
const LEGACY_HMAC_SECRET = 'GMC-REST-API';

/** 64-char hex = legacy HMAC-SHA256 output before Argon2 migration. */
export function isLegacyPasswordHash(stored: string): boolean {
  return /^[0-9a-f]{64}$/i.test(stored);
}

export function legacyDeriveHex(salt: string, plain: string): string {
  return crypto
    .createHmac('sha256', [salt, plain].join('/'))
    .update(LEGACY_HMAC_SECRET)
    .digest('hex');
}

export function verifyLegacyPassword(salt: string, storedHex: string, plain: string): boolean {
  if (!isLegacyPasswordHash(storedHex)) return false;
  const expected = legacyDeriveHex(salt, plain);
  return timingSafeEqualHex(storedHex, expected);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(a) || !/^[0-9a-f]{64}$/i.test(b)) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
