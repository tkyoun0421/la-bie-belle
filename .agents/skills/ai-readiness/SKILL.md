---
name: ai-readiness
description: Measure how safely and reproducibly Codex can change this repository, using evidence-backed rubric scores and ROI-ranked improvement proposals. Use for baseline, phase-gate, or MVP readiness evaluations.
---

# Codex AI Readiness

Run the repository evaluator and inspect its evidence before proposing changes. The score is advisory: never modify `docs/phases/index.jsonl` or implementation files from a readiness report.

## Workflow

1. Read `AGENTS.md`, the document map, the phase index, and the current harness report.
2. Run `node .agents/harness/scripts/ai-readiness.mjs` to collect deterministic facts.
3. Check every category's evidence path and command result; do not award points for an unverified claim.
4. Use the fixed `ai-readiness.v1` weights and calculate ROI as `(impact * confidence) / cost`.
5. Write only evidence-backed proposals to the report. The user must approve a proposal before it becomes a new task.
6. Regenerate the static dashboard from the JSON report; never use sample fallback data.

## Categories

Score Codex-specific context discovery, task determinism, verification/CI, architecture/ADR navigation, change isolation, environment reproducibility, and safety boundaries. Prefer `AGENTS.md` and repository-local skills for this Codex project.

## Output contract

Reports must include rubric version, evaluated commit, timestamp, weighted category scores, evidence paths, ROI proposals, and pending manual checks. Keep historical reports so phase-to-phase changes are visible.
