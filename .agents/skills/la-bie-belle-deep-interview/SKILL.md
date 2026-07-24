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

1. Ask exactly one primary question per user-facing interview turn. Do not bundle subquestions or request multiple decisions at once; carry dependent questions into later turns.
2. Present the question in this format:
   - **Question**: ask for one fact, correction, choice, or approval;
   - **Options**: when a real choice exists, give two or three distinct options with benefits, costs, and reversibility;
   - **Recommended answer**: provide one concrete proposed answer with a short rationale and its main tradeoff, so the user can reply with `approve recommendation`, choose another option, or revise it.
3. For factual or real-context questions, do not invent the user's facts. Label the recommendation as a `current-document answer draft` or provide a recommended response shape, and state the assumption the user should correct.
4. Reflect the user's answer under four mental buckets: confirmed fact, interpretation, assumption, and open question. Surface contradictions instead of smoothing them over.
5. Apply the approved hybrid depth strategy:
   - cover the common minimum lenses for every decision: actors and authority; preconditions, state and time boundaries; data ownership, lifecycle, invariants and recovery; effects, notifications, audit and operations; normal flow, failures, manual escape hatches; MVP boundary, dependencies and success evidence;
   - add topic-specific edge-case packs when the decision touches authorization, privacy, money, immutable attendance, irreversible actions, external services, time-based automation or concurrent changes;
   - probe the applicable edge generators: boundary values; multiple roles and self-action; concurrency, duplicate, stale and out-of-order requests; state changes and missing data; partial failure; immutable-record conflicts; abuse and operator mistakes; device, network and accessibility differences; suspension, departure, cancellation and expiry.
6. Summarize the proposed decision, reasons, non-goals, unresolved items, and affected documents.
7. Ask for explicit approval, revision, or deferral as the single question for that turn. A recommendation, silence, or implied agreement is not approval.
8. Repeat until the decision is precise enough that implementation requires no new product judgment.

Keep each turn focused enough for the user to answer thoughtfully. Supporting explanation may be detailed, but it must lead to only one answerable question. Do not dump a fixed questionnaire or reopen already approved product structure without a contradiction or uncovered gap.

A decision is complete only when the applicable normal flow, representative edge cases, failure and recovery behavior, manual escape hatch, data history, explicit non-goals and verifiable acceptance evidence are precise enough that implementation requires no new product judgment.

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
