# 04 — Remplacer `console.*` par `Logger` Nest (hors JWT)

**Fichier :** `docs/plans/04-api-console-to-logger.md`

## Objectif

Supprimer les `console.log` / `warn` / `error` dans l’API Nest (sauf déjà couvert par le plan 03 JWT) ; utiliser le **`Logger`** de `@nestjs/common`, limiter les dumps de données au niveau **`debug`**.

## Fichiers touchés

- [`main.ts`](../../mythic-plus-party-shuffle-api-nest/src/main.ts) — bootstrap
- [`party.controller.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/party/party.controller.ts), [`party.service.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/party/party.service.ts)
- [`character.controller.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/character/character.controller.ts)
- [`event.controller.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/event/event.controller.ts), [`event.service.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/event/event.service.ts)
- [`websocket.gateway.ts`](../../mythic-plus-party-shuffle-api-nest/src/shared/websocket/websocket.gateway.ts), [`socket-io.adapter.ts`](../../mythic-plus-party-shuffle-api-nest/src/shared/websocket/socket-io.adapter.ts)

## Règles

- Pas de corps de requête / gros JSON en **`log`** en prod : **`debug`** pour le détail.
- Erreurs : **`logger.error(message, stack)`** quand pertinent.
- CORS / connexions WebSocket : **`warn`** / **`log`** courts sans secrets.

## Hors périmètre

- Plan 03 (`JwtStrategy` / `JwtAuthGuard`) déjà traité séparément.
