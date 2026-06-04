import { HttpException } from '@nestjs/common';
import { PartyController } from './party.controller';

function createDeps() {
  const partyService = {
    getPartiesByEventCode: jest.fn(),
    createOrUpdatePartiesToRedis: jest.fn(),
    deleteGroupsFromRedis: jest.fn(),
  };
  const webSocketService = { emitPartiesUpdated: jest.fn() };
  return { partyService, webSocketService };
}

function build(deps = createDeps()) {
  return {
    deps,
    controller: new PartyController(
      deps.partyService as any,
      deps.webSocketService as any,
    ),
  };
}

describe('PartyController', () => {
  describe('getParties', () => {
    it('reads parties from the service', async () => {
      const { deps, controller } = build();
      deps.partyService.getPartiesByEventCode.mockResolvedValue([{ id: 1 }]);

      expect(await controller.getParties('C')).toEqual([{ id: 1 }]);
    });
  });

  describe('createOrUpdateParties', () => {
    it('accepts a raw array body and emits the persisted parties', async () => {
      const { deps, controller } = build();
      deps.partyService.getPartiesByEventCode.mockResolvedValue(['stored']);
      const body = [{ id: 1, members: [{ id: 10 }] }];

      const result = await controller.createOrUpdateParties('C', body);

      expect(deps.partyService.createOrUpdatePartiesToRedis).toHaveBeenCalledWith(
        [{ id: 1, members: [{ id: 10 }] }],
        'C',
      );
      expect(deps.webSocketService.emitPartiesUpdated).toHaveBeenCalledWith([
        'stored',
      ]);
      expect(result).toEqual({
        message: 'Parties created or updated successfully',
      });
    });

    it('accepts a { parties } wrapper and coerces numeric ids', async () => {
      const { deps, controller } = build();
      deps.partyService.getPartiesByEventCode.mockResolvedValue([]);
      const body = { parties: [{ id: 1, members: [{ id: '10', name: 'X' }] }] };

      await controller.createOrUpdateParties('C', body);

      const [persisted] =
        deps.partyService.createOrUpdatePartiesToRedis.mock.calls[0];
      expect(persisted[0].members[0]).toEqual({ id: 10, name: 'X' });
    });

    it('wraps a bare numeric member as an id-only object', async () => {
      const { deps, controller } = build();
      deps.partyService.getPartiesByEventCode.mockResolvedValue([]);
      const body = [{ id: 1, members: [10] }];

      await controller.createOrUpdateParties('C', body);

      const [persisted] =
        deps.partyService.createOrUpdatePartiesToRedis.mock.calls[0];
      expect(persisted[0].members[0]).toEqual({ id: 10 });
    });

    it('throws BadRequest when a party has no members array', async () => {
      const { controller } = build();
      const body = [{ id: 1 }];

      await expect(
        controller.createOrUpdateParties('C', body),
      ).rejects.toThrow(HttpException);
    });

    it('throws BadRequest when the body is not a parties payload', async () => {
      const { controller } = build();

      await expect(
        controller.createOrUpdateParties('C', { foo: 'bar' }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('deleteParties', () => {
    it('clears redis and broadcasts an empty update', async () => {
      const { deps, controller } = build();

      const result = await controller.deleteParties('C');

      expect(deps.partyService.deleteGroupsFromRedis).toHaveBeenCalledWith('C');
      expect(deps.webSocketService.emitPartiesUpdated).toHaveBeenCalledWith();
      expect(result).toEqual({ message: 'Parties deleted successfully' });
    });
  });
});
