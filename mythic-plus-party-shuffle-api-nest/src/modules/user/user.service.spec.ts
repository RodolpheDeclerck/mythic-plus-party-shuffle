import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';

function createPrisma() {
  return {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

function prismaP2025() {
  return new Prisma.PrismaClientKnownRequestError('not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('UserService', () => {
  it('getUsers returns the public projection', async () => {
    const prisma = createPrisma();
    prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
    const service = new UserService(prisma as any);

    const result = await service.getUsers();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      select: { id: true, email: true, username: true },
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('getUserById queries by id', async () => {
    const prisma = createPrisma();
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    const service = new UserService(prisma as any);

    await service.getUserById(1);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  describe('updateUser', () => {
    it('updates the username', async () => {
      const prisma = createPrisma();
      prisma.user.update.mockResolvedValue({ id: 1, username: 'new' });
      const service = new UserService(prisma as any);

      const result = await service.updateUser(1, { username: 'new' } as any);

      expect(result).toEqual({ id: 1, username: 'new' });
    });

    it('maps P2025 to NotFound', async () => {
      const prisma = createPrisma();
      prisma.user.update.mockRejectedValue(prismaP2025());
      const service = new UserService(prisma as any);

      await expect(
        service.updateUser(1, { username: 'new' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('rethrows unexpected errors', async () => {
      const prisma = createPrisma();
      prisma.user.update.mockRejectedValue(new Error('db down'));
      const service = new UserService(prisma as any);

      await expect(
        service.updateUser(1, { username: 'new' } as any),
      ).rejects.toThrow('db down');
    });
  });

  describe('deleteUser', () => {
    it('maps P2025 to NotFound', async () => {
      const prisma = createPrisma();
      prisma.user.delete.mockRejectedValue(prismaP2025());
      const service = new UserService(prisma as any);

      await expect(service.deleteUser(1)).rejects.toThrow(NotFoundException);
    });

    it('resolves on success', async () => {
      const prisma = createPrisma();
      prisma.user.delete.mockResolvedValue({});
      const service = new UserService(prisma as any);

      await expect(service.deleteUser(1)).resolves.toBeUndefined();
    });
  });
});
