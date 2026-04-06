import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

export type RateLimitConsumeResult = {
  allowed: boolean;
  /** Seconds until the window resets; meaningful when allowed is false */
  retryAfterSec: number;
};

@Injectable()
export class RateLimitService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Fixed window: INCR key, EXPIRE on first hit. If count > limit, not allowed.
   */
  async consume(redisKey: string, limit: number, windowSec: number): Promise<RateLimitConsumeResult> {
    const count = await this.redis.incr(redisKey);
    if (count === 1) {
      await this.redis.expire(redisKey, windowSec);
    }

    if (count <= limit) {
      return { allowed: true, retryAfterSec: 0 };
    }

    let ttl = await this.redis.ttl(redisKey);
    if (ttl < 0) {
      ttl = windowSec;
    }
    return { allowed: false, retryAfterSec: ttl };
  }
}
