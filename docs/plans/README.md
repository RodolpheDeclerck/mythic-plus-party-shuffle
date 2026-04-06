# Plans d’implémentation (`docs/plans`)

Index des plans versionnés avec le code. **Convention de nom :** `NN-titre-en-kebab-case.md` (`NN` = ordre chronologique dans ce dossier, sur 2 chiffres).

| # | Fichier | Sujet |
|---|---------|--------|
| 01 | [01-argon2-password-hashing.md](01-argon2-password-hashing.md) | Argon2id, migration des hashes legacy, upgrade au login |
| 02 | [02-auth-rate-limiting.md](02-auth-rate-limiting.md) | Rate limit Redis sur `POST /auth/login` et `/auth/register`, `trust proxy` |

**Nouveau plan :** utiliser le numéro suivant (ex. `03-nom-du-plan.md`) et ajouter une ligne dans ce tableau.

Dans les messages de commit, citer le chemin complet (ex. `docs/plans/02-auth-rate-limiting.md`). Voir [docs/COMMITS.md](../COMMITS.md).
