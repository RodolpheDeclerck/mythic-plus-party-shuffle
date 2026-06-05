import { UnauthorizedException } from '@nestjs/common';
import { BlizzardController } from './blizzard.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BattlenetNotLinkedException } from './errors';

function createService() {
  return {
    getCharacters: jest.fn(),
    getCharacter: jest.fn(),
  };
}

function authedReq(token = 'auth0-token', userId = 1) {
  return {
    headers: { authorization: `Bearer ${token}` },
    user: { id: userId },
  } as any;
}

describe('BlizzardController', () => {
  it('is protected by JwtAuthGuard', () => {
    const guards = Reflect.getMetadata('__guards__', BlizzardController) ?? [];
    expect(guards).toContain(JwtAuthGuard);
  });

  describe('getCharacters', () => {
    it('passes the bearer token and user id to the service', async () => {
      const service = createService();
      const roster = [{ name: 'Thrall' }];
      service.getCharacters.mockResolvedValue(roster);
      const controller = new BlizzardController(service as any);

      const result = await controller.getCharacters(authedReq('tok', 7));

      expect(result).toBe(roster);
      expect(service.getCharacters).toHaveBeenCalledWith('tok', 7);
    });

    it('rejects when the bearer token is missing', async () => {
      const controller = new BlizzardController(createService() as any);
      const req = { headers: {}, user: { id: 1 } } as any;

      await expect(controller.getCharacters(req)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('propagates the not-linked error so the UI can show the link CTA', async () => {
      const service = createService();
      service.getCharacters.mockRejectedValue(new BattlenetNotLinkedException());
      const controller = new BlizzardController(service as any);

      await expect(controller.getCharacters(authedReq())).rejects.toBeInstanceOf(
        BattlenetNotLinkedException,
      );
    });
  });

  describe('getCharacter', () => {
    it('passes token, user id, realm and name to the service', async () => {
      const service = createService();
      const enriched = { name: 'Thrall', iLevel: 489 };
      service.getCharacter.mockResolvedValue(enriched);
      const controller = new BlizzardController(service as any);

      const result = await controller.getCharacter(authedReq('tok', 3), 'illidan', 'thrall');

      expect(result).toBe(enriched);
      expect(service.getCharacter).toHaveBeenCalledWith('tok', 3, 'illidan', 'thrall');
    });
  });
});
