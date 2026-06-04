jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(() => (_req: any, _token: any, done: any) =>
    done(null, 'test-secret'),
  ),
}));

import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

function createConfig(overrides: Record<string, any> = {}) {
  const values: Record<string, any> = {
    'auth.issuerBaseUrl': 'https://issuer.example.com/',
    'auth.audience': 'my-audience',
    nodeEnv: 'test',
    ...overrides,
  };
  return { get: jest.fn((key: string) => values[key]) };
}

describe('JwtStrategy', () => {
  describe('validate', () => {
    it('throws when the payload has no sub', async () => {
      const authService = { findOrCreateByOidcSub: jest.fn() };
      const strategy = new JwtStrategy(createConfig() as any, authService as any);

      await expect(strategy.validate({} as any)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authService.findOrCreateByOidcSub).not.toHaveBeenCalled();
    });

    it('maps nickname and email straight through', async () => {
      const authService = {
        findOrCreateByOidcSub: jest
          .fn()
          .mockResolvedValue({ id: 7, email: 'real@x.y', username: 'nick' }),
      };
      const strategy = new JwtStrategy(createConfig() as any, authService as any);

      const result = await strategy.validate({
        sub: 'auth0|1',
        nickname: 'nick',
        email: 'real@x.y',
      } as any);

      expect(authService.findOrCreateByOidcSub).toHaveBeenCalledWith(
        'auth0|1',
        'real@x.y',
        'nick',
      );
      expect(result).toEqual({ id: 7, email: 'real@x.y', username: 'nick' });
    });

    it('falls back to sub-derived username and synthetic email', async () => {
      const authService = {
        findOrCreateByOidcSub: jest
          .fn()
          .mockResolvedValue({ id: 8, email: 'auth0|2@oidc.local', username: 'auth0|2' }),
      };
      const strategy = new JwtStrategy(createConfig() as any, authService as any);

      await strategy.validate({ sub: 'auth0|2' } as any);

      expect(authService.findOrCreateByOidcSub).toHaveBeenCalledWith(
        'auth0|2',
        'auth0|2@oidc.local',
        'auth0|2',
      );
    });

    it('prefers name over sub when nickname is absent', async () => {
      const authService = {
        findOrCreateByOidcSub: jest
          .fn()
          .mockResolvedValue({ id: 9, email: 'n@x.y', username: 'Full Name' }),
      };
      const strategy = new JwtStrategy(createConfig() as any, authService as any);

      await strategy.validate({
        sub: 'auth0|3',
        name: 'Full Name',
        email: 'n@x.y',
      } as any);

      expect(authService.findOrCreateByOidcSub).toHaveBeenCalledWith(
        'auth0|3',
        'n@x.y',
        'Full Name',
      );
    });
  });
});
