import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RateLimitService } from './rate-limit.service';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RateLimitService, AuthRateLimitGuard, JwtStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
