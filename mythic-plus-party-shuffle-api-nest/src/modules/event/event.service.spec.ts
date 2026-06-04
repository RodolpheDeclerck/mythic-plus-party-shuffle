import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventService } from './event.service';

function createPrisma() {
  return {
    user: { findUnique: jest.fn() },
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    character: { findMany: jest.fn() },
  };
}

function prismaP2025() {
  return new Prisma.PrismaClientKnownRequestError('not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

// admins arrive as EventAdmin[] with nested user; service flattens to user[]
const adminRelation = [{ user: { id: 1, username: 'a', email: 'a@x.y' } }];

describe('EventService', () => {
  describe('createEvent', () => {
    it('throws NotFound when the creator user is missing', async () => {
      const prisma = createPrisma();
      prisma.user.findUnique.mockResolvedValue(null);
      const service = new EventService(prisma as any);

      await expect(
        service.createEvent({ name: 'E', createdBy: 1 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the event and flattens admins', async () => {
      const prisma = createPrisma();
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.event.create.mockResolvedValue({
        id: 1,
        name: 'E',
        admins: adminRelation,
      });
      const service = new EventService(prisma as any);

      const result = await service.createEvent({ name: 'E', createdBy: 1 } as any);

      expect(result.admins).toEqual([{ id: 1, username: 'a', email: 'a@x.y' }]);
    });
  });

  describe('getEventById', () => {
    it('returns null when not found', async () => {
      const prisma = createPrisma();
      prisma.event.findUnique.mockResolvedValue(null);
      const service = new EventService(prisma as any);

      expect(await service.getEventById(99)).toBeNull();
    });

    it('flattens admins when found', async () => {
      const prisma = createPrisma();
      prisma.event.findUnique.mockResolvedValue({ id: 1, admins: adminRelation });
      const service = new EventService(prisma as any);

      const result = await service.getEventById(1);

      expect(result?.admins).toEqual([{ id: 1, username: 'a', email: 'a@x.y' }]);
    });
  });

  describe('updateEvent', () => {
    it('throws NotFound when the event is missing', async () => {
      const prisma = createPrisma();
      prisma.event.findUnique.mockResolvedValue(null);
      const service = new EventService(prisma as any);

      await expect(service.updateEvent(1, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('replaces admins by deleting then recreating', async () => {
      const prisma = createPrisma();
      prisma.event.findUnique.mockResolvedValue({ id: 1 });
      prisma.event.update.mockResolvedValue({ id: 1, admins: adminRelation });
      const service = new EventService(prisma as any);

      await service.updateEvent(1, { admins: [1, 2] } as any);

      const data = prisma.event.update.mock.calls[0][0].data;
      expect(data.admins.deleteMany).toEqual({});
      expect(data.admins.create).toEqual([{ userId: 1 }, { userId: 2 }]);
    });
  });

  describe('deleteEvent', () => {
    it('maps Prisma P2025 to NotFound', async () => {
      const prisma = createPrisma();
      prisma.event.delete.mockRejectedValue(prismaP2025());
      const service = new EventService(prisma as any);

      await expect(service.deleteEvent('CODE')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rethrows unexpected errors', async () => {
      const prisma = createPrisma();
      prisma.event.delete.mockRejectedValue(new Error('db down'));
      const service = new EventService(prisma as any);

      await expect(service.deleteEvent('CODE')).rejects.toThrow('db down');
    });
  });

  describe('setPartiesVisibility', () => {
    it('persists the flag and flattens admins', async () => {
      const prisma = createPrisma();
      prisma.event.update.mockResolvedValue({
        id: 1,
        arePartiesVisible: true,
        admins: adminRelation,
      });
      const service = new EventService(prisma as any);

      const result = await service.setPartiesVisibility('CODE', true);

      expect(prisma.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { code: 'CODE' },
          data: { arePartiesVisible: true },
        }),
      );
      expect(result.admins).toEqual([{ id: 1, username: 'a', email: 'a@x.y' }]);
    });
  });

  describe('getCharactersByEventCode', () => {
    it('queries characters by event code', async () => {
      const prisma = createPrisma();
      prisma.character.findMany.mockResolvedValue([{ id: 1 }]);
      const service = new EventService(prisma as any);

      const result = await service.getCharactersByEventCode('CODE');

      expect(prisma.character.findMany).toHaveBeenCalledWith({
        where: { eventCode: 'CODE' },
      });
      expect(result).toEqual([{ id: 1 }]);
    });
  });
});
