import { AuthController } from './auth.controller';

describe('AuthController', () => {
  describe('logout', () => {
    it('clears the session cookie with the configured domain', async () => {
      const config = { get: jest.fn().mockReturnValue('example.com') };
      const res = { clearCookie: jest.fn() };
      const controller = new AuthController(config as any);

      const result = await controller.logout(res as any);

      expect(res.clearCookie).toHaveBeenCalledWith('session', {
        path: '/',
        domain: 'example.com',
      });
      expect(result).toEqual({ message: 'Logged out' });
    });

    it('falls back to undefined domain when not configured', async () => {
      const config = { get: jest.fn().mockReturnValue(undefined) };
      const res = { clearCookie: jest.fn() };
      const controller = new AuthController(config as any);

      await controller.logout(res as any);

      expect(res.clearCookie).toHaveBeenCalledWith('session', {
        path: '/',
        domain: undefined,
      });
    });
  });

  describe('getCurrentUser', () => {
    it('returns the user attached to the request', async () => {
      const controller = new AuthController({ get: jest.fn() } as any);
      const user = { id: 1, username: 'alice' };

      const result = await controller.getCurrentUser({ user } as any);

      expect(result).toBe(user);
    });
  });
});
