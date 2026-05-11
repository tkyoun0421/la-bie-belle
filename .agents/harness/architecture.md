# AI Harness Architecture

This document treats the AI harness as an agentic system separate from product code. The goal is to keep state, workflow, and automation understandable as the project grows.

## Goals

- Separate task selection, issue execution, verification, review, dashboard projection, and cleanup.
- Reduce state drift between GitHub Issues, Project fields, labels, inbox, run artifacts, and dashboard data.
- Keep skills focused on use cases instead of tool-specific response shapes.
- Add structured state gradually, while preserving fallback behavior for legacy runs.

## Domain Model

- `Issue`: executable work tracked in GitHub.
- `InboxItem`: temporary candidate, follow-up, or risk not yet promoted to an Issue.
- `Run`: local execution record for one Issue.
- `Stage`: `planned`, `specified`, `red`, `green`, `verified`, `reviewed`, `dashboarded`, `pr-drafted`.
- `Artifact`: stage output such as `task-spec.md`, `spec.md`, `verification.md`, or `review-score.json`.
- `Decision`: `PASS`, `REWORK`, `FAIL`, `blocked`, or `needs-triage`.
- `Priority`: `P0`, `P1`, `P2`, `P3`.
- `Blocker`: a policy decision, dependency, or environment issue that prevents progress.

## Use Cases

- `diagnose-status`: read local state, inbox, dashboard, and GitHub state to recommend the next step.
- `choose-next-work`: compare open Issues and inbox candidates.
- `capture-inbox-item`: promote inbox work into a GitHub Issue draft.
- `plan-issue`: turn an Issue into `task-spec.md` and `plan.md`.
- `write-spec`: clarify decisions and write `spec.md`.
- `run-red`: create or record the failing condition.
- `run-green`: implement the minimum passing change.
- `verify-run`: run checks and write `verification.md`.
- `review-run`: score the result and decide PASS/REWORK/FAIL.
- `update-dashboard`: project run records into dashboard data.
- `evaluate-harness`: score harness health and propose process improvements.
- `draft-pr`: turn a PASS run into a normal PR.
- `cleanup-completed-runs`: remove completed local run directories from the active queue.

## Ports And Adapters

- `IssueTrackerPort`: GitHub Issue body, comments, labels, open/closed state.
- `ProjectBoardPort`: MVP, Type, Source, Status, Priority.
- `InboxStore`: `.agents/inbox.md`.
- `RunArtifactStore`: `.agents/runs/issue-*`.
- `DashboardStore`: `.agents/harness/dashboard/data/runs.js`.
- `GitPort`: diff, status, commit, PR readiness.
- `VerificationPort`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- `UserDecisionPort`: explicit user decisions and approvals.

Current adapters are `gh api`, local markdown/JSON files, git, pnpm, and skill output.

## Dependency Rule

- Harness policy belongs in skills, scripts, schemas, and docs, not in dashboard display code alone.
- Dashboard data is a projection, not the source of truth.
- Inbox is an active temporary queue, not a permanent record.
- `.agents/runs/issue-*` is an active execution queue, not a permanent archive.
- GitHub Issues, PRs, commits, and dashboard snapshots are the durable history.
- Project Priority can be the source of truth; priority labels are a mirror for list visibility.

## State Machine

```txt
planned -> specified -> red -> green -> verified -> reviewed -> dashboarded -> pr-drafted
```

Exception states:

- `needs-triage`: priority, scope, owner, or blocked state is not settled.
- `blocked`: external decision or dependency prevents progress.
- `rework`: review requires implementation work.
- `failed`: review requires human confirmation.

## Structured State

New runs created by `start-issue.mjs` should include `state.json`.

Expected fields:

```json
{
  "run_id": "issue-28",
  "issue_number": 28,
  "stage": "planned",
  "decision": null,
  "priority": "P0",
  "blocked": false,
  "blockers": [],
  "inbox_refs": [],
  "dashboard_synced_at": null,
  "updated_at": "2026-05-11T00:00:00.000Z"
}
```

Compatibility rule:

- If `state.json` exists, status and dashboard scripts should prefer it.
- If `state.json` is missing, scripts should infer status from legacy artifacts.
- Do not backfill old completed runs just to silence missing state warnings.

## Completed Run Cleanup

Completed run artifacts should be removed from the active queue after the durable record exists elsewhere.

Cleanup prerequisites:

- `review-score.json` and `review.md` exist.
- The review decision is terminal: `PASS`, `REWORK`, or `FAIL`.
- Dashboard data has been regenerated after the run completed.
- The GitHub Issue, PR, or commit history contains the final outcome.
- The run is not the current active work.

Cleanup flow:

1. Run `node .agents/harness/scripts/diagnose-status.mjs` and inspect `cleanup_candidate`.
2. Run `node .agents/harness/scripts/cleanup-completed-runs.mjs` for a dry-run plan.
3. Apply deletion only with explicit approval and `--apply`.
4. Never delete a run directory from status diagnosis alone.

## Improvement Proposal Lifecycle

`.agents/harness/improvements/proposals` is an active queue.

- Keep only pending proposals there.
- If a proposal is implemented, promoted to an Issue, rejected, or deferred with a recorded reason, remove it from the active queue.
- Long-term history should live in commits, Issues, PRs, run artifacts while active, or dashboard snapshots.

## Guardrails

- Do not edit or delete inbox items during status diagnosis.
- Do not mutate GitHub labels unless the command is explicitly an apply operation.
- Do not delete run directories without a dry-run and explicit approval.
- Distinguish missing dashboard scores from real zero scores.
- Record local and CI verification differences in `verification.md`.
- Do not change prompts, rubrics, gates, or permissions from a proposal alone.
