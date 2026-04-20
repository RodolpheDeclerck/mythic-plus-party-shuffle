# 10 — Majors reportés (backlog)

**Fichier :** `docs/plans/10-major-upgrades-deferred.md`

Suivi des bumps majors de dépendances fermés lors du tri initial Dependabot (2026-04-19). Chacun nécessite un travail dédié — à traiter quand on a le budget pour lire les changelogs, tester, et potentiellement adapter du code.

## Entrées

### Next.js 14 → 16

- **PR Dependabot (fermée)** : [#20](https://github.com/RodolpheDeclerck/mythic-plus-party-shuffle/pull/20)
- **Dépendance liée** : `@next/swc-linux-x64-gnu` (PR [#14](https://github.com/RodolpheDeclerck/mythic-plus-party-shuffle/pull/14), fermée aussi)
- **Contexte** : on est sur `next@14.2`. Next 15 et Next 16 ont chacun apporté leurs breaking changes :
  - Next 15 : `fetch` caching désactivé par défaut, `cookies()`/`headers()`/`params`/`searchParams` asynchrones, React 19 requis.
  - Next 16 : impacts App Router complémentaires, dépréciations supplémentaires.
- **Ce qu'il faudra faire** :
  1. Upgrader React à 19 (dépendance dure de Next 15+).
  2. Traverser toutes les Server Components qui utilisent `cookies()`, `headers()`, ou des dynamic params, les passer en `await`.
  3. Re-auditer la stratégie de cache `fetch` (plus de cache implicite).
  4. Vérifier que le proxy `app/api/be/[[...path]]/route.ts` fonctionne toujours.
  5. Re-générer `@next/swc-*` via `npm install`.
- **Risque** : le projet fait du App Router + API routes + WebSocket — surface d'impact large.

### @auth0/nextjs-auth0 3 → 4

- **PR Dependabot (fermée)** : [#21](https://github.com/RodolpheDeclerck/mythic-plus-party-shuffle/pull/21)
- **Contexte** : migration majeure — nouvelle API, nouveau middleware, nouveau modèle de session.
- **Ce qu'il faudra faire** :
  1. Suivre le [Migration Guide v3→v4 officiel](https://github.com/auth0/nextjs-auth0/blob/main/V4_MIGRATION_GUIDE.md).
  2. Réécrire `app/api/auth/[auth0]/route.ts` selon la nouvelle convention middleware.
  3. Adapter `app/context/AuthContext.tsx` et `app/providers.tsx` (nouveaux hooks/Providers).
  4. Vérifier l'intégration Battle.net OAuth (cf. plan 07).
  5. Re-tester tous les flux : login, logout, callback, refresh, session persistence.
- **Risque** : impact auth global. À coupler avec #20 si on décide de toucher React/Next en même temps.

### @types/node 20 → 25

- **PR Dependabot (fermée)** : [#18](https://github.com/RodolpheDeclerck/mythic-plus-party-shuffle/pull/18)
- **Contexte** : le projet cible Node 20 (`"engines": { "node": ">=20" }` dans le root `package.json`, `node-version: '20'` en CI). `@types/node@25` correspond à Node 25 — aligner les types sur une version plus récente que le runtime introduit des API typées qui n'existent pas à l'exécution.
- **Ce qu'il faudra faire** : aligner types et runtime — soit bumper Node en CI + Render, soit rester sur `@types/node@20`. À traiter quand on décide de bumper Node.
- **Risque** : faible mais trompeur (bugs uniquement à runtime, invisibles en type-check).

## Quand re-ouvrir

Quand l'un de ces sujets devient prioritaire, créer un plan dédié (`11-next-16-upgrade.md`, `12-auth0-v4-migration.md`, etc.), rouvrir la PR Dependabot si elle existe encore, ou demander à Dependabot de regénérer via un commentaire `@dependabot reopen` sur l'ancienne.
