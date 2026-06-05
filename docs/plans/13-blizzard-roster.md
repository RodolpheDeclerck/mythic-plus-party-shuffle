# 13 — Inscription via le roster Battle.net (Blizzard + Token Vault)

**Fichier :** `docs/plans/13-blizzard-roster.md`

> Change OpenSpec associée : [`openspec/changes/replace-character-form-with-blizzard-roster`](../../openspec/changes/replace-character-form-with-blizzard-roster) (proposal / design / specs / tasks).

## État actuel (à faire évoluer)

- L'inscription à un événement se fait via un **formulaire manuel** (`EventRegisterForm`) : le joueur ressaisit nom, classe, spé, item level, clés — données qui existent déjà sur son compte Battle.net.
- L'authentification passe par **Auth0 (OIDC)** ; le tenant expose désormais le **Token Vault** (Connected Accounts) pour Battle.net.
- `Character` n'a aucun lien `userId` ; il est juste rattaché à un `Event`. Inchangé par cette change.

## Cible

Un **aiguillage (join gate)** à l'inscription :

- **Loggé** → **picker** : la liste des persos WoW du joueur, sélection → champs auto-remplis → rejoint l'événement.
- **Non loggé** → écran **« Se connecter Battle.net » / « Rejoindre en invité »** ; l'invité garde le **formulaire manuel inchangé**.

Les deux chemins réutilisent le contrat existant `POST /api/characters` (aucune migration SQL).

## Décisions

- **Token Vault** : le backend échange l'**access token Auth0 entrant** contre un token Battle.net fédéré via `{issuer}/oauth/token` (grant `token-exchange:federated-connection-access-token`). Auth0 stocke et rafraîchit le token Blizzard ; on ne persiste rien.
- **Mapping par IDs Blizzard** (locale-indépendants) : `class_id` / `spec_id` → enums Prisma. Règle la collision « Frost » (Mage 64 vs Death Knight 251).
- **Région US / Retail (The War Within)** pour l'instant ; la région est une seule valeur de config.
- **Enrichissement à la sélection** : la liste est légère (nom/royaume/classe/niveau) ; ilvl + spé via le *Character Profile Summary* uniquement au clic.
- **iLevel** : bornes élargies à **600–700** (tiers 675/650/625) pour ne pas écraser les vraies valeurs.
- **Keystones** : pas d'éditeur dans le picker ; valeurs par défaut **2–15** (`KEYSTONE_DEFAULT_MIN/MAX`).
- **rôle / bloodlust / battleRez** : dérivés (côté serveur à la création, côté client pour l'affichage) — inchangé.

## Architecture

```
  User loggé (Auth0) ──┐
                       ▼  GET /api/be/api/blizzard/characters (Bearer forwardé par le proxy)
  EventRegisterGate ──▶ BlizzardCharacterPicker ──▶ NestJS BlizzardController
        │ guest                                         │
        ▼                                               ▼ TokenVaultService (échange /oauth/token)
  EventRegisterForm (manuel)                            ▼ BlizzardService (Account/Character Profile)
        │                                               ▼ mapping IDs → enums
        └──────────────▶ POST /api/characters ◀─────────┘ (auto-rempli, keystones par défaut)
```

## Fichiers (implémentation)

| Fichier | Rôle |
|---------|------|
| `api-nest/src/modules/blizzard/token-vault.service.ts` | Échange Token Vault + cache par user + erreur not-linked |
| `api-nest/src/modules/blizzard/blizzard-id-maps.ts` | Tables `class_id`/`spec_id` → enums Prisma |
| `api-nest/src/modules/blizzard/blizzard.service.ts` | Roster (Account Summary) + enrich (Character Summary) + `mapToCharacter` |
| `api-nest/src/modules/blizzard/blizzard.controller.ts` | `GET /api/blizzard/characters` + `/:realm/:name`, `JwtAuthGuard` |
| `api-nest/src/modules/blizzard/errors.ts` | `BattlenetNotLinkedException` (409), `UnmappableBlizzardCharacterException` (502) |
| `ui/app/lib/blizzard/blizzardClient.ts` + `hooks/useBlizzardRoster.ts` | Client `/api/be` + détection not-linked |
| `ui/app/event/register/EventRegisterGate.tsx` | Aiguillage loggé/invité |
| `ui/app/event/register/EventJoinChoice.tsx` | Écran login / invité |
| `ui/app/event/register/BlizzardPicker/*` | Picker, utils (couleur/rôle/buffs), `useBlizzardJoin` |
| `ui/app/constants/itemLevels.ts` | Bornes iLevel élargies + tiers |

## Tests

- Backend : token exchange (succès, cache, refresh, not-linked, erreurs), mapping (roster, enrich, Frost Mage/DK, IDs inconnus, roster vide), controller (auth, list, enrich, not-linked). Suite complète **152 verts**.
- UI : `blizzardClient` (not-linked, encodage URL), `blizzardPickerUtils` (couleur/rôle/buffs), bornes iLevel + tiers. Suite complète **106 verts**.

## Reste à faire (hors code — propriétaire)

- **Auth0 dashboard** : connexion Battle.net en *Connected Accounts for Token Vault* (`wow.profile`) ; **Custom API Client** autorisé au grant token-exchange ; flux d'enrôlement Connected Accounts.
- Confirmer l'**URL d'enrôlement** réelle (`buildLinkBattlenetUrl`) et que l'**access token** est accepté comme `subject_token` dans le tenant.
- **E2E manuel** : (a) loggé : lier → lister → sélectionner → enrichir → rejoindre ; (b) invité : formulaire manuel.
