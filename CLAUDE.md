# CLAUDE.md

Guidance for Claude Code (claude.ai/code) in this repository.

**This file is a signpost, not a source of truth.** Every section links to the document that owns the rule. When this file and a linked document disagree, the linked document wins.

## Project Overview

La Bie Belle (라비에벨) is a mobile PWA for wedding hall shift management — shift requests, position assignments, attendance records, estimated pay. It replaces group chat and manual assignment sheets. Product specs are in Korean; code is in English.

Phase 0 (foundation). The Next.js app skeleton exists; no Supabase, tests, or CI yet.

## Document map

Upper layers govern lower ones. Rationale: [ADR-0013](docs/standards/adr/0013-project-layer-structure.md).

| Layer | Owns | Canonical documents |
|-------|------|---------------------|
| L1 Collaboration | How work is done | [WORKFLOW](docs/workflow/WORKFLOW.md) · [HANDOFF](docs/workflow/HANDOFF.md) · [REVIEW](docs/workflow/REVIEW.md) · [TOOLING](docs/workflow/TOOLING.md) |
| L2 Product/Domain | What is built and why | [PRD](docs/product/PRD.md) · [DOMAIN](docs/product/DOMAIN.md) · [DESIGN](docs/product/DESIGN.md) · [DECISIONS](docs/product/DECISIONS.md) (읽기 대장) |
| L3 Standards | Common technical basis | [ARCHITECTURE](docs/standards/ARCHITECTURE.md) · [DEVELOPMENT](docs/standards/DEVELOPMENT.md) · [adr/](docs/standards/adr/README.md) |
| L4 Planning/Execution | State and evidence | [phases/](docs/execution/phases/README.md) · `radio/` · `runs/` · `reviews/` · `dashboard/` |
| L5 Code | Implementation | `src/`, `tests/` (future) |

`CLAUDE.md` and `.claude/` sit at the repo root because tooling requires it; logically they belong to L1.

When documents conflict, do not silently pick one. Reconcile in this order:
**PRD → DOMAIN → ADR → ARCHITECTURE → DEVELOPMENT/RADIO → phase doc → `index.jsonl`**

## Read first

Start every task by reading [WORKFLOW](docs/workflow/WORKFLOW.md). It owns the five-stage pipeline, the approval gates, and the continuous loop.

`기획 → 설계 → 개발 → 검증 → 리팩토링` (planning → design → development → verification → refactoring)

## Non-negotiable rules

- **Two approval gates only** — stages 1 and 2. Never advance a task past either without explicit user approval. Interviews produce no code; execution makes no design decisions. Screen design is settled inside stage 2 and sealed with the RADIO — it adds no third gate ([`/publish-ui`](.claude/skills/publish-ui/SKILL.md)).
- **At most one `in_progress` task**, repo-wide. The loop is sequential, never parallel.
- **Approvals live in [`index.jsonl`](docs/execution/phases/index.jsonl)**, not in prose. All current tasks use `dual-approval-v3` (product approval + SHA-256-bound RADIO approval).
- **Never reuse or delete** task IDs, dependencies, or statuses. Never retroactively edit a `done` task's history or approval hashes.
- **Work discovered mid-implementation** becomes a proposal for the right stage — never folded silently into the current task.
- **Authority and PII are enforced at the server boundary and in DB policy**, not just the UI. Server modules declare `import "server-only"` as their first import.
- **Code carries no explanatory comments.** Intent lives in names and structure; rationale in the task's RADIO and handoff (`DEV-CODE-07`). Enforced by lint inside `src/`; elsewhere it still applies but is kept by review.
- **No barrel files.** Import through the real path — `@/views/shift/ui/ShiftCard`, not a slice `index.ts`.
- **Nothing outside MVP scope.** Deferred items need explicit approval before entering a phase.
- **Commit messages must contain a task ID** matching `P[0-9]+-T[0-9]{2}`.

## Commands

Full reference, gate semantics, and hook behavior: [TOOLING](docs/workflow/TOOLING.md).

```bash
pnpm dev / build / start      # Next.js 16 + Turbopack
pnpm lint / format            # ESLint · Prettier — src/ only
pnpm test / test:e2e          # Vitest · Playwright (mobile)
pnpm typecheck                # next typegen + tsc --noEmit
pnpm verify                   # the single CI command: format → lint → types → test → build → e2e → gates

pnpm gate:all                 # index · RADIO hash · handoff · TDD evidence · commit scope · retrospective · docs · design tokens
pnpm design:build <시안.html>  # inline Tailwind CSS and the font into a mockup for Artifact publishing
pnpm harness:self-test        # harness test suite
pnpm dashboard                # regenerate the read-only ops dashboard (3 pages)
```

Structure rules live in `config/fsd.json` — layer order, per-segment test/export/import rules. **ESLint and `.claude/hooks/tdd-guard.sh` both read that one file**, so changing it moves both. Rule meanings: [DEVELOPMENT](docs/standards/DEVELOPMENT.md) (`DEV-NAME-*`).

Individual gates (`gate:index`, `gate:radio`, `gate:handoff`, `gate:tdd`, `gate:scope`, `gate:retro`, `gate:docs`, `gate:tokens`) run standalone; a passing gate prints nothing and exits 0.

Git hooks (`core.hooksPath` = `.githooks`): pre-commit runs the six repo gates → lint-staged → incremental typecheck → unit tests; pre-push runs the build; commit-msg requires a task ID. A Claude Code `PreToolUse` hook (`.claude/hooks/tdd-guard.sh`) denies edits to `src/` code whose segment requires a test that does not exist.

**Next.js 16 differs from most training data.** Read the relevant guide under `node_modules/next/dist/docs/` before writing framework code.

## Architecture

Feature Sliced Design with server-first defaults. Rules: [DEVELOPMENT](docs/standards/DEVELOPMENT.md) (`DEV-ARCH`), [ADR-0008](docs/standards/adr/0008-fsd-server-first-development-guards.md), [ADR-0014](docs/standards/adr/0014-fsd-view-layer-naming.md).

```
src/
  app/        # Next.js routes, layouts, providers (thin adapters only)
  views/      # Route-level screen composition (FSD "pages", renamed — src/pages/ is reserved by Next.js)
  widgets/    # Independent screen blocks
  features/   # User actions, Server Actions, mutations
  entities/   # Domain models, pure rules, DTOs
  shared/     # Reusable UI, config, common server client base
```

Imports flow top → bottom only. Layer directories are created when first used, not upfront. Path aliases (`@/views/*`, `@/shared/*`, …) carry no file extension.

Stack: Next.js App Router · TypeScript · Tailwind v4 + shadcn/ui · Supabase (Auth, PostgreSQL, RLS) · TanStack Query · Zod · Vitest/Playwright · Vercel. Details: [ARCHITECTURE](docs/standards/ARCHITECTURE.md).

## Domain

Five boundaries — IDENTITY, SCHEDULING, ATTENDANCE, NOTIFICATIONS, PAY. Aggregate ownership and shared language: [DOMAIN](docs/product/DOMAIN.md).

Product invariants (attendance timestamps are server-generated and immutable; estimated pay uses scheduled hours; trainees are excluded from headcount; …) are owned by [PRD](docs/product/PRD.md). Changes to authority, estimated pay, attendance, or account recovery require regression tests.

The `DEV-*` conventions — including `DEV-SSOT`, `DEV-SEC`, `DEV-DATA`, `DEV-TEST`, `DEV-CACHE`, `DEV-OFFLINE` — are owned by [DEVELOPMENT](docs/standards/DEVELOPMENT.md). Read them before writing code in a new area.
