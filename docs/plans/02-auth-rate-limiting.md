# 02 — Rate limiting sur login / register (Nest)

**Fichier :** `docs/plans/02-auth-rate-limiting.md`

## Objectif

Limiter `POST /auth/login` et `POST /auth/register` par **IP client** avec Redis (fenêtre fixe), limites configurables par variables d’environnement, et **`trust proxy`** en production pour une IP correcte derrière Render.

## Implémentation (référence code)

- Config : [`mythic-plus-party-shuffle-api-nest/src/config/configuration.ts`](../../mythic-plus-party-shuffle-api-nest/src/config/configuration.ts) — `rateLimit.login` / `rateLimit.register`.
- Bootstrap : [`main.ts`](../../mythic-plus-party-shuffle-api-nest/src/main.ts) — `trust proxy` si `NODE_ENV === 'production'`.
- Service : [`rate-limit.service.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/rate-limit.service.ts) — `consume(key, limit, windowSec)`.
- IP : [`client-ip.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/client-ip.ts) — `X-Forwarded-For` puis `req.ip`.
- Guard + décorateur : [`auth-rate-limit.guard.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/auth-rate-limit.guard.ts), [`auth-rate-limit.decorator.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/auth-rate-limit.decorator.ts).
- Contrôleur : [`auth.controller.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/auth.controller.ts) — `@AuthRateLimit` + `@UseGuards(AuthRateLimitGuard)` sur login/register uniquement.

## Défauts

- Login : 10 requêtes / 900 s.
- Register : 5 requêtes / 3600 s.

## Hors périmètre

- Rate limit par email en plus de l’IP.
- `@nestjs/throttler` (alternative possible plus tard).
