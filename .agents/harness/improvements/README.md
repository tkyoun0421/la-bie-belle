# Harness Improvements

This directory is an active queue for proposed changes to the AI harness.

## Lifecycle

- `proposals/`: pending proposals that still need a decision or implementation.
- A proposal file is temporary. Once the proposal is accepted and implemented, rejected, or promoted to a GitHub Issue, remove it from the active queue.
- Long-term history should live in git commits, PRs, GitHub Issues, run artifacts, or dashboard data, not in stale queue files.

## Rules

- Keep proposal JSON files aligned with `.agents/harness/schemas/improvement.schema.json`.
- Do not change prompts, rubrics, gates, or automation permissions from a proposal alone.
- If a proposal is implemented directly, mention the proposal id in the commit or PR body before removing the file.
- If a proposal is rejected, record the reason in the relevant issue, PR, or review note before removing the file.
