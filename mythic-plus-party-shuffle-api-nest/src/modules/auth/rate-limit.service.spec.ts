import { RateLimitService } from './rate-limit.service';

function createMockRedis(sequences: { count: number; ttl: number }[]) {
  let incrCalls = 0;
  return {
    incr: jest.fn(async () => {
      const seq = sequences[Math.min(incrCalls, sequences.length - 1)];
      incrCalls += 1;
      return seq.count;
    }),
    expire: jest.fn(async () => 1),
    ttl: jest.fn(async () => sequences[sequences.length - 1]?.ttl ?? 900),
  };
}

describe('RateLimitService', () => {
  it('allows when count stays within limit', async () => {
    const redis = createMockRedis([{ count: 1, ttl: 900 }]);
    const service = new RateLimitService(redis as any);
    const r = await service.consume('rl:test:key', 10, 900);
    expect(r.allowed).toBe(true);
    expect(r.retryAfterSec).toBe(0);
    expect(redis.expire).toHaveBeenCalledWith('rl:test:key', 900);
  });

  it('denies when count exceeds limit and returns ttl for Retry-After', async () => {
    const redis = {
      incr: jest.fn(async () => 11),
      expire: jest.fn(),
      ttl: jest.fn(async () => 120),
    };
    const service = new RateLimitService(redis as any);
    const r = await service.consume('rl:test:key', 10, 900);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBe(120);
  });

  it('uses windowSec when ttl is negative', async () => {
    const redis = {
      incr: jest.fn(async () => 11),
      expire: jest.fn(),
      ttl: jest.fn(async () => -1),
    };
    const service = new RateLimitService(redis as any);
    const r = await service.consume('rl:test:key', 10, 900);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBe(900);
  });
});
