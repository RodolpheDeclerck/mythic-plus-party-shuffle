# Tasks — `add-backend-unit-tests`

## Auth
- [x] `auth.service.spec.ts` — find-or-create by OIDC sub, validateUser select
- [x] `auth.controller.spec.ts` — logout clears cookie (with/without domain), `me` returns `req.user`
- [x] `jwt-auth.guard.spec.ts` — public route bypass, handleRequest success/failure
- [x] `jwt.strategy.spec.ts` — validate: missing sub, username/email fallbacks, mapped user

## Character
- [x] `character.service.spec.ts` — create/update/delete/deleteMany/upsert, all error branches
- [x] `character.controller.spec.ts` — specialization validation, not-found, ws emit

## Event
- [x] `event.service.spec.ts` — create, flattenAdmins, update admins replace, delete P2025, visibility
- [x] `event.controller.spec.ts` — `visible` alias mapping, code query branch, shuffle emit
- [x] `event-admin.guard.spec.ts` — not-auth, not-found, not-admin, admin OK

## User
- [x] `user.service.spec.ts` — getUsers/getById, update/delete P2025 → NotFound
- [x] `user.controller.spec.ts` — not-found, owner check on update/delete

## Misc
- [x] `metadata.controller.spec.ts` — classes, specializations, details, ClassesController
- [x] `party.controller.spec.ts` — body normalization variants, member transform, delete emit
- [x] `party.facade.spec.ts` — shuffle→save→history orchestration order
- [x] `prisma.service.spec.ts` — connect/disconnect lifecycle hooks
- [x] `websocket.service.spec.ts` — delegation to gateway

## Specs & threshold
- [x] Write `specs/{auth,character,event}/spec.md` deltas
- [x] Run `npm test`, measure coverage, raise global `coverageThreshold`
- [x] `npm run openspec:validate`
