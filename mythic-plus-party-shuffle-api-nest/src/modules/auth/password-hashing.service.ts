import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { isLegacyPasswordHash, verifyLegacyPassword } from '../../shared/crypto/legacy-password';

/** Salt column unused for Argon2 (salt is embedded in the hash string). */
const ARGON2_SALT_PLACEHOLDER = '';

@Injectable()
export class PasswordHashingService {
  private readonly argonOptions = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 3,
    parallelism: 4,
  } as const;

  async hashPassword(plain: string): Promise<{ password: string; salt: string }> {
    const password = await argon2.hash(plain, this.argonOptions);
    return { password, salt: ARGON2_SALT_PLACEHOLDER };
  }

  /**
   * Verifies password. For legacy HMAC hashes, returns upgrade payload to persist after successful login.
   */
  async verify(
    storedPassword: string,
    storedSalt: string,
    plain: string,
  ): Promise<{ valid: boolean; upgrade?: { password: string; salt: string } }> {
    if (storedPassword.startsWith('$argon2')) {
      try {
        const valid = await argon2.verify(storedPassword, plain);
        return { valid };
      } catch {
        return { valid: false };
      }
    }

    if (isLegacyPasswordHash(storedPassword)) {
      const valid = verifyLegacyPassword(storedSalt, storedPassword, plain);
      if (!valid) return { valid: false };
      const password = await argon2.hash(plain, this.argonOptions);
      return { valid: true, upgrade: { password, salt: ARGON2_SALT_PLACEHOLDER } };
    }

    return { valid: false };
  }
}
