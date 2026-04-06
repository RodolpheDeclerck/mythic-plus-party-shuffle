import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
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

    // TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: configService.get('nodeEnv') === 'development',
        // Compiled JS only: Node cannot require() raw .ts migration files.
        migrations: [join(__dirname, 'migrations', '*.js')],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),

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