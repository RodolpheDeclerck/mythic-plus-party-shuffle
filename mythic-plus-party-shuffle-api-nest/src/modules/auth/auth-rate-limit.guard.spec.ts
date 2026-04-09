import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AUTH_RATE_LIMIT_KIND_KEY } from './auth-rate-limit.decorator';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { RateLimitService, RateLimitConsumeResult } from './rate-limit.service';

type ConsumeOverride = Partial<Record<string, RateLimitConsumeResult>>;

describe('AuthRateLimitGuard', () => {
  function createGuard(opts: {
    defaults?: RateLimitConsumeResult;
    perKey?: ConsumeOverride;
    perEmailConfig?: { limit: number; windowSec: number } | null;
  }) {
    const defaults = opts.defaults ?? { allowed: true, retryAfterSec: 0 };
    const consume = jest.fn(async (key: string) => {
      return opts.perKey?.[key] ?? defaults;
    });
    const rateLimitService = { consume } as unknown as RateLimitService;
    const configService = {
      get: (key: string) => {
        if (key === 'rateLimit.login.limit') return 10;
        if (key === 'rateLimit.login.windowSec') return 900;
        if (key === 'rateLimit.login.perEmail') {
          return opts.perEmailConfig === null
            ? undefined
            : opts.perEmailConfig ?? { limit: 5, windowSec: 900 };
        }
        return undefined;
      },
    } as unknown as ConfigService;
    return {
      guard: new AuthRateLimitGuard(rateLimitService, new Reflector(), configService),
      consume,
    };
  }

  function loginContext(body: Record<string, unknown> = {}, ip = '1.2.3.4') {
    const handler = function login() {};
    Reflect.defineMetadata(AUTH_RATE_LIMIT_KIND_KEY, 'login', handler);
    const setHeader = jest.fn();
    return {
      handler,
      setHeader,
      ctx: {
        getHandler: () => handler,
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ headers: {}, ip, socket: {}, body }),
          getResponse: () => ({ setHeader }),
        }),
      } as unknown as Parameters<AuthRateLimitGuard['canActivate']>[0],
    };
  }

  function emailKey(email: string): string {
    const hash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    return `rl:auth:login:email:${hash}`;
  }

  it('allows when both buckets allow and uses ip-prefixed key', async () => {
    const { guard, consume } = createGuard({});
    const { ctx, setHeader } = loginContext({ email: 'foo@bar.com' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(setHeader).not.toHaveBeenCalled();
    expect(consume).toHaveBeenCalledWith('rl:auth:login:ip:1.2.3.4', 10, 900);
    expect(consume).toHaveBeenCalledWith(emailKey('foo@bar.com'), 5, 900);
  });

  it('skips per-email bucket when no email in body', async () => {
    const { guard, consume } = createGuard({});
    const { ctx } = loginContext({});
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(consume).toHaveBeenCalledTimes(1);
    expect(consume).toHaveBeenCalledWith('rl:auth:login:ip:1.2.3.4', 10, 900);
  });

  it('throws 429 when IP bucket is over limit', async () => {
    const { guard } = createGuard({
      perKey: {
        'rl:auth:login:ip:1.2.3.4': { allowed: false, retryAfterSec: 30 },
      },
    });
    const { ctx, setHeader } = loginContext({ email: 'foo@bar.com' });
    let thrown: unknown;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '30');
  });

  it('throws 429 when per-email bucket is over limit even if IP is fine', async () => {
    const { guard } = createGuard({
      perKey: {
        [emailKey('foo@bar.com')]: { allowed: false, retryAfterSec: 42 },
      },
    });
    const { ctx, setHeader } = loginContext({ email: 'foo@bar.com' });
    let thrown: unknown;
    try {
      await guard.canActivate(ctx);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '42');
  });

  it('Retry-After is the max ttl when both buckets are over limit', async () => {
    const { guard } = createGuard({
      perKey: {
        'rl:auth:login:ip:1.2.3.4': { allowed: false, retryAfterSec: 11 },
        [emailKey('foo@bar.com')]: { allowed: false, retryAfterSec: 99 },
      },
    });
    const { ctx, setHeader } = loginContext({ email: 'foo@bar.com' });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(HttpException);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '99');
  });

  it('hashes the email case-insensitively and trimmed', async () => {
    const { guard, consume } = createGuard({});
    const { ctx } = loginContext({ email: '  Foo@Bar.com  ' });
    await guard.canActivate(ctx);
    expect(consume).toHaveBeenCalledWith(emailKey('foo@bar.com'), 5, 900);
  });
});
