import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthService } from '../auth.service';

interface Auth0JwtPayload {
  sub?: string;
  email?: string;
  nickname?: string;
  name?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const issuer = configService.get<string>('auth.issuerBaseUrl');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}.well-known/jwks.json`,
      }),
      issuer,
      audience: configService.get<string>('auth.audience'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: Auth0JwtPayload) {
    if (!payload?.sub) {
      this.logger.warn('Invalid JWT payload: missing sub');
      throw new UnauthorizedException('Invalid token payload');
    }

    const username = payload.nickname || payload.name || payload.sub;
    const email = payload.email || `${payload.sub}@oidc.local`;

    const user = await this.authService.findOrCreateByOidcSub(
      payload.sub,
      email,
      username,
    );

    if (this.configService.get<string>('nodeEnv') === 'development') {
      this.logger.debug(
        `JWT validated for user id ${user.id} (sub: ${payload.sub})`,
      );
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }
}
