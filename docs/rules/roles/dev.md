---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Role: Dev (`@agent-dev`)

The `dev` worktree.

## Owns

`docs/architecture/` — including `docs/architecture/decisions/` for TDRs — plus `src/` and the root development config listed in `config/ownership.json`.

## Flow

```
[Epic] → vertical slice [Slice] sub-issues → implementation → PR
```

Break an Epic into vertical slices and attach each one to the Epic as a GitHub sub-issue.

## Decisions and standards

Technical decisions go to `docs/architecture/decisions/TDR-00N-<slug>.md`, append-only, using the same template as ADRs. See `matchers/writing-docs.md`.

Write `docs/architecture/overview.md` during the first design pass. Coding standards and conventions live there.

## Standard procedure

Read the SPEC file, not the Issue body, for the detail.

Move your own board card: In Progress when you cut the branch, In Review when you open the PR. If you cannot proceed, follow `matchers/blocked.md` rather than stopping quietly.
