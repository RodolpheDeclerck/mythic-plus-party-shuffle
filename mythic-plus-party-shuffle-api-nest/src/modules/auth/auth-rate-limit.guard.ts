import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { AUTH_RATE_LIMIT_KIND_KEY, AuthRateLimitKind } from './auth-rate-limit.decorator';
import { getClientIp } from './client-ip';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const kind = this.reflector.getAllAndOverride<AuthRateLimitKind>(AUTH_RATE_LIMIT_KIND_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!kind) {
      return true;
    }

    const limit = this.configService.get<number>(`rateLimit.${kind}.limit`);
    const windowSec = this.configService.get<number>(`rateLimit.${kind}.windowSec`);
    if (!limit || !windowSec || limit <= 0 || windowSec <= 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const ip = getClientIp(req);
    const key = `rl:auth:${kind}:${ip}`;

    const result = await this.rateLimitService.consume(key, limit, windowSec);
    if (!result.allowed) {
      res.setHeader('Retry-After', String(Math.max(1, result.retryAfterSec)));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            kind === 'login'
              ? 'Too many login attempts'
              : 'Too many registration attempts',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
