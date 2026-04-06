---
description: Commit body with Cursor plans; update project docs when behavior or setup changes
alwaysApply: true
---

# Commits, plans et documentation

## Plans Cursor dans le message de commit

Quand une tâche a été menée à partir d’un **plan** généré dans Cursor (fichier sous `.cursor/plans/` ou équivalent) :

1. **Inclure dans le corps du message de commit** (après une ligne vide sous le sujet `type(scope): …`) :
   - une ligne **`Plan:`** avec le **titre** ou le **nom du fichier** du plan ;
   - **2 à 5 puces** reprenant le périmètre ou les décisions principales du plan.

2. Si le plan est **versionné** dans le dépôt (ex. `docs/plans/`), ajouter le **chemin** du fichier dans le corps du commit.

3. **Exemple :**

```text
feat(ui): session via cookie httpOnly sans JWT en JSON

Plan: auth_cookie-only session
- Nest: plus de token dans le body login/register; logout sans JwtAuthGuard.
- UI: axios.defaults.withCredentials; suppression authToken / intercepteur Bearer.
- README: note sécurité mise à jour.
```

4. Petits correctifs sans plan : pas d’obligation sur la ligne `Plan:`.

## Documentation du projet dans le même commit

Quand le changement **modifie le comportement**, la **config**, le **déploiement** ou l’**architecture** perçue par un contributeur :

- **Mettre à jour la doc versionnée** dans le **même commit** (ou explicitement dans le corps du commit si reporté : `Docs: à suivre` — à éviter).
- Cibler au minimum :
  - [`mythic-plus-party-shuffle-ui/README.md`](../../mythic-plus-party-shuffle-ui/README.md) (env, auth, Render, stack) pour tout ce qui touche le front ;
  - [`mythic-plus-party-shuffle-api-nest/README.md`](../../mythic-plus-party-shuffle-api-nest/README.md) (si présent et pertinent) pour l’API ;
  - [`render.yaml`](../../render.yaml), scripts `scripts/render-*.sh`, ou [`docs/`](../../docs/) si les étapes de déploiement changent ;
  - [`ARCHITECTURE.md`](../../mythic-plus-party-shuffle-ui/ARCHITECTURE.md) seulement si les flux applicatifs décrits changent.

**Pas obligatoire** pour : typo, refactor interne sans effet visible, correction de test seul.

Référence humaine : [docs/COMMITS.md](../../docs/COMMITS.md).
