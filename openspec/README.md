# OpenSpec

[OpenSpec](https://github.com/Fission-AI/OpenSpec) is **adopted** as the spec-driven workflow for this repo. The CLI (`@fission-ai/openspec`) is installed as a root devDependency.

## Status

| Aspect | State |
|---|---|
| Adoption decision | ✅ Adopted (after POC retro, PR #33 + this PR) |
| CLI integrated | ✅ `@fission-ai/openspec@^1.3.1` in root `devDependencies` |
| Coexistence with `docs/plans/` | Both kept (see [Coexistence](#coexistence-with-docsplans)) |
| AI tool bindings | Not installed yet (would be `openspec init --tools claude` if needed) |

## Layout

```
openspec/
├── README.md                          ← this file
├── specs/<capability>/spec.md         ← stable contract of each capability (canonical OpenSpec format)
└── changes/
    ├── <change-id>/                   ← active change proposals
    │   ├── proposal.md                ← why + what changes
    │   ├── tasks.md                   ← ordered TODO
    │   ├── design.md                  ← optional, technical decisions
    │   └── specs/<capability>/spec.md ← deltas (## ADDED / MODIFIED / REMOVED / RENAMED Requirements)
    └── archive/<YYYY-MM-DD-change-id>/ ← shipped changes (auto-created by `openspec archive`)
```

## Canonical format

Specs and changes follow the OpenSpec schema. Validation runs via `npm run openspec:validate`.

**Spec file** (`specs/<capability>/spec.md`):

```markdown
## Purpose
[brief statement of what the capability does]

## Requirements

### Requirement: <Clear normative statement using SHALL/MUST>
[longer text if needed]

#### Scenario: <Descriptive name>
- **WHEN** <condition>
- **THEN** <expected outcome>
```

**Change deltas** (`changes/<id>/specs/<capability>/spec.md`):

```markdown
## ADDED Requirements
### Requirement: <new requirement>
...

## MODIFIED Requirements
### Requirement: <existing requirement, full updated block>
...

## REMOVED Requirements
### Requirement: <name>
**Reason**: ...
**Migration**: ...
```

Critical: scenarios MUST use exactly 4 hashtags (`####`). 3 hashtags or bullets fail silently.

For detailed schemas run `npx openspec instructions <artifact> --change <change-id>` (artifacts: `proposal`, `specs`, `design`, `tasks`).

## Useful commands

| Command | What it does |
|---|---|
| `npm run openspec` | Interactive CLI menu |
| `npm run openspec:list` | List active changes |
| `npm run openspec:validate` | Validate all specs and active changes (`--strict`) |
| `npm run openspec:archive` | Move a completed change to `archive/`. Use `--skip-specs` if the change has no delta files. |
| `npx openspec list --specs` | List capability specs |
| `npx openspec show <name>` | Inspect a spec or change |
| `npx openspec instructions specs --change <id>` | Get a fully-detailed prompt for writing the specs artifact of a change |

## Coexistence with `docs/plans/`

`docs/plans/NN-*.md` is the legacy plan format and continues to live alongside OpenSpec. Convention going forward:

- **Specs** of a capability (stable contract) live in `openspec/specs/<capability>/spec.md`. Single source of truth.
- **Change proposals** live in `openspec/changes/<id>/`. The `proposal.md` is the primary discussion artifact.
- **`docs/plans/`** continues to hold higher-level rollout plans (CI hardening, migrations, etc.) that are not tied to a single capability or that predate OpenSpec. For new capability-level work, prefer OpenSpec.
- A change MAY have a mirror entry in `docs/plans/` for traceability when it's relevant to onboarding or to the README; this is optional, not required.

## Workflow for a new change

1. Create the folder: `openspec/changes/<change-id>/`.
2. Write `proposal.md` (Why + What Changes; see `npx openspec instructions proposal --change <id>` for the strict schema).
3. Write `specs/<capability>/spec.md` with delta operations (ADDED / MODIFIED / REMOVED / RENAMED).
4. Write `tasks.md` (ordered TODO).
5. Validate: `npm run openspec:validate`.
6. Implement, open PR, merge.
7. After merge: `npm run openspec:archive <change-id>`. The CLI moves the folder to `archive/YYYY-MM-DD-<change-id>/` and (if deltas exist) applies them to `openspec/specs/`.

## History

- **PR #33** — POC scaffold + first dogfooded change (`add-shuffle-unit-tests`). Captured 7 spec/code drifts.
- **This PR** — CLI integration, canonical-format refactor of `openspec/specs/shuffle/spec.md`, archive of the POC change.
