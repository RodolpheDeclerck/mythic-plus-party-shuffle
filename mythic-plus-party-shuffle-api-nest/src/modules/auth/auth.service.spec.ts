import { AuthService } from './auth.service';

function createPrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
}

describe('AuthService', () => {
  describe('findOrCreateByOidcSub', () => {
    it('returns the existing user without creating', async () => {
      const prisma = createPrisma();
      const existing = { id: 1, oidcSub: 'sub-1' };
      prisma.user.findUnique.mockResolvedValue(existing);
      const service = new AuthService(prisma as any);

      const result = await service.findOrCreateByOidcSub(
        'sub-1',
        'a@b.c',
        'alice',
      );

      expect(result).toBe(existing);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { oidcSub: 'sub-1' },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('creates a new user when none exists', async () => {
      const prisma = createPrisma();
      prisma.user.findUnique.mockResolvedValue(null);
      const created = { id: 2, oidcSub: 'sub-2' };
      prisma.user.create.mockResolvedValue(created);
      const service = new AuthService(prisma as any);

      const result = await service.findOrCreateByOidcSub(
        'sub-2',
        'b@c.d',
        'bob',
      );

      expect(result).toBe(created);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { oidcSub: 'sub-2', email: 'b@c.d', username: 'bob' },
      });
    });
  });

  describe('validateUser', () => {
    it('looks up the user by id with the public select', async () => {
      const prisma = createPrisma();
      const user = { id: 3, email: 'e@f.g', username: 'carol' };
      prisma.user.findUnique.mockResolvedValue(user);
      const service = new AuthService(prisma as any);

      const result = await service.validateUser(3);

      expect(result).toBe(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
        select: { id: true, email: true, username: true },
      });
    });
  });
});
