import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class EventAdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { eventCode } = request.params;
    const currentUserId = request.user?.id;

    if (!currentUserId) {
      throw new ForbiddenException('Not authenticated');
    }

    const event = await this.prisma.event.findUnique({
      where: { code: eventCode },
      include: { admins: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isAdmin = event.admins.some((ea) => ea.userId === currentUserId);

    if (!isAdmin) {
      throw new ForbiddenException('Access forbidden: Not an admin');
    }

    return true;
  }
}
