import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';
import { Character } from '../../shared/entities/character.entity';
import { RedisModule } from '../../shared/redis/redis.module'; // ou @nestjs/redis selon votre package
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketModule } from '../../shared/websocket/websocket.module'; // ← Ajouter

@Module({
  imports: [
    TypeOrmModule.forFeature([Character]),
    RedisModule,
    WebSocketModule, // ← Ajouter cette ligne
  ],
  controllers: [PartyController],
  providers: [PartyService],
  exports: [PartyService],
})
export class PartyModule {} 