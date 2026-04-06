import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Extraire depuis les cookies (priorité)
        (request) => {
          const token = request?.cookies?.session;
          if (token) {
            console.log('✅ Token found in cookies');
            return token;
          }
          return null;
        },
        // 2. Extraire depuis le header Authorization (fallback)
        (request) => {
          const authHeader = request?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            console.log('✅ Token found in Authorization header');
            return token;
          }
          return null;
        },
        // 3. Utiliser la méthode standard de passport-jwt
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    console.log('🔍 Validating JWT payload:', payload);
    
    if (!payload || !payload.id) {
      console.log('❌ Invalid payload - missing id');
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.authService.validateUser(payload.id);
    
    if (!user) {
      console.log('❌ User not found for ID:', payload.id);
      throw new UnauthorizedException('User not found');
    }

    console.log('✅ User validated:', user.id);
    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }
}