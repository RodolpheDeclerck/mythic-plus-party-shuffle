import { UserController } from './user.controller';

function createService() {
  return {
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };
}

describe('UserController', () => {
  it('getAllUsers delegates to the service', async () => {
    const service = createService();
    service.getUsers.mockResolvedValue([{ id: 1 }]);
    const controller = new UserController(service as any);

    expect(await controller.getAllUsers()).toEqual([{ id: 1 }]);
  });

  describe('getUserById', () => {
    it('throws when not found', async () => {
      const service = createService();
      service.getUserById.mockResolvedValue(null);
      const controller = new UserController(service as any);

      await expect(controller.getUserById(1)).rejects.toThrow('User not found');
    });

    it('returns the user when found', async () => {
      const service = createService();
      service.getUserById.mockResolvedValue({ id: 1 });
      const controller = new UserController(service as any);

      expect(await controller.getUserById(1)).toEqual({ id: 1 });
    });
  });

  describe('updateUser', () => {
    it('forbids editing another user', async () => {
      const service = createService();
      const controller = new UserController(service as any);

      await expect(
        controller.updateUser(1, {} as any, { user: { id: 2 } } as any),
      ).rejects.toThrow('Forbidden');
      expect(service.updateUser).not.toHaveBeenCalled();
    });

    it('updates when editing own account', async () => {
      const service = createService();
      service.updateUser.mockResolvedValue({ id: 1, username: 'new' });
      const controller = new UserController(service as any);

      const result = await controller.updateUser(
        1,
        { username: 'new' } as any,
        { user: { id: 1 } } as any,
      );

      expect(result).toEqual({ id: 1, username: 'new' });
    });
  });

  describe('deleteUser', () => {
    it('forbids deleting another user', async () => {
      const service = createService();
      const controller = new UserController(service as any);

      await expect(
        controller.deleteUser(1, { user: { id: 2 } } as any),
      ).rejects.toThrow('Forbidden');
      expect(service.deleteUser).not.toHaveBeenCalled();
    });

    it('deletes own account', async () => {
      const service = createService();
      const controller = new UserController(service as any);

      await controller.deleteUser(1, { user: { id: 1 } } as any);

      expect(service.deleteUser).toHaveBeenCalledWith(1);
    });
  });
});
