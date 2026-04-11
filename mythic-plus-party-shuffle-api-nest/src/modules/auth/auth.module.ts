import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PasswordHashingService } from './password-hashing.service';
import { AuthController } from './auth.controller';
import { RateLimitService } from './rate-limit.service';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn = configService.get<string>('jwt.expiresIn') || '24h';
        
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any, // Cast pour éviter l'erreur de type
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordHashingService, RateLimitService, AuthRateLimitGuard, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}