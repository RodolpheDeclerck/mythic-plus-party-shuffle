import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, Specialization } from '@prisma/client';
import { CharacterService } from './character.service';

function createPrisma() {
  return {
    event: { findUnique: jest.fn() },
    character: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

const baseCreate = {
  name: 'Tank',
  characterClass: 'Warrior',
  specialization: Specialization.Warrior_Protection,
  iLevel: 600,
  eventCode: 'EVT123',
};

function prismaP2025() {
  return new Prisma.PrismaClientKnownRequestError('not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('CharacterService', () => {
  describe('createCharacter', () => {
    it('throws NotFound when the event does not exist', async () => {
      const prisma = createPrisma();
      prisma.event.findUnique.mockResolvedValue(null);
      const service = new CharacterService(prisma as any);

      await expect(service.createCharacter(baseCreate as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when the specialization is unknown', async () => {
      const prisma = createPrisma();
      prisma.event.findUnique.mockResolvedValue({ code: 'EVT123' });
      const service = new CharacterService(prisma as any);

      await expect(
        service.createCharacter({
          ...baseCreate,
          specialization: 'NOPE',
        } as any),
      ).rejects.toThrow('Invalid specialization: NOPE');
    });

    it('derives role/bloodLust/battleRez from the specialization', async () => {
      const prisma = createPrisma();
      prisma.event.findUnique.mockResolvedValue({ code: 'EVT123' });
      prisma.character.create.mockResolvedValue({ id: 1 });
      const service = new CharacterService(prisma as any);

      await service.createCharacter(baseCreate as any);

      const data = prisma.character.create.mock.calls[0][0].data;
      expect(data.role).toBeDefined();
      expect(data.bloodLust).toBeDefined();
      expect(data.battleRez).toBeDefined();
      expect(data.eventCode).toBe('EVT123');
    });
  });

  describe('updateCharacter', () => {
    it('throws NotFound when the character is missing', async () => {
      const prisma = createPrisma();
      prisma.character.findUnique.mockResolvedValue(null);
      const service = new CharacterService(prisma as any);

      await expect(service.updateCharacter(5, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('recomputes derived fields when specialization changes', async () => {
      const prisma = createPrisma();
      prisma.character.findUnique.mockResolvedValue({ id: 5, event: {} });
      prisma.character.update.mockResolvedValue({ id: 5 });
      const service = new CharacterService(prisma as any);

      await service.updateCharacter(5, {
        specialization: Specialization.Warrior_Protection,
      } as any);

      const data = prisma.character.update.mock.calls[0][0].data;
      expect(data.specialization).toBe(Specialization.Warrior_Protection);
      expect(data.role).toBeDefined();
    });

    it('throws when the new specialization is unknown', async () => {
      const prisma = createPrisma();
      prisma.character.findUnique.mockResolvedValue({ id: 5, event: {} });
      const service = new CharacterService(prisma as any);

      await expect(
        service.updateCharacter(5, { specialization: 'NOPE' as any }),
      ).rejects.toThrow('Invalid specialization: NOPE');
    });

    it('throws NotFound when reconnecting to a missing event', async () => {
      const prisma = createPrisma();
      prisma.character.findUnique.mockResolvedValue({ id: 5, event: {} });
      prisma.event.findUnique.mockResolvedValue(null);
      const service = new CharacterService(prisma as any);

      await expect(
        service.updateCharacter(5, { eventCode: 'MISSING' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCharacter', () => {
    it('detaches the character from its event', async () => {
      const prisma = createPrisma();
      prisma.character.update.mockResolvedValue({});
      const service = new CharacterService(prisma as any);

      await service.deleteCharacter(3);

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { eventCode: null },
      });
    });

    it('maps Prisma P2025 to NotFound', async () => {
      const prisma = createPrisma();
      prisma.character.update.mockRejectedValue(prismaP2025());
      const service = new CharacterService(prisma as any);

      await expect(service.deleteCharacter(3)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rethrows unexpected errors', async () => {
      const prisma = createPrisma();
      prisma.character.update.mockRejectedValue(new Error('db down'));
      const service = new CharacterService(prisma as any);

      await expect(service.deleteCharacter(3)).rejects.toThrow('db down');
    });
  });

  describe('deleteCharacters', () => {
    it('throws NotFound when fewer rows than ids are updated', async () => {
      const prisma = createPrisma();
      prisma.character.updateMany.mockResolvedValue({ count: 1 });
      const service = new CharacterService(prisma as any);

      await expect(service.deleteCharacters([1, 2])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('succeeds when every id is detached', async () => {
      const prisma = createPrisma();
      prisma.character.updateMany.mockResolvedValue({ count: 2 });
      const service = new CharacterService(prisma as any);

      await expect(service.deleteCharacters([1, 2])).resolves.toBeUndefined();
    });
  });

  describe('upsertCharacter', () => {
    it('updates when the id resolves to an existing character', async () => {
      const prisma = createPrisma();
      prisma.character.findUnique
        .mockResolvedValueOnce({ id: 9 }) // getCharacterById
        .mockResolvedValueOnce({ id: 9, event: {} }); // updateCharacter lookup
      prisma.character.update.mockResolvedValue({ id: 9, name: 'New' });
      const service = new CharacterService(prisma as any);

      const result = await service.upsertCharacter({ id: 9, name: 'New' } as any);

      expect(result).toEqual({ id: 9, name: 'New' });
    });

    it('throws BadRequest when creating without required fields', async () => {
      const prisma = createPrisma();
      const service = new CharacterService(prisma as any);

      await expect(
        service.upsertCharacter({ name: 'Partial' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates when no id is provided and fields are complete', async () => {
      const prisma = createPrisma();
      prisma.event.findUnique.mockResolvedValue({ code: 'EVT123' });
      prisma.character.create.mockResolvedValue({ id: 10 });
      const service = new CharacterService(prisma as any);

      const result = await service.upsertCharacter(baseCreate as any);

      expect(result).toEqual({ id: 10 });
    });
  });
});
