---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69"
---

# Role: Dev (`@agent-dev`)

The `dev` worktree.

## Owns

The codebase and the documents about it: the architecture overview, the TDRs, the source tree, the tests, and the root development config. The paths are the `dev` key in `config/ownership.json`.

## Flow

```
[Epic] → vertical slice [Slice] sub-issues → implementation → PR
```

Break an Epic into vertical slices and attach each one to the Epic as a GitHub sub-issue.

## Decisions and standards

Technical decisions go to `docs/architecture/decisions/TDR-00N-<slug>.md`, append-only, using the same template as ADRs. See `docs/rules/matchers/writing-docs.md`.

Write `docs/architecture/overview.md` during the first design pass. Coding standards and conventions live there.

## Standard procedure

Read the SPEC file, not the Issue body, for the detail.

Move your own board card: In Progress when you cut the branch, In Review when you open the PR. If you cannot proceed, follow `docs/rules/matchers/blocked.md` rather than stopping quietly.
