# 06 — Migration TypeORM → Prisma

**Fichier :** `docs/plans/06-typeorm-to-prisma.md`

## Contexte

TypeORM en place avec `synchronize: false` et migrations SQL manuelles. Prisma offre un meilleur DX (schema déclaratif, migrations auto, types générés). Prérequis au plan 07 (Auth0 + Battle.net).

## Changements

### Schema Prisma (`prisma/schema.prisma`)
- 4 models : `User`, `Event`, `Character`, `EventAdmin` (join table explicite)
- 3 enums mappés sur les types PostgreSQL existants : `CharacterClass`, `Role`, `Specialization`
- `DemonHunter @map("Demon Hunter")` pour gérer l'espace dans la valeur DB
- FK Character → Event sur `code` (pas `id`)
- Baseline migration (`0_init`) sans DDL — DB existante marquée comme baseline

### PrismaService + PrismaModule
- `PrismaService` extends `PrismaClient` avec `OnModuleInit`/`OnModuleDestroy`
- `PrismaModule` global (`@Global()`) — disponible dans tous les modules

### Services convertis
- `PartyService` : suppression `@InjectRepository(Character)` inutilisé
- `UserService` : `prisma.user.findUnique/create/update/delete` avec `select` explicite
- `AuthService` : même pattern, garde la logique JWT et password hashing
- `CharacterService` : `prisma.character.create/update/updateMany`, gestion relations via `eventCode`
- `EventService` : `eventInclude` réutilisable remplace `eager: true`, helper `flattenAdmins()` pour transformer `EventAdmin[] → User[]`
- `EventAdminGuard` : query directe sur `EventAdmin.userId`

### @BeforeInsert remplacé
- Génération `code = uuidv4().substring(0,8)` + `expiresAt = now+7j` déplacée dans `EventService.createEvent()`

### Enums migrés
- Imports basculés de `shared/enums/*.enum.ts` vers `generated/prisma/client`
- `Role.Tank` → `Role.TANK`, `Role.Heal` → `Role.HEAL`, `Role.DPS_CAC` → `Role.CAC`, `Role.DPS_DIST` → `Role.DIST`

### Fichiers supprimés
- `shared/entities/user.entity.ts`, `event.entity.ts`, `character.entity.ts`
- `shared/enums/characterClass.enum.ts`, `role.enum.ts`, `specialization.enum.ts`
- `migrations/1743785751000-AddDemonHunterDevourerSpecialization.ts`
- `party.entity.ts` conservé (plain class Redis-only)

### Dépendances
- Ajout : `@prisma/client`, `prisma` (dev), `uuid`, `@types/uuid`
- Suppression : `typeorm`, `@nestjs/typeorm`
