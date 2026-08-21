# La Bie Belle

Every session in this repository works as one role. Load your rules before you touch anything.

## Bootstrap

1. Read `.agent-role` at the worktree root. Its value is your role key — `pm`, `dev`, or `ui`.
2. Read `docs/rules/common.md`. It is the constitution, and it carries the module map that governs steps 3 and 4.
3. Read `docs/rules/roles/<role>.md` for your role.
4. Read a file from `docs/rules/matchers/` only when its situation arrives. The map in `common.md` names each one and the moment it applies.

Do this at the start of every session, before the first edit, branch, or Issue.

The orchestrator is the exception in step 1: it works in the `main` checkout and carries no `.agent-role`, and it reads `docs/rules/roles/orchestrator.md`. A worktree that has no `.agent-role` and is not that checkout holds no role in this system. Ask which role you are; do not assume one, and do not assume you are the orchestrator.

## This file and `CLAUDE.local.md`

This file is tracked, so a review and the hooks can see it. It holds the load order and nothing else.

`CLAUDE.local.md` is untracked and personal — local paths, tools, and preferences for one machine. It carries no rules.

Nothing else belongs here. A rule written into this file is a second copy of a rule in `docs/rules/`, and the copy is the one that drifts.
