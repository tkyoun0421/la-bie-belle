---
name: la-bie-belle-deep-interview
description: Run the user-led deep-interview track for La Vie Belle product management, project planning, MVP scope, domain, architecture, data, security, UX, acceptance criteria, and task design. Use when a decision is unclear or unapproved, when reviewing existing proposed plans, or when development discovers a scope or design question that must return to the user before implementation.
---

# La Vie Belle Deep Interview

Use this skill to produce approved design inputs, not product code.

## Prepare

1. Read `AGENTS.md`, `docs/WORKFLOW.md`, `README.md`, and the documents related to the requested decision.
2. Inspect `docs/phases/index.jsonl` for related `proposed` tasks and dependencies.
3. Treat existing unapproved content as interview material, not as the answer.
4. Name one decision topic for the current interview cycle and state what remains outside it.

## Run the interview loop

1. Ask a small set of connected questions about the user's real context, current workflow, actors, frequency, pain, constraints, failure cost, and desired outcome.
2. Reflect the answer under four mental buckets: confirmed fact, interpretation, assumption, and open question. Surface contradictions instead of smoothing them over.
3. Deepen the topic across the dimensions that materially apply:
   - user and operator workflow;
   - roles, authorization, privacy, and audit;
   - data ownership, lifecycle, invariants, and recovery;
   - normal flow, edge cases, failures, and manual escape hatches;
   - MVP boundary, dependency, rollout, and success evidence;
   - architecture, interface, performance, and operational tradeoffs.
4. When a real choice exists, present two or three distinct options with benefits, costs, reversibility, and a recommendation. Do not turn the recommendation into a decision.
5. Summarize the proposed decision, reasons, non-goals, unresolved items, and affected documents.
6. Ask for explicit approval, revision, or deferral. Silence and implied agreement are not approval.
7. Repeat until the decision is precise enough that implementation requires no new product judgment.

Keep each turn focused enough for the user to answer thoughtfully. Do not dump a fixed questionnaire.

## Record an approved decision

Only after explicit user approval:

1. Update canonical documents in this order as applicable: PRD, Domain, ADR, Architecture, Design, Phase.
2. Preserve stable spec IDs and record supersession instead of silently changing established meanings.
3. Create or refine one task with goal, non-goals, edge cases, acceptance criteria, dependencies, `spec_refs`, `test_mode`, and `check_ids`.
4. Set the task to `planned` with `approved_by: "user"` and `approved_at`.
5. Tell the user exactly what was approved and what remains `proposed`.

Do not mark a task `in_progress` or run the engineering harness in this track.

## Hand off to engineering

Hand off only when all conditions in `docs/WORKFLOW.md` are satisfied. Provide the approved task ID and recommend explicit execution with `$la-bie-belle-harness`. If implementation exposes a new design decision, resume this skill with the decision signal supplied by the engineering loop.
