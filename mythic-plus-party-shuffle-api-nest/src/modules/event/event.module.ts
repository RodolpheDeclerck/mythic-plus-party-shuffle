import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventAdminGuard } from './guards/event-admin.guard';
import { AppEvent } from '../../shared/entities/event.entity';
import { User } from '../../shared/entities/user.entity';
import { Character } from '../../shared/entities/character.entity';
import { PartyFacade } from '../../shared/facade/party.facade';
import { PartyModule } from '../party/party.module';
import { WebSocketModule } from 'src/shared/websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppEvent, User, Character]),
    PartyModule, // Import pour utiliser PartyService
    WebSocketModule, // ← Ajouter
  ],
  controllers: [EventController],
  providers: [EventService, EventAdminGuard, PartyFacade],
  exports: [EventService],
})
export class EventModule {}