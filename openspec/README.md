# OpenSpec — POC

This directory is a **proof-of-concept** of the [OpenSpec](https://github.com/Fission-AI/OpenSpec) convention applied to this project. It is being evaluated against our existing `docs/plans/NN-*.md` workflow.

**Status:** experimental. Do not assume this convention is permanent. After the first end-to-end use (see `changes/add-shuffle-unit-tests/`), we decide: adopt, abandon, or hybrid.

## Layout

```
openspec/
├── README.md                          ← this file
├── specs/<capability>/spec.md         ← stable contract of a capability (current state)
└── changes/<change-id>/               ← one folder per proposed change
    ├── proposal.md                    ← what & why
    ├── tasks.md                       ← ordered TODO
    └── design.md                      ← optional, technical decisions
```

## Why try this in addition to `docs/plans/`?

| Concern                              | `docs/plans/NN-*.md`           | OpenSpec                                       |
| ------------------------------------ | ------------------------------ | ---------------------------------------------- |
| One-shot plan for a change           | ✅ already works                | ✅ `changes/<id>/proposal.md`                  |
| Stable description of "what X does"  | ❌ scattered in code/README    | ✅ `specs/<capability>/spec.md`                |
| Separating proposal from tasks       | ❌ mixed in same file          | ✅ `proposal.md` + `tasks.md`                  |
| Archiving merged proposals           | ❌ plans accumulate forever    | ✅ convention archives by moving folder        |
| Tooling / agent-friendliness         | ⚠️ free-form                    | ✅ structured, can be read by an OpenSpec CLI  |

The CLI (`@fission-ai/openspec`) is **not** installed here — pure-convention only. If we adopt, the CLI gets added in a follow-up PR.

## How a change runs

1. Create `changes/<change-id>/proposal.md` describing what and why.
2. Create `tasks.md` with the ordered TODO list to ship the change.
3. Optionally update or create `specs/<capability>/spec.md` to describe the **target** state.
4. Implement the change.
5. When merged, the folder under `changes/` is moved to `changes/archive/<change-id>/` (manual until the CLI is installed).

## Comparison with `docs/plans/`

`docs/plans/NN-*.md` continues to live alongside this POC. They cover the same ground but in a single file. The POC is meant to surface in practice whether OpenSpec's split between *capability spec* and *change proposal* gives enough value to justify the extra structure.
