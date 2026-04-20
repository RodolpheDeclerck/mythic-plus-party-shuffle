import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './shared/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { EventModule } from './modules/event/event.module';
import { PartyModule } from './modules/party/party.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { RedisModule } from './shared/redis/redis.module';
import { WebSocketModule } from './shared/websocket/websocket.module';
import { CharacterModule } from './modules/character/character.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // Prisma (global)
    PrismaModule,

    // Redis
    RedisModule,

    // WebSocket
    WebSocketModule,

    // Auth
    AuthModule,

    // Modules métier
    UserModule,
    CharacterModule,
    EventModule,
    PartyModule,
    MetadataModule,
  ],
})
export class AppModule {}
