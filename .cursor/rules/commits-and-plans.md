---
description: Commit body with Cursor plans; update project docs when behavior or setup changes
alwaysApply: true
---

# Commits, plans et documentation

## Plans Cursor dans le message de commit

Quand une tâche a été menée à partir d’un **plan** généré dans Cursor (fichier sous `.cursor/plans/` ou équivalent) :

1. **Versionner le plan dans le dépôt par défaut** : copier le contenu utile du plan (sans le frontmatter YAML Cursor `--- … ---` si présent) dans [`docs/plans/`](../../docs/plans/) sous un nom stable **`NN-kebab-case.md`** (numéro séquentiel sur 2 chiffres + tirets ; voir [`docs/plans/README.md`](../../docs/plans/README.md)), **dans le même commit** que le code — sauf si l’utilisateur dit explicitement de ne pas le faire.

2. **Inclure dans le corps du message de commit** (après une ligne vide sous le sujet `type(scope): …`) :
   - une ligne **`Plan:`** avec le **titre** ou le **nom du fichier** du plan ;
   - **2 à 5 puces** reprenant le périmètre ou les décisions principales du diff ;
   - une puce ou ligne avec le **chemin** du fichier sous `docs/plans/` (ex. `docs/plans/02-auth-rate-limiting.md`).

3. Si le plan n’a **pas** été copié dans le dépôt (exception demandée par l’utilisateur), garder quand même **`Plan:`** + puces ; ne pas inventer de chemin.

4. **Exemple :**

```text
feat(ui): session via cookie httpOnly sans JWT en JSON

Plan: auth_cookie-only session (docs/plans/03-auth-cookie-session.md)
- Nest: plus de token dans le body login/register; logout sans JwtAuthGuard.
- UI: axios.defaults.withCredentials; suppression authToken / intercepteur Bearer.
- README: note sécurité mise à jour.
```

5. Petits correctifs sans plan : pas d’obligation sur la ligne `Plan:` ni sur `docs/plans/`.

## Documentation du projet dans le même commit

Quand le changement **modifie le comportement**, la **config**, le **déploiement** ou l’**architecture** perçue par un contributeur :

- **Mettre à jour la doc versionnée** dans le **même commit** (ou explicitement dans le corps du commit si reporté : `Docs: à suivre` — à éviter).
- Cibler au minimum :
  - [`mythic-plus-party-shuffle-ui/README.md`](../../mythic-plus-party-shuffle-ui/README.md) (env, auth, Render, stack) pour tout ce qui touche le front ;
  - [`mythic-plus-party-shuffle-api-nest/README.md`](../../mythic-plus-party-shuffle-api-nest/README.md) (si présent et pertinent) pour l’API ;
  - [`render.yaml`](../../render.yaml), scripts `scripts/render-*.sh`, ou [`docs/`](../../docs/) si les étapes de déploiement changent ;
  - [`ARCHITECTURE.md`](../../mythic-plus-party-shuffle-ui/ARCHITECTURE.md) seulement si les flux applicatifs décrits changent.

**Pas obligatoire** pour : typo, refactor interne sans effet visible, correction de test seul.

## Tests

Chaque PR qui ajoute ou modifie du comportement **doit** inclure des tests unitaires couvrant les changements :

- **Nouvelles fonctions / hooks** : tests couvrant les cas nominaux, les cas limites et les cas d'erreur.
- **Fonctions modifiées** : mettre à jour les tests existants pour refléter le nouveau comportement ; ajouter des cas pour les nouveaux chemins de code.
- **Convention** : utiliser le pattern existant (Jest, factories inline, `describe`/`it`, pas de `test()`).
- **Vérifier** que tous les tests passent (`npx jest`) avant de créer le commit.

## Index des plans (`docs/plans/README.md`)

Quand un nouveau plan est ajouté dans `docs/plans/` :

- **Ajouter une ligne** dans le tableau de [`docs/plans/README.md`](../../docs/plans/README.md) avec le numéro, le lien et le sujet.
- Utiliser le **numéro séquentiel suivant** (ex. `05`, `06`, …).

## Checklist PR

Avant de finaliser une PR, vérifier que **tous** les éléments suivants sont à jour dans le même commit (ou la même branche) :

1. **Tests** : ajoutés/mis à jour, tous passent.
2. **Plan** : fichier `docs/plans/NN-*.md` créé si changement non trivial.
3. **Index des plans** : `docs/plans/README.md` mis à jour.
4. **Architecture** : [`ARCHITECTURE.md`](../../mythic-plus-party-shuffle-ui/ARCHITECTURE.md) mis à jour si les flux ou le modèle de données changent.
5. **README** : mis à jour si la config, le déploiement ou le comportement visible changent.

Référence humaine : [docs/COMMITS.md](../../docs/COMMITS.md).
