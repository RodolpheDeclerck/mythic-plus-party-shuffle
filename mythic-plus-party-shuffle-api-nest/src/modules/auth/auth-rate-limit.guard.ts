import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { Request, Response } from 'express';
import { AUTH_RATE_LIMIT_KIND_KEY, AuthRateLimitKind } from './auth-rate-limit.decorator';
import { getClientIp } from './client-ip';
import { RateLimitService, RateLimitConsumeResult } from './rate-limit.service';

type LoginPerEmailConfig = { limit: number; windowSec: number };

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

    // IP-bucket (always)
    const ipKey = `rl:auth:${kind}:ip:${ip}`;
    const consumes: Promise<RateLimitConsumeResult>[] = [
      this.rateLimitService.consume(ipKey, limit, windowSec),
    ];

    // Optional per-email bucket on login only.
    if (kind === 'login') {
      const perEmail = this.configService.get<LoginPerEmailConfig>('rateLimit.login.perEmail');
      const rawEmail =
        req.body && typeof req.body === 'object'
          ? (req.body as Record<string, unknown>).email
          : undefined;
      if (
        perEmail &&
        perEmail.limit > 0 &&
        perEmail.windowSec > 0 &&
        typeof rawEmail === 'string' &&
        rawEmail.trim().length > 0
      ) {
        const emailHash = createHash('sha256')
          .update(rawEmail.trim().toLowerCase())
          .digest('hex');
        const emailKey = `rl:auth:login:email:${emailHash}`;
        consumes.push(
          this.rateLimitService.consume(emailKey, perEmail.limit, perEmail.windowSec),
        );
      }
    }

    const results = await Promise.all(consumes);
    const blocked = results.find((r) => !r.allowed);
    if (blocked) {
      const retryAfter = Math.max(
        1,
        ...results.filter((r) => !r.allowed).map((r) => r.retryAfterSec),
      );
      res.setHeader('Retry-After', String(retryAfter));
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
