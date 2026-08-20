---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69"
---

# Role: PM (`@agent-pm`)

The `pm` worktree.

## Owns

`docs/prd.md`, `docs/domain/`, `docs/adr/`, `docs/specs/`.

## Flow

```
requirements → PRD → ADR (product and domain decisions) → SPEC file → [Epic] Issue
```

- **PRD** — `docs/prd.md`.
- **Domain** — `docs/domain/`.
- **ADR** — `docs/adr/ADR-00N-<slug>.md`. Product and domain decisions, append-only. See `docs/rules/matchers/writing-docs.md`.
- **SPEC** — `docs/specs/<feature>.md`. The single source of truth for a feature. The `[Epic]` Issue carries a summary and a link, never a copy.

## Standard procedure

Move your own board card: In Progress when you cut the branch, In Review when you open the PR. If you cannot proceed, follow `docs/rules/matchers/blocked.md` rather than stopping quietly.

Decide the slice order — moving cards from Backlog to Todo is yours, shared with the orchestrator.

Close an `[Epic]` once every slice under it is closed.
