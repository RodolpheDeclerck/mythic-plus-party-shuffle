import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { Character } from '../../shared/entities/character.entity';
import { AppEvent } from '../../shared/entities/event.entity';
import { WebSocketModule } from '../../shared/websocket/websocket.module';
import { PartyModule } from '../party/party.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, AppEvent]),
    WebSocketModule, // Pour émettre les événements Socket.io
    PartyModule,
  ],
  controllers: [CharacterController],
  providers: [CharacterService],
  exports: [CharacterService], // Exporté pour être utilisé dans EventModule si nécessaire
})
export class CharacterModule {
}