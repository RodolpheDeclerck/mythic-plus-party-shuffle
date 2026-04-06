# Messages de commit et plans Cursor

Pour les changements **structurants** ou **multi-fichiers** menés à partir d’un plan généré dans Cursor (souvent sous `.cursor/plans/*.md` ou équivalent) :

## Corps du commit

Après le sujet au format Conventional Commits (`feat(ui): …`), **laisser une ligne vide**, puis :

1. Une ligne **`Plan:`** avec le **titre** du plan ou le **nom du fichier** (ex. `Plan: auth_cookie-only session`).
2. **Quelques puces** (2 à 5) qui résument le périmètre réel du diff : fichiers / comportements touchés, pas tout le roman du plan.

Si une copie du plan est **versionnée** dans ce dépôt (ex. `docs/plans/…`), ajouter le **chemin** du fichier dans le corps du commit.

## Exemple

```text
feat(ui): session via cookie httpOnly sans JWT en JSON

Plan: auth_cookie-only session
- Nest: plus de token dans le body login/register; logout sans JwtAuthGuard.
- UI: axios.defaults.withCredentials; suppression authToken / intercepteur Bearer.
- README: note sécurité mise à jour.
```

## Petits correctifs

Pas d’obligation pour un one-liner sans plan formel.

## Documentation dans le même commit

Si le changement affecte ce qu’un humain doit savoir pour **installer**, **configurer**, **déployer** ou **comprendre le flux** de l’app :

- Mettre à jour la doc **dans le même commit** que le code (README du package concerné, `render.yaml` / scripts Render, `docs/*`, `ARCHITECTURE.md` si le flux décrit change).
- Mentionner dans une puce du corps du commit les fichiers doc touchés (ex. `README: section sécurité`).

**Exclu** : changements purement internes, typos, tests seuls.

## Règle agent (Cursor)

Le dépôt inclut [`.cursor/rules/commits-and-plans.md`](../.cursor/rules/commits-and-plans.md) (`alwaysApply: true`) pour que l’agent rappelle ces conventions à chaque session.
