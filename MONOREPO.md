# Monorepo (UI + API)

This folder groups **two npm workspaces**:

| Workspace | Folder | Package name (`package.json`) |
|-----------|--------|-------------------------------|
| Web | `mythic-plus-party-shuffle-ui/` | `mythic-plus-party-shuffle` |
| API | `mythic-plus-party-shuffle-api-nest/` | `mythic-plus-party-shuffle-api-nest` |

## Commands (run from this root)

```bash
npm install

npm run dev:web
npm run dev:api

npm run ci:web
npm run ci:api
npm run ci
```

## Git: one repo for both apps

Today each subfolder may still have its **own** `.git`. To have a **single** remote:

1. Choose a backup (branches pushed to GitHub are enough).
2. From this **parent** directory:
   - `git init`
   - Add a `.gitignore` (root file is provided).
   - Remove nested VCS folders if you no longer need separate history: delete `mythic-plus-party-shuffle-ui/.git` and `mythic-plus-party-shuffle-api-nest/.git` (only after you are sure).
3. `git add .` → commit → `git remote add origin <url>` → push.

Alternatively keep **two GitHub repos** and do **not** use this root `package.json` for CI; use it only locally. The workspaces layout still works with `npm install` at the parent.

## GitHub Actions

Workflow lives at **repo root**: `.github/workflows/ci.yml`.  
If your Git remote is still **only** the UI repo, either:

- move the workflow to that repo’s root (and adjust paths), or  
- adopt this parent folder as the canonical repo and set **Render root directory** to `mythic-plus-party-shuffle-ui` (web) and `mythic-plus-party-shuffle-api-nest` (API).

## Render / hosting

- **Web service**: Root directory = `mythic-plus-party-shuffle-ui`, build `npm install && npm run build` (or `npm ci` if you rely on root lockfile — see below).
- **API service**: Root directory = `mythic-plus-party-shuffle-api-nest`, same idea.

If the Git repo root is **this parent folder**, Render must run `npm install` from **repo root** so workspaces resolve, then `npm run build -w <package>`, **or** set root directory to the app folder and ensure `package-lock.json` in that folder still works (you may keep per-app locks during migration).

## Lockfiles

After the first `npm install` at the monorepo root, npm generates a **single** `package-lock.json` here. You can remove duplicate `package-lock.json` files inside each workspace later for clarity, once everything installs from the root.

## Optional layout `apps/web` + `apps/api`

Not done here to avoid mass moves. You can rename folders later and update `workspaces` in root `package.json`.
