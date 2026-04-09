import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { isCommonPassword } from './common-passwords.data';

const MIN_LENGTH = 10;
const MIN_CHARACTER_CLASSES = 3;

/** Generic error thrown to users — avoids leaking which specific rule failed. */
const POLICY_ERROR_MESSAGE = 'Password does not meet security requirements';

/**
 * Enforces password requirements on user-supplied plaintext passwords at
 * registration and password change time. Login only uses `validateSync`
 * (no HIBP network call on every sign-in).
 */
@Injectable()
export class PasswordPolicyService {
  private readonly logger = new Logger(PasswordPolicyService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Full validation including an optional HIBP k-anonymity lookup. Use at
   * registration and password change. Fail-open on HIBP network errors: we
   * prefer not to block legitimate users if the pwnedpasswords API is down.
   */
  async validate(password: string): Promise<void> {
    this.validateSync(password);

    const hibpEnabled = this.configService.get<boolean>('passwordPolicy.hibpCheck');
    if (!hibpEnabled) {
      return;
    }

    const pwned = await this.checkPwned(password);
    if (pwned) {
      throw new BadRequestException(POLICY_ERROR_MESSAGE);
    }
  }

  /**
   * Synchronous validation: length, character classes, local blocklist.
   * Used at login to reject pre-existing weak passwords without any network
   * dependency.
   */
  validateSync(password: string): void {
    if (typeof password !== 'string' || password.length < MIN_LENGTH) {
      throw new BadRequestException(POLICY_ERROR_MESSAGE);
    }

    const classes = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^a-zA-Z0-9]/.test(password),
    ].filter(Boolean).length;

    if (classes < MIN_CHARACTER_CLASSES) {
      throw new BadRequestException(POLICY_ERROR_MESSAGE);
    }

    if (isCommonPassword(password)) {
      throw new BadRequestException(POLICY_ERROR_MESSAGE);
    }
  }

  /**
   * HIBP k-anonymity lookup. Sends only the first 5 characters of the
   * SHA-1 of the password; receives a list of suffixes and checks locally.
   * Returns true if the password is known to be pwned; fail-open on error.
   */
  private async checkPwned(password: string): Promise<boolean> {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const timeoutMs = this.configService.get<number>('passwordPolicy.hibpTimeoutMs') ?? 2000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'mythic-plus-party-shuffle',
          'Add-Padding': 'true',
        },
      });

      if (!response.ok) {
        this.logger.warn(`HIBP check failed: HTTP ${response.status}`);
        return false;
      }

      const body = await response.text();
      for (const line of body.split('\n')) {
        const [hashSuffix, countStr] = line.trim().split(':');
        if (!hashSuffix || hashSuffix.length !== 35) continue;
        if (hashSuffix === suffix) {
          const count = parseInt(countStr || '0', 10);
          // Padding rows return count 0 — ignore them.
          return count > 0;
        }
      }
      return false;
    } catch (err) {
      const reason = err instanceof Error ? err.name : 'unknown';
      this.logger.warn(`HIBP check skipped (fail-open): ${reason}`);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
