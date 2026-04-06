import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEvent } from '../../shared/entities/event.entity';
import { User } from '../../shared/entities/user.entity';
import { Character } from '../../shared/entities/character.entity';
import { CreateEventDto, UpdateEventDto } from './dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(AppEvent)
    private eventRepository: Repository<AppEvent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<AppEvent> {
    const user = await this.userRepository.findOne({
      where: { id: createEventDto.createdBy },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newEvent = new AppEvent();
    newEvent.name = createEventDto.name;
    newEvent.createdBy = user;
    newEvent.admins = [user];

    return await this.eventRepository.save(newEvent);
  }

  async getAllEvents(): Promise<AppEvent[]> {
    return await this.eventRepository.find();
  }

  async getEventById(id: number): Promise<AppEvent | null> {
    return await this.eventRepository.findOne({ where: { id } });
  }

  async getEventByCode(code: string): Promise<AppEvent | null> {
    return await this.eventRepository.findOne({ where: { code } });
  }

  async updateEvent(id: number, updateEventDto: UpdateEventDto): Promise<AppEvent> {
    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (updateEventDto.name) {
      event.name = updateEventDto.name;
    }

    if (updateEventDto.admins) {
      const admins = await this.userRepository.find({
        where: { id: updateEventDto.admins as any },
      });
      event.admins = admins;
    }

    return await this.eventRepository.save(event);
  }

  async deleteEvent(eventCode: string): Promise<void> {
    const result = await this.eventRepository.delete({ code: eventCode });
    
    if (result.affected === 0) {
      throw new NotFoundException('Event not found');
    }
  }

  async getCharactersByEventCode(eventCode: string): Promise<Character[]> {
    return await this.characterRepository.find({
      where: { event: { code: eventCode } },
    });
  }

  async getEventsByAdmin(userId: number): Promise<AppEvent[]> {
    return await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.admins', 'admin', 'admin.id = :userId', { userId })
      .getMany();
  }

  async setPartiesVisibility(eventCode: string, visible: boolean): Promise<AppEvent> {
    console.log(`🔄 [EventService] Updating parties visibility for event ${eventCode} to ${visible}`);
    
    // Vérifier la valeur avant la mise à jour
    const eventBefore = await this.eventRepository.findOne({
      where: { code: eventCode },
      select: ['id', 'code', 'arePartiesVisible'],
    });
    console.log(`📊 [EventService] Before update - arePartiesVisible:`, eventBefore?.arePartiesVisible);
    
    const updateResult = await this.eventRepository.update(
      { code: eventCode }, 
      { arePartiesVisible: visible }
    );
    
    console.log(`📊 [EventService] Update result:`, { affected: updateResult.affected });

    // Récupérer l'événement avec toutes les colonnes explicitement
    const updatedEvent = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.code = :code', { code: eventCode })
      .getOne();

    if (!updatedEvent) {
      console.error(`❌ [EventService] Event not found after update: ${eventCode}`);
      throw new NotFoundException('Event not found');
    }

    console.log(`✅ [EventService] Event found after update:`, {
      id: updatedEvent.id,
      code: updatedEvent.code,
      arePartiesVisible: updatedEvent.arePartiesVisible,
      type: typeof updatedEvent.arePartiesVisible,
    });

    return updatedEvent;
  }
}