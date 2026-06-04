import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventAdminGuard } from './event-admin.guard';

function createContext(params: any, user: any) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ params, user }) }),
  } as any;
}

describe('EventAdminGuard', () => {
  it('throws Forbidden when no user is authenticated', async () => {
    const prisma = { event: { findUnique: jest.fn() } };
    const guard = new EventAdminGuard(prisma as any);

    await expect(
      guard.canActivate(createContext({ eventCode: 'C' }, undefined)),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.event.findUnique).not.toHaveBeenCalled();
  });

  it('throws NotFound when the event does not exist', async () => {
    const prisma = { event: { findUnique: jest.fn().mockResolvedValue(null) } };
    const guard = new EventAdminGuard(prisma as any);

    await expect(
      guard.canActivate(createContext({ eventCode: 'C' }, { id: 1 })),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws Forbidden when the user is not an admin', async () => {
    const prisma = {
      event: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ admins: [{ userId: 2 }] }),
      },
    };
    const guard = new EventAdminGuard(prisma as any);

    await expect(
      guard.canActivate(createContext({ eventCode: 'C' }, { id: 1 })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows access when the user is an admin', async () => {
    const prisma = {
      event: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ admins: [{ userId: 1 }] }),
      },
    };
    const guard = new EventAdminGuard(prisma as any);

    await expect(
      guard.canActivate(createContext({ eventCode: 'C' }, { id: 1 })),
    ).resolves.toBe(true);
  });
});
