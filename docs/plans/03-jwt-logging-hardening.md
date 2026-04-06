# 03 — Retirer les logs sensibles JWT (Nest)

**Fichier :** `docs/plans/03-jwt-logging-hardening.md`

## Objectif

Éviter toute fuite de secrets (JWT, cookies) dans les logs ; réduire le bruit sur les requêtes authentifiées réussies.

## Changements

- [`jwt-auth.guard.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/guards/jwt-auth.guard.ts) : `Logger` Nest, `warn` avec raison + `method` + `path` uniquement ; plus de cookies ni `Authorization` ; plus de log de succès.
- [`jwt.strategy.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/strategies/jwt.strategy.ts) : extracteurs silencieux ; pas de log du payload JWT ; `warn` si payload invalide ou utilisateur absent (id numérique seulement) ; `debug` succès uniquement en `development`.

## Hors périmètre

- Autres `console.log` du monorepo API (party, event, websocket, etc.).
