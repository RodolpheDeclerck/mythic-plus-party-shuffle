# 05 — Helmet, politique de mot de passe, rate-limit par email

**Fichier :** `docs/plans/05-auth-hardening-helmet-password-policy.md`

## Objectif

Durcir la couche d'authentification après les plans 01 → 04 :

1. Ajouter des **headers HTTP de sécurité** via Helmet.
2. Imposer une **politique de mot de passe** (≥10 chars, 3 classes / 4, blocklist locale, HIBP optionnel) appliquée **uniformément** à `register`, `login` et `change-password`.
3. Compléter le rate-limit IP de `/auth/login` par un **bucket par email haché** pour bloquer le credential-stuffing distribué.

Pas de migration DB. Compatibilité legacy explicitement abandonnée — un seul utilisateur en base aujourd'hui (le propriétaire), reset manuel/curl prévu.

## Implémentation (référence code)

- **Helmet** : [`main.ts`](../../mythic-plus-party-shuffle-api-nest/src/main.ts) — `app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))` avant `cookieParser` et CORS. CSP désactivée car l'API ne sert que du JSON.
- **Policy** : [`password-policy.service.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/password-policy.service.ts) (nouveau)
  - `validateSync(plain)` : longueur, classes, blocklist locale ([`common-passwords.data.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/common-passwords.data.ts)).
  - `validate(plain)` : `validateSync` puis HIBP **k-anonymity** si `AUTH_HIBP_CHECK=true` (timeout 2 s, fail-open sur erreur réseau).
  - Message d'erreur **générique** (`Password does not meet security requirements`) — pas de leak sur la règle exacte.
- **DTO** : [`register.dto.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/dto/register.dto.ts) → `@MinLength(10)`. Nouveau [`change-password.dto.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/dto/change-password.dto.ts).
- **Service** : [`auth.service.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/auth.service.ts)
  - `register()` → `await passwordPolicyService.validate(password)` avant `findOne` (évite leak email via timing).
  - `login()` → après `argon2.verify`, `validateSync(password)`. Si non conforme, **403** avec `code: password_policy_outdated` (distinct du 401 normal). Aucun cookie, aucun token.
  - Nouvelle méthode `changePassword(userId, current, new)` : vérifie `current`, `validate(new)` (HIBP inclus), re-hash Argon2id.
- **Controller** : [`auth.controller.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/auth.controller.ts) → nouvelle route `POST /auth/change-password`, protégée par `@UseGuards(JwtAuthGuard)`. Pas de rate-limit dédié (déjà authentifié).
- **Module** : [`auth.module.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/auth.module.ts) → provider `PasswordPolicyService`.
- **Guard rate-limit** : [`auth-rate-limit.guard.ts`](../../mythic-plus-party-shuffle-api-nest/src/modules/auth/auth-rate-limit.guard.ts)
  - Renommage des clés Redis : `rl:auth:{kind}:<ip>` → `rl:auth:{kind}:ip:<ip>` (cohérent, ouvre la place au sous-namespace `email`).
  - Pour `kind === 'login'` avec un `body.email` non vide : ajout d'une seconde clé `rl:auth:login:email:<sha256(emailLower)>`. Les deux buckets sont consommés en parallèle ; **l'un OU l'autre** déclenche un 429. `Retry-After` = `max(ttlIp, ttlEmail)`.
  - Email haché en SHA-256 lowercased/trimmed — jamais stocké en clair dans Redis.
- **Config** : [`configuration.ts`](../../mythic-plus-party-shuffle-api-nest/src/config/configuration.ts) — nouvelles sections `passwordPolicy`, `rateLimit.login.perEmail`.

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `AUTH_HIBP_CHECK` | `false` | Active la vérification HIBP au register/change-password. |
| `AUTH_HIBP_TIMEOUT_MS` | `2000` | Timeout (ms) pour l'appel HIBP. Fail-open au-delà. |
| `AUTH_LOGIN_EMAIL_RL_LIMIT` | `5` | Limite par email/fenêtre sur `/auth/login`. |
| `AUTH_LOGIN_EMAIL_RL_WINDOW_SEC` | `900` | Fenêtre du bucket email (15 min). |

## Impact utilisateur

Un seul compte existe en base (propriétaire). Si son mot de passe actuel n'est pas conforme à la nouvelle policy, le prochain `POST /auth/login` retourne **403** avec `code: password_policy_outdated`. Procédure de sortie :

1. **Reset DB** manuel : `UPDATE users SET password = '<argon2id-hash>' WHERE id = 1;` puis re-login → `POST /auth/change-password` pour passer à un mdp choisi.
2. **Sinon** : le hash Argon2id peut être généré localement avec un petit script Node (`argon2.hash('NewPassword!', { type: argon2.argon2id, memoryCost: 19456, timeCost: 3, parallelism: 4 })`).

## Hors périmètre

- Vérification d'email à l'inscription (→ plan 06)
- Reset par lien email (→ plan 07 — `change-password` n'est qu'un stopgap authentifié)
- Refresh tokens / révocation
- CSRF token sur les routes mutantes
- 2FA TOTP
- UI front pour `change-password`
