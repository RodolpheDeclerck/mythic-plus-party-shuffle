# 09 — Durcir la CI GitHub Actions

**Fichier :** `docs/plans/09-ci-hardening.md`

## État actuel (à corriger)

Workflow unique [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) : deux jobs (`web`, `api`) qui font `install → lint → test → build`. Fonctionne, mais plusieurs garde-fous "pro" absents.

### Constats concrets

- **Couverture de tests non exploitée**
  - UI : `test:ci` = `jest --ci` **sans `--coverage`**.
  - API : `test:cov` existe dans [`api-nest/package.json`](../../mythic-plus-party-shuffle-api-nest/package.json) mais la CI appelle `test` tout court.
  - Aucun `coverageThreshold` dans [`jest.config.js`](../../mythic-plus-party-shuffle-ui/jest.config.js), aucun upload Codecov.
- **E2E scripté mais mort** : `api-nest/test:e2e` jamais exécuté par le workflow.
- **Pas de typecheck explicite** (`tsc --noEmit`) — `next build` masque certaines erreurs TS hors routes.
- **Prettier non bloquant** : les deux repos ont `format` (write) mais pas de `format:check` (`prettier --check`) en CI.
- **Prisma non validé en CI** : pas de `prisma validate` ni `prisma migrate diff --exit-code` → une migration oubliée passe.
- **Supply chain / sécurité** : pas de `.github/dependabot.yml`, pas de `npm audit`, pas de CodeQL, pas de scan secrets.
- **Pas d'analyse qualité** : pas de SonarCloud.
- **Hygiène Actions** : pas de `concurrency:`, pas de `permissions:` explicites, pas de `timeout-minutes`.
- **Classement deps UI** : `@types/jest`, `@testing-library/*`, `typescript` sont en `dependencies` au lieu de `devDependencies` dans [`ui/package.json`](../../mythic-plus-party-shuffle-ui/package.json).

## Cible

Un pipeline en 3 phases, chacune livrable en PR indépendante.

### Phase 1 — Quick wins (aucune dépendance externe)

Tout est possible avec l'outillage déjà installé.

| Item | Où | Détail |
|------|-----|--------|
| Couverture UI | `ui/package.json` + `jest.config.js` | `test:ci` → `jest --ci --coverage`; ajouter `coverageThreshold` initial prudent (ex. `statements: 50`) à monter progressivement |
| Couverture API | `api-nest/package.json` + workflow | CI appelle `test:cov`; ajouter `coverageThreshold` dans le bloc `jest` de `package.json` |
| Typecheck | les deux `package.json` | Script `typecheck: tsc --noEmit`; étape CI dédiée |
| Prettier check | les deux `package.json` | Script `format:check: prettier --check ...` (mêmes globs que `format`); étape CI |
| Prisma validate | workflow `api` | `npx prisma validate` + `npx prisma format --check` |
| Concurrency | `.github/workflows/ci.yml` | `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` |
| Permissions | `.github/workflows/ci.yml` | `permissions: { contents: read }` au niveau workflow |
| Timeouts | chaque job | `timeout-minutes: 15` |
| Dependabot | `.github/dependabot.yml` (nouveau) | `npm` weekly sur les 2 sous-projets + `github-actions` |
| Nettoyage deps UI | `ui/package.json` | Déplacer `@types/*`, `@testing-library/*`, `typescript` en `devDependencies` |

### Phase 2 — Sécurité & qualité externe

| Item | Détail |
|------|--------|
| CodeQL | Workflow GitHub natif (`github/codeql-action`) JS/TS sur les 2 sous-projets |
| gitleaks | Action `gitleaks/gitleaks-action` sur PR + push |
| `npm audit` | Étape non bloquante en Phase 2, bloquante `--audit-level=high` quand clean |
| SonarCloud | `sonar-project.properties` à la racine, workflow dédié, quality gate requise sur PR ; consommer les rapports `lcov.info` des 2 projets |
| Codecov | Upload des `lcov.info` UI + API, badge README |

### Phase 3 — Tests end-to-end

| Item | Détail |
|------|--------|
| E2E API | Job CI avec services `postgres` + `redis`, exécute `test:e2e` ; nécessite `DATABASE_URL` de test + `prisma migrate deploy` |
| Playwright UI | Ajouter `@playwright/test`, 1 smoke test (création de party → shuffle), job CI dédié avec backend mocké ou vrai via docker-compose |

## Fichiers touchés (prévision)

- `.github/workflows/ci.yml` — refonte progressive
- `.github/workflows/codeql.yml` — nouveau (Phase 2)
- `.github/workflows/sonar.yml` — nouveau (Phase 2)
- `.github/dependabot.yml` — nouveau (Phase 1)
- `sonar-project.properties` — nouveau (Phase 2)
- `mythic-plus-party-shuffle-ui/package.json`, `jest.config.js` — scripts + seuils
- `mythic-plus-party-shuffle-api-nest/package.json` — scripts + seuils
- `README.md` + sous-READMEs — badges CI / couverture / Sonar

## Hors périmètre

- Passer en monorepo (Turborepo/Nx).
- Matrice Node multi-versions (projet pinné sur 20).
- Release automation (changesets, semver).
- Déploiement automatique Render depuis la CI (actuellement géré côté Render).

## Branch protection (hors code, rappel)

Une fois la Phase 1 stabilisée : exiger sur `main` que les checks `web`, `api`, `typecheck`, `format:check` soient verts + 1 review avant merge. À configurer côté GitHub UI, pas dans le repo.

## Risque résiduel

- Couverture initiale basse → seuil bas au départ, remonté progressivement pour éviter de bloquer les PR en cours.
- `npm audit` produit souvent du bruit transitoire sur des deps indirectes → rester `--audit-level=high` au minimum.
- E2E API nécessite des services CI → augmente le temps de run ; le garder dans un job distinct pour ne pas ralentir les PR courantes.
