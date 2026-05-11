# Harness Improvement Workflow

## Purpose

The harness can propose improvements to its own process, but configuration changes require an explicit human decision.

## Steps

1. Evaluate recent run artifacts and harness health.
2. If a concrete improvement is needed, create a proposal JSON file in `.agents/harness/improvements/proposals/`.
3. Validate the proposal shape against `.agents/harness/schemas/improvement.schema.json`.
4. Human triage decides one of three outcomes:
   - Implement now.
   - Promote to a GitHub Issue.
   - Reject or defer.
5. If implemented now, include the proposal id in the commit or PR body, then remove the proposal file from the active queue.
6. If promoted, create or update the GitHub Issue with the proposal id, then remove the proposal file from the active queue.
7. If rejected or deferred, record the reason in the relevant issue, PR, or review note, then remove the proposal file from the active queue.
8. The next harness evaluation should judge the result from commits, issues, run artifacts, and dashboard data instead of stale proposal files.

## Required Proposal Content

- `proposal_id`
- `source`
- `target_area`
- `problem`
- `proposal`
- `expected_impact`
- `risk`
- `status`
- `created_at`

## Guardrails

- Do not change prompts, rubrics, verification gates, permissions, or dashboard scoring logic without human approval.
- Keep active proposal files short-lived.
- Prefer one small implementation per accepted proposal.
