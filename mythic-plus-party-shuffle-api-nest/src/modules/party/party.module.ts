import { Module } from '@nestjs/common';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';
import { RedisModule } from '../../shared/redis/redis.module';
import { WebSocketModule } from '../../shared/websocket/websocket.module';

@Module({
  imports: [RedisModule, WebSocketModule],
  controllers: [PartyController],
  providers: [PartyService],
  exports: [PartyService],
})
export class PartyModule {}
