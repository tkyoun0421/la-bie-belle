---
name: la-bie-belle-harness
description: Run the autonomous engineering loop for one explicitly named and user-approved La Vie Belle task. Use when implementing, fixing, reviewing, or verifying a tracked task after the deep-interview track has completed its design handoff; enforce approval, dependencies, task scope, RADIO, TDD or registered verification, bounded retries, evidence, sensitive-change confirmation, and a task-scoped commit.
---

# La Vie Belle Autonomous Engineering Loop

Use this skill for approved execution. Use `$la-bie-belle-deep-interview` when product, project, or development design is still unresolved.

## Validate the handoff

1. Read `AGENTS.md`, `docs/WORKFLOW.md`, `README.md`, `docs/PRD.md`, `docs/DOMAIN.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, related ADRs, and `docs/phases/index.jsonl`.
2. Require an explicitly named task. Never select the next task automatically.
3. Confirm the task is `planned` or a resumable `in_progress`, has `approved_by: "user"` and `approved_at`, has satisfied dependencies, and has `spec_refs`, detailed acceptance criteria, `test_mode`, and registered `check_ids`.
4. Refuse `proposed` tasks and return missing product or design decisions to the deep-interview track.
5. Keep exactly one task `in_progress`.

## Execute autonomously

1. Create `.agents/runs/<task-id>/radio.md` before implementation with these headings: `## Requirements`, `## Architecture`, `## Data model`, `## Interface`, and `## Optimizations`.
2. Follow the task `test_mode`.
   - `tdd`: use `node .agents/harness/scripts/tdd-guard.mjs red <task-id> -- <command>` for an assertion failure, then run the same command with `green`; pass `tdd-guard.mjs check <task-id>` before commit.
   - `verification` or `docs_only`: run every registered check with `pnpm harness:verify-task <task-id>`.
3. Implement only the approved scope and preserve repository invariants.
4. Diagnose technical failures, keep attempt work, and retry within `.agents/harness/config.json`.
5. Record `.agents/runs/<task-id>/verification.json` with every `spec_ref`.

Continue through ordinary implementation choices without repeatedly asking the user. Stop and return a structured decision signal to `$la-bie-belle-deep-interview` when:

- canonical documents conflict;
- acceptance criteria require a product, scope, permission, data-lifecycle, architecture, or UX decision;
- completion would require another task or an unapproved dependency;
- an irreversible external action needs new authority.

The decision signal must state the needed decision, why the task cannot decide it, affected specs, and viable options.

## Complete and hand back

1. For authorization, privacy, estimated-pay, attendance, account-recovery, or other designated sensitive changes, present RADIO, verification, and diff to the user and wait for confirmation before `done` or commit.
2. Mark the task `done` only after acceptance criteria and checks pass.
3. Commit only task changes with the task ID in the subject. Do not use `--no-verify`.
4. Report the result and stop. Do not choose or start another task.

## Guardrails

- Respect FSD and server-first rules in `docs/DEVELOPMENT.md` and ADR-0008.
- Respect the two-track boundary in `docs/WORKFLOW.md` and ADR-0009.
- Codex hooks and Git hooks enforce task, TDD, dangerous-command, verification, and commit rules.
