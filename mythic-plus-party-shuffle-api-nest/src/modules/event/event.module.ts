import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventAdminGuard } from './guards/event-admin.guard';
import { PartyFacade } from '../../shared/facade/party.facade';
import { PartyModule } from '../party/party.module';
import { WebSocketModule } from '../../shared/websocket/websocket.module';

@Module({
  imports: [
    PartyModule,
    WebSocketModule,
  ],
  controllers: [EventController],
  providers: [EventService, EventAdminGuard, PartyFacade],
  exports: [EventService],
})
export class EventModule {}
