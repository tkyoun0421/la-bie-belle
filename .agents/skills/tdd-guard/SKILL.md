---
name: tdd-guard
description: Enforce RED-GREEN-REFACTOR evidence for Codex feature tasks in this repository. Use when a phase task has test_mode=tdd or when adding behavior, domain logic, API, database, RLS, or security rules.
---

# TDD Guard

Use this skill for every task whose `test_mode` is `tdd`. The Git hook and harness scripts are authoritative; do not claim a task is complete from a passing test run alone.

## Workflow

1. Read the task's `spec_refs`, phase acceptance conditions, and `check_ids`.
2. Confirm the baseline checks pass before changing production code.
3. Add the smallest test that expresses the required behavior.
4. Run the targeted test and record a genuine assertion failure as RED. Infrastructure or syntax failures do not count.
5. Implement the smallest change that makes the same test pass.
6. Run the targeted test again as GREEN, then run every task `check_id`.
7. Refactor only while all checks remain green.
8. Let the harness write verification evidence and commit only through the guarded workflow.

## Evidence rules

- RED evidence includes the task ID, command argv, exit code, assertion failure classification, and the production/test tree state before implementation.
- GREEN evidence includes the same test identity, exit code 0, all configured check IDs, and every referenced spec ID.
- Do not edit or delete evidence to bypass a hook. If a check fails, keep the task worktree isolated and record the failure.
- Do not use `git commit --no-verify`; CI runs the same guard again.

## Exceptions

- `docs_only` tasks use document validators and do not require RED/GREEN.
- `verification` tasks use their declared checks and do not require RED/GREEN.
- Never choose an exception based only on convenience. The task's `test_mode` in `index.jsonl` is the source of truth.

The executable contract lives in `.agents/harness/scripts/tdd-guard.mjs` and is called by the worktree hook and CI.
