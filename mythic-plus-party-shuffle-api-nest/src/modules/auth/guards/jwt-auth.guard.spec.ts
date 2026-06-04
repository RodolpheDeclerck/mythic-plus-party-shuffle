import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

function createContext(request: any = {}) {
  return {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

describe('JwtAuthGuard', () => {
  describe('canActivate', () => {
    it('bypasses authentication for public routes', () => {
      const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
      const guard = new JwtAuthGuard(reflector as any);

      expect(guard.canActivate(createContext())).toBe(true);
    });

    it('delegates to passport for protected routes', () => {
      const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
      const guard = new JwtAuthGuard(reflector as any);
      const superProto = Object.getPrototypeOf(Object.getPrototypeOf(guard));
      const superSpy = jest
        .spyOn(superProto, 'canActivate')
        .mockReturnValue(true);

      const ctx = createContext();
      expect(guard.canActivate(ctx)).toBe(true);
      expect(superSpy).toHaveBeenCalledWith(ctx);
      superSpy.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('returns the user on success', () => {
      const guard = new JwtAuthGuard({ getAllAndOverride: jest.fn() } as any);
      const user = { id: 1 };

      expect(
        guard.handleRequest(null, user, undefined, createContext()),
      ).toBe(user);
    });

    it('throws the original error when present', () => {
      const guard = new JwtAuthGuard({ getAllAndOverride: jest.fn() } as any);
      const err = new Error('boom');
      const ctx = createContext({ method: 'GET', path: '/x' });

      expect(() => guard.handleRequest(err, null, undefined, ctx)).toThrow(err);
    });

    it('throws UnauthorizedException when no user and no error', () => {
      const guard = new JwtAuthGuard({ getAllAndOverride: jest.fn() } as any);
      const ctx = createContext({ method: 'POST', path: '/y' });

      expect(() =>
        guard.handleRequest(null, null, { message: 'expired' }, ctx),
      ).toThrow(UnauthorizedException);
    });
  });
});
