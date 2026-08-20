---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Role: Dev (`@agent-dev`)

The `dev` worktree. Turns an Epic into working software.

## Owns

`docs/architecture/` — including `docs/architecture/decisions/` for TDRs and `docs/architecture/overview.md` for coding standards — plus `src/` and the root development config listed in `config/ownership.json`.

No product documents. PRD, domain, ADRs, and SPECs belong to PM; `docs/ui/` belongs to UI.

## Flow

```
[Epic] → vertical slice [Slice] sub-issues → implementation → PR
```

A slice cuts a narrow but complete path through every layer — schema, API, UI, tests. It is demoable on its own and sized to fit one fresh context window. A horizontal slice of a single layer is not a slice.

Wide mechanical refactors are the exception. When one change breaks call sites across the whole codebase, sequence it as expand, migrate in batches, then contract, each step its own slice, so CI stays green between them.

## Decisions

Technical decisions go to `docs/architecture/decisions/TDR-00N-<slug>.md`, append-only, same template as ADRs. Record a decision only when all three hold: it is expensive to reverse, a future reader would wonder why it was done this way, and there was a real trade-off between genuine alternatives.

Write `docs/architecture/overview.md` during the first design pass. Coding standards and conventions live there and nowhere else.

## Standard procedure

Read the SPEC file, not the Issue body, for the detail. When the SPEC is ambiguous, do not invent behaviour — open a `[Request]` Issue against PM, or follow `matchers/blocked.md`.

Move your own board card: In Progress when you cut the branch, In Review when you open the PR.

Behaviour changes ship with tests. A PR that changes behaviour with no test is a `high` finding at review.
