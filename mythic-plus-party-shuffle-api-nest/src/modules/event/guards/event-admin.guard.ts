import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { AppEvent } from '../../../shared/entities/event.entity';
  
  @Injectable()
  export class EventAdminGuard implements CanActivate {
    constructor(
      @InjectRepository(AppEvent)
      private eventRepository: Repository<AppEvent>,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const { eventCode } = request.params;
      const currentUserId = request.user?.id;
  
      if (!currentUserId) {
        throw new ForbiddenException('Not authenticated');
      }
  
      const event = await this.eventRepository.findOne({
        where: { code: eventCode },
        relations: ['admins'],
      });
  
      if (!event) {
        throw new NotFoundException('Event not found');
      }
  
      const isAdmin = event.admins.some((admin) => admin.id === currentUserId);
  
      if (!isAdmin) {
        throw new ForbiddenException('Access forbidden: Not an admin');
      }
  
      return true;
    }
  }