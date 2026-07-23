---
name: la-bie-belle-harness
description: Use when implementing, reviewing, or verifying a task in this repository. It enforces the phase index execution contract, RADIO record, TDD evidence, validation, user confirmation for sensitive changes, and task-scoped commit flow.
---

# La Vie Belle Harness

## Workflow

1. Read `AGENTS.md`, `README.md`, `docs/PRD.md`, `docs/DOMAIN.md`, `docs/ARCHITECTURE.md`, related ADRs, and `docs/phases/index.jsonl`.
2. Choose exactly one runnable task. Read its phase document and every `spec_refs` source. Do not change task status, scope, or dependencies without recording a new task when needed.
3. Create `.agents/runs/<task-id>/radio.md` before implementation with these headings: `## Requirements`, `## Architecture`, `## Data model`, `## Interface`, and `## Optimizations`.
4. Follow the task `test_mode`.
   - `tdd`: use `node .agents/harness/scripts/tdd-guard.mjs red <task-id> -- <command>` for an assertion failure, then run the same command with `green`; do not commit before `tdd-guard.mjs check <task-id>` passes.
   - `verification` or `docs_only`: run every registered `check_ids` using `pnpm harness:verify-task <task-id>`.
5. Record the resulting verification evidence under `.agents/runs/<task-id>/verification.json`, including all `spec_refs`. Keep changes within the selected task.
6. For authorization, privacy, estimated-pay, attendance, or account-recovery changes, present the completed RADIO record, verification results, and diff to the user and wait for confirmation before marking the task done or committing.
7. Mark the task done only after its acceptance criteria and checks pass. Commit only the task changes with its task ID in the subject. Do not use `--no-verify`.

## Guardrails

- Respect FSD and server-first rules in `docs/DEVELOPMENT.md` and ADR-0008.
- Codex `SessionStart` and `PreToolUse` hooks reinforce this workflow: the latter reruns the task/TDD pre-commit guard before a Codex-issued `git commit`.
- Git hooks remain the final local check for commits made outside Codex. Codex hooks must be reviewed and trusted through `/hooks` after a Codex restart.
