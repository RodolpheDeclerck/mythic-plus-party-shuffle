import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AUTH_RATE_LIMIT_KIND_KEY } from './auth-rate-limit.decorator';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

describe('AuthRateLimitGuard', () => {
  function createGuard(consumeResult: { allowed: boolean; retryAfterSec: number }) {
    const consume = jest.fn().mockResolvedValue(consumeResult);
    const rateLimitService = { consume } as unknown as RateLimitService;
    const configService = {
      get: (key: string) => {
        if (key === 'rateLimit.login.limit') return 10;
        if (key === 'rateLimit.login.windowSec') return 900;
        return undefined;
      },
    } as unknown as ConfigService;
    return {
      guard: new AuthRateLimitGuard(rateLimitService, new Reflector(), configService),
      consume,
    };
  }

  it('allows when rate limit service allows', async () => {
    const { guard } = createGuard({ allowed: true, retryAfterSec: 0 });
    const handler = function login() {};
    Reflect.defineMetadata(AUTH_RATE_LIMIT_KIND_KEY, 'login', handler);
    const setHeader = jest.fn();
    const ctx = {
      getHandler: () => handler,
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {}, ip: '1.2.3.4', socket: {} }),
        getResponse: () => ({ setHeader }),
      }),
    };
    await expect(guard.canActivate(ctx as any)).resolves.toBe(true);
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('throws 429 and sets Retry-After when over limit', async () => {
    const { guard, consume } = createGuard({ allowed: false, retryAfterSec: 42 });
    const handler = function login() {};
    Reflect.defineMetadata(AUTH_RATE_LIMIT_KIND_KEY, 'login', handler);
    const setHeader = jest.fn();
    const ctx = {
      getHandler: () => handler,
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {}, ip: '1.2.3.4', socket: {} }),
        getResponse: () => ({ setHeader }),
      }),
    };
    let thrown: unknown;
    try {
      await guard.canActivate(ctx as any);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '42');
    expect(consume).toHaveBeenCalledWith('rl:auth:login:1.2.3.4', 10, 900);
  });
});
