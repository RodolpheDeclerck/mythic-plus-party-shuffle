# 07 — Migration Auth0 + Battle.net OAuth (Universal Login)

**Fichier :** `docs/plans/07-auth0-battlenet-migration.md`

## Contexte

Remplacement de l'auth custom (JWT symétrique + email/password + Argon2) par Auth0 avec Battle.net OAuth uniquement. Prépare l'ouverture de l'outil à d'autres utilisateurs avec une intégration native WoW.

## Changements

### Backend
- **JWT Strategy** : JWKS RS256 via `jwks-rsa` (provider-agnostic) remplace JWT symétrique
- **AuthService** : `findOrCreateByOidcSub()` remplace login/register/verifyToken
- **AuthController** : simplifié à `GET /auth/me` + `POST /auth/logout`
- **User entity** : ajout `oidcSub` (unique), `password`/`salt` nullable, suppression `sessionToken`
- **Supprimé** : PasswordHashingService, legacy-password, DTOs login/register/verify-token, argon2, @nestjs/jwt

### Frontend
- **Auth0 SDK** : `@auth0/nextjs-auth0` avec route handler `api/auth/[auth0]`
- **AuthContext** : wrapper de compatibilité autour de `useUser()` Auth0
- **Proxy BFF** : injecte Bearer token Auth0 via `getAccessToken()`
- **Login** : bouton "Se connecter avec Battle.net" (Universal Login)
- **Supprimé** : LoginForm, RegisterForm, forgot-password, formulaires email/password

### Config
- Backend : `AUTH_ISSUER_BASE_URL`, `AUTH_AUDIENCE` (provider-agnostic, 2 vars à changer pour migrer)
- Frontend : `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`, `AUTH0_SCOPE`
