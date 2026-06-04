import { HttpException, HttpStatus } from '@nestjs/common';
import { Specialization } from '@prisma/client';
import { CharacterController } from './character.controller';

function createDeps() {
  const characterService = {
    createCharacter: jest.fn(),
    getAllCharacters: jest.fn(),
    getCharacterById: jest.fn(),
    updateCharacter: jest.fn(),
    deleteCharacter: jest.fn(),
    deleteCharacters: jest.fn(),
    upsertCharacter: jest.fn(),
  };
  const webSocketService = { emitCharacterUpdated: jest.fn() };
  return { characterService, webSocketService };
}

const validSpec = Specialization.Warrior_Protection;

describe('CharacterController', () => {
  describe('createCharacter', () => {
    it('rejects an invalid specialization', async () => {
      const { characterService, webSocketService } = createDeps();
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      await expect(
        controller.createCharacter({ specialization: 'NOPE' } as any),
      ).rejects.toThrow(HttpException);
      expect(characterService.createCharacter).not.toHaveBeenCalled();
    });

    it('creates and emits on success', async () => {
      const { characterService, webSocketService } = createDeps();
      characterService.createCharacter.mockResolvedValue({ id: 1 });
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      const result = await controller.createCharacter({
        specialization: validSpec,
      } as any);

      expect(result).toEqual({ id: 1 });
      expect(webSocketService.emitCharacterUpdated).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCharacterById', () => {
    it('throws 404 when the character is missing', async () => {
      const { characterService, webSocketService } = createDeps();
      characterService.getCharacterById.mockResolvedValue(null);
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      await expect(controller.getCharacterById(1)).rejects.toThrow(
        'Character not found',
      );
    });
  });

  describe('upsertCharacter', () => {
    it('coerces numeric fields and forwards to the service', async () => {
      const { characterService, webSocketService } = createDeps();
      characterService.upsertCharacter.mockResolvedValue({ id: 2 });
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      const result = await controller.upsertCharacter(
        { id: '2', iLevel: '600', specialization: validSpec },
        { body: {} } as any,
      );

      const dto = characterService.upsertCharacter.mock.calls[0][0];
      expect(dto.id).toBe(2);
      expect(dto.iLevel).toBe(600);
      expect(result).toEqual({ id: 2 });
      expect(webSocketService.emitCharacterUpdated).toHaveBeenCalled();
    });

    it('rejects an invalid specialization', async () => {
      const { characterService, webSocketService } = createDeps();
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      await expect(
        controller.upsertCharacter(
          { specialization: 'NOPE' },
          { body: {} } as any,
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('updateCharacter', () => {
    it('rejects an invalid specialization', async () => {
      const { characterService, webSocketService } = createDeps();
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      await expect(
        controller.updateCharacter(1, { specialization: 'NOPE' } as any),
      ).rejects.toThrow(HttpException);
    });

    it('throws 404 when the service returns nothing', async () => {
      const { characterService, webSocketService } = createDeps();
      characterService.updateCharacter.mockResolvedValue(null);
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      await expect(controller.updateCharacter(1, {} as any)).rejects.toThrow(
        new HttpException('Character not found', HttpStatus.NOT_FOUND),
      );
    });

    it('emits on a successful update', async () => {
      const { characterService, webSocketService } = createDeps();
      characterService.updateCharacter.mockResolvedValue({ id: 1 });
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      await controller.updateCharacter(1, {} as any);

      expect(webSocketService.emitCharacterUpdated).toHaveBeenCalled();
    });
  });

  describe('delete endpoints', () => {
    it('deleteCharacter emits and returns a message', async () => {
      const { characterService, webSocketService } = createDeps();
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      const result = await controller.deleteCharacter(1);

      expect(characterService.deleteCharacter).toHaveBeenCalledWith(1);
      expect(webSocketService.emitCharacterUpdated).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Character deleted successfully' });
    });

    it('deleteCharacters forwards the ids', async () => {
      const { characterService, webSocketService } = createDeps();
      const controller = new CharacterController(
        characterService as any,
        webSocketService as any,
      );

      const result = await controller.deleteCharacters({ ids: [1, 2] } as any);

      expect(characterService.deleteCharacters).toHaveBeenCalledWith([1, 2]);
      expect(result).toEqual({ message: 'Characters deleted successfully' });
    });
  });
});
