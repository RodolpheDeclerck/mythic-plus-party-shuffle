# Plans d’implémentation (`docs/plans`)

Index des plans versionnés avec le code. **Convention de nom :** `NN-titre-en-kebab-case.md` (`NN` = ordre chronologique dans ce dossier, sur 2 chiffres).

| # | Fichier | Sujet |
|---|---------|--------|
| 01 | [01-argon2-password-hashing.md](01-argon2-password-hashing.md) | Argon2id, migration des hashes legacy, upgrade au login |
| 02 | [02-auth-rate-limiting.md](02-auth-rate-limiting.md) | Rate limit Redis sur `POST /auth/login` et `/auth/register`, `trust proxy` |
| 03 | [03-jwt-logging-hardening.md](03-jwt-logging-hardening.md) | Logs JWT : pas de cookies / headers / payload ; Logger Nest |
| 04 | [04-api-console-to-logger.md](04-api-console-to-logger.md) | Remplacer `console.*` restant par `Logger` (party, event, WS, bootstrap) |
| 05 | [05-generic-party-slots.md](05-generic-party-slots.md) | Slots de groupe generiques, drag & drop cross-role, double-clic edit, sync roles |
| 06 | [06-typeorm-to-prisma.md](06-typeorm-to-prisma.md) | Migration TypeORM → Prisma (schema, services, enums, cleanup) |
| 07 | [07-auth0-battlenet-migration.md](07-auth0-battlenet-migration.md) | Auth0 + Battle.net OAuth, suppression auth custom |
| 08 | [08-rename-demon-hunter-enum.md](08-rename-demon-hunter-enum.md) | Renommer enum SQL `Demon Hunter` → `DemonHunter`, fix création + couleur DH |
| 09 | [09-ci-hardening.md](09-ci-hardening.md) | Durcir la CI : couverture, typecheck, Prettier check, Prisma validate, Dependabot, CodeQL, Sonar, E2E |
| 10 | [10-major-upgrades-deferred.md](10-major-upgrades-deferred.md) | Backlog des bumps majors reportés (Next 14→16, Auth0 3→4, @types/node 20→25) |
| 11 | [11-fix-character-fetch-retry.md](11-fix-character-fetch-retry.md) | Retry auto + reset errorState sur la liste des participants (erreur intermittente après inscription) |

**Nouveau plan :** utiliser le numéro suivant (ex. `05-nom-du-plan.md`) et ajouter une ligne dans ce tableau.

Dans les messages de commit, citer le chemin complet (ex. `docs/plans/02-auth-rate-limiting.md`). Voir [docs/COMMITS.md](../COMMITS.md).
