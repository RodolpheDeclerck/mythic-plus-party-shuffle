import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';

type JwtPayload = { id?: number; email?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.session ?? null,
        (request: Request) => {
          const authHeader = request?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
          }
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.id) {
      this.logger.warn('Invalid JWT payload: missing subject id');
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.authService.validateUser(payload.id);

    if (!user) {
      this.logger.warn(`JWT referenced user id not found: ${payload.id}`);
      throw new UnauthorizedException('User not found');
    }

    if (this.configService.get<string>('nodeEnv') === 'development') {
      this.logger.debug(`JWT validated for user id ${user.id}`);
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }
}
