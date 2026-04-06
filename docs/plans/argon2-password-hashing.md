# Renforcer le hashing des mots de passe (Argon2id)

## État actuel (à corriger)

- Dans [`mythic-plus-party-shuffle-api-nest/src/shared/helpers/index.ts`](../../mythic-plus-party-shuffle-api-nest/src/shared/helpers/index.ts), les mots de passe étaient dérivés via **`crypto.createHmac('sha256', …)`** avec un **`SECRET` fixe `'GMC-REST-API'`** dans les sources.
- Ce n’est **pas** un algorithme de hashing de mot de passe adapté : calcul **trop rapide** pour résister à un brute force hors ligne, et **fuite du dépôt = fuite du secret** utilisé pour tous les anciens hashes.
- **`bcrypt`** était listé dans [`mythic-plus-party-shuffle-api-nest/package.json`](../../mythic-plus-party-shuffle-api-nest/package.json) mais **n’était importé nulle part** dans `src/`.

Les seuls flux qui écrivent/valident le mot de passe sont [`auth.service.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/auth.service.ts) (`login`, `register`).

## Cible technique

- **Argon2id** (recommandation OWASP / usage courant sous Node).
- Dépendance : package **`argon2`** (binaires précompilés Linux x64 en général OK sur Render ; alternative si besoin : **`@node-rs/argon2`**).

Paramètres de référence : mémoire ~19–64 MiB, **time cost** 3, **parallelism** 4.

## Schéma de données (sans migration SQL obligatoire)

- Conserver la colonne **`password`** (varchar 255 suffit pour une chaîne Argon2 encodée).
- Conserver **`salt`** pour les **comptes legacy**. Pour Argon2 : valeur neutre (ex. `''`) — le sel est **inclus** dans la sortie Argon2.

## Détection legacy vs Argon2

- Hashes Argon2 : préfixe **`$argon2`**.
- Legacy : **hex 64 caractères** (SHA-256).

## Comportement

- **`register`** : uniquement **Argon2**.
- **`login`** : si legacy, vérifier puis **ré-écrire** en Argon2 après succès ; si déjà Argon2, `argon2.verify` seulement.

## Fichiers (implémentation)

| Fichier | Rôle |
|---------|------|
| `password-hashing.service.ts` | `hashPassword`, `verify`, Argon2id options |
| `shared/crypto/legacy-password.ts` | Vérification legacy + `isLegacyPasswordHash` |
| `auth.service.ts` | Délégation + upgrade-on-login |
| `auth.module.ts` | Provider `PasswordHashingService` |
| `shared/helpers/index.ts` | Retrait du HMAC mot de passe (garder `random` si besoin) |
| `package.json` + lockfile racine | `argon2`, retrait de `bcrypt` inutilisé |
| README API | Section sécurité mots de passe |

## Hors périmètre

- Réinitialisation globale forcée des mots de passe.
- Migration SQL lourde (nullable sur `salt`).

## Risque résiduel

- Comptes qui ne se connectent jamais gardent un hash legacy jusqu’au prochain login réussi.
