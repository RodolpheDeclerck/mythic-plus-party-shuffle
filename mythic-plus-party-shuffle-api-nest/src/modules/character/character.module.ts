import { Module } from '@nestjs/common';
import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { WebSocketModule } from '../../shared/websocket/websocket.module';
import { PartyModule } from '../party/party.module';

@Module({
  imports: [
    WebSocketModule,
    PartyModule,
  ],
  controllers: [CharacterController],
  providers: [CharacterService],
  exports: [CharacterService],
})
export class CharacterModule {}
