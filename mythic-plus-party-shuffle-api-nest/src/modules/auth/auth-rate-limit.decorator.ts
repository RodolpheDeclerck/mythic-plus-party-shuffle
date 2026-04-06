import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMIT_KIND_KEY = 'authRateLimitKind';

export type AuthRateLimitKind = 'login' | 'register';

export const AuthRateLimit = (kind: AuthRateLimitKind) =>
  SetMetadata(AUTH_RATE_LIMIT_KIND_KEY, kind);
