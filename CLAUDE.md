# Claude Code — Project Rules

## Language

Communicate in **French** with the user. Code, comments, and commit messages in **English**.

## PR Checklist

Every PR that adds or modifies behavior **must** include:

1. **Tests** — unit tests covering new/changed logic (nominal, edge, error cases). Run `cd mythic-plus-party-shuffle-ui && npx jest` to verify all pass.
2. **Plan** — `docs/plans/NN-kebab-case.md` for non-trivial changes. Follow the existing format (see `docs/plans/01-argon2-password-hashing.md`).
3. **Plans index** — add a row in `docs/plans/README.md`.
4. **Architecture** — update `mythic-plus-party-shuffle-ui/ARCHITECTURE.md` if data models, hooks, or app flows change.
5. **README** — update the relevant README if config, deployment, or visible behavior changes.

## Commits

- Follow Conventional Commits: `type(scope): description`.
- Include `Plan:` line + bullet points in the body when a plan exists (see `.cursor/rules/commits-and-plans.md`).
- Include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` in commit messages.

## Code Style

- **UI tests**: Jest, `describe`/`it` (not `test()`), inline factory functions, `@/` path aliases.
- **No unnecessary abstractions**: don't create helpers/utilities for one-time operations.
- **Imports**: use `import type` for type-only imports; use shared utilities (e.g., `playerGroupRoleIcons`) instead of duplicating logic.
- **Translations**: every user-facing string must have keys in both `app/locales/en/translation.json` and `app/locales/fr/translation.json`.

## Project Structure

- `mythic-plus-party-shuffle-ui/` — Next.js frontend (React, TypeScript, Tailwind).
- `mythic-plus-party-shuffle-api-nest/` — NestJS backend (TypeScript, Redis, PostgreSQL).
- `docs/plans/` — versioned implementation plans.
