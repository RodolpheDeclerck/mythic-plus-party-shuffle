# 08 — Renommer la valeur d'enum SQL `Demon Hunter` en `DemonHunter`

**Fichier :** `docs/plans/08-rename-demon-hunter-enum.md`

## Problème

Le schéma Prisma déclarait :

```prisma
enum CharacterClass {
  ...
  Demon_Hunter @map("Demon Hunter")
  ...
}
```

Avec `@map`, le client Prisma TypeScript attend l'identifiant DSL **`Demon_Hunter`**
(et le traduit en `'Demon Hunter'` côté SQL). Le frontend, lui, envoyait
directement la chaîne **`'Demon Hunter'`** (qui correspond à la valeur SQL,
pas au nom DSL TS). Conséquences observées en prod :

1. **Création KO** — `prisma.character.create({ data: { characterClass: 'Demon Hunter' } })`
   échouait avec `PrismaClientValidationError: Invalid value for argument
   characterClass. Expected CharacterClass.`
2. **Couleur KO dans l'UI** — à la lecture, Prisma renvoyait `'Demon_Hunter'`
   au frontend. Les color maps (`eventClassColors.ts`, `CharacterClassColours.ts`,
   `classNameHelper.ts`) ne contenaient que la clé `'Demon Hunter'` → fallback
   `text-foreground` (gris) au lieu du violet `#A330C9`.

## Pattern de référence : Death Knight

Le cas **Death Knight** est déjà géré proprement dans le code :

- BDD / enum Prisma : `'Deathknight'` (sans espace, sans `@map`).
- Frontend : utilise `'Death Knight'` comme label affiché.
- Frontière API : [`mythic-plus-party-shuffle-ui/app/utils/characterClassApiMap.ts`](../../mythic-plus-party-shuffle-ui/app/utils/characterClassApiMap.ts)
  fournit `toApiCharacterClass()` / `toDisplayCharacterClass()` pour traduire
  label UI ↔ valeur enum, appelés dans
  [`eventPartyModel.ts`](../../mythic-plus-party-shuffle-ui/app/components/EventView/eventPartyModel.ts).

Ce plan applique exactement le même pattern à Demon Hunter.

## Changements

### Backend

| Fichier | Changement |
|---------|------------|
| `mythic-plus-party-shuffle-api-nest/prisma/schema.prisma` | `Demon_Hunter @map("Demon Hunter")` → `DemonHunter` |
| `mythic-plus-party-shuffle-api-nest/prisma/migrations/20260419_rename_demon_hunter_enum/migration.sql` | `ALTER TYPE "character_characterclass_enum" RENAME VALUE 'Demon Hunter' TO 'DemonHunter';` |
| `mythic-plus-party-shuffle-api-nest/src/shared/data/characterClassDetails.data.ts` | `CharacterClass.Demon_Hunter` → `CharacterClass.DemonHunter` |

### Frontend

| Fichier | Changement |
|---------|------------|
| `mythic-plus-party-shuffle-ui/app/utils/characterClassApiMap.ts` | Ajoute `'Demon Hunter' ↔ 'DemonHunter'` dans les deux maps |
| `mythic-plus-party-shuffle-ui/app/utils/characterClassApiMap.test.ts` | Tests Jest : mapping aller-retour pour DH et DK |

Aucun autre fichier frontend n'a besoin d'être touché : le reste du code
continue d'utiliser `'Demon Hunter'` comme label/clé d'affichage, ce qui est
cohérent avec le traitement existant de Death Knight.

## Migration SQL

`ALTER TYPE ... RENAME VALUE` est :
- **transactionnel** et atomique en PostgreSQL ≥ 10 ;
- **non destructif** : les colonnes existantes utilisant cette valeur
  référencent automatiquement le nouveau nom ;
- **rétro-incompatible** côté code : tout client encore en mémoire qui
  écrirait `'Demon Hunter'` après la migration recevrait une erreur enum
  invalide. Le déploiement code + migration doit donc être atomique
  (Render redéploie l'API avec la nouvelle migration et le nouveau code
  ensemble).

## Tests

- `npx jest` dans `mythic-plus-party-shuffle-ui/` doit passer, dont les
  nouveaux tests de `characterClassApiMap.test.ts`.
- Vérification manuelle après déploiement : créer un personnage Demon
  Hunter dans l'UI, vérifier qu'il apparaît avec la couleur violette
  `#A330C9`.

## Hors scope

- Refactoring pour unifier les patterns DK/DH dans une fonction unique
  (label ↔ enum) — le découplage actuel reste lisible.
- Renommage de l'enum frontend `CharacterClass.DemonHunter = 'Demon Hunter'`
  — la valeur `'Demon Hunter'` reste cohérente avec le label UI et avec le
  mapping de la frontière API.
