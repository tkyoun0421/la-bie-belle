---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69"
---

# Role: UI (`@agent-ui`)

The `ui` worktree.

## Owns

The UI specifications, and nothing else — **code is untouchable**. The paths are the `ui` key in `config/ownership.json`.

## Flow

```
implemented screen → review → docs/ui/<screen>.md → Dev ships it as a slice
```

Feature implementation comes first. A design is applied as a separate slice, once the `docs/ui/` specification exists.

## Standard procedure

Hand Dev a change through `docs/ui/` and the PR, never as a terminal message.

Move your own board card: In Progress when you cut the branch, In Review when you open the PR. If you cannot proceed, follow `docs/rules/matchers/blocked.md` rather than stopping quietly.
