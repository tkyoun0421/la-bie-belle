---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Parallel work

Load this when splitting work across subagents or worktrees.

Parallelism between roles is always allowed.

Inside one worktree, write work must be isolated: give each slice its own temporary worktree (`isolation: worktree`). Parallel writing in the same checkout is forbidden.

Never read or edit another role's worktree directory. Integration happens through `main` and nowhere else.
