# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

La Bie Belle (라비에벨) is a mobile PWA for wedding hall shift management — handling shift requests, position assignments, attendance records, and estimated pay. The goal is to replace group chat and manual assignment sheets entirely. Product specs are in Korean; code is in English.

## Five-Layer Structure

Upper layers govern lower layers. When documents conflict, the upper layer wins. Rationale: `docs/standards/adr/0013-project-layer-structure.md`.

| Layer | Location | Owns |
|-------|----------|------|
| L1 Collaboration | `CLAUDE.md`, `AGENTS.md`, `.claude/`, `docs/workflow/` | How work is done: stages, approvals, handoff |
| L2 Product/Domain | `docs/product/` | What is built and why: PRD, DOMAIN, DESIGN |
| L3 Standards | `docs/standards/` | ARCHITECTURE, DEVELOPMENT (`DEV-*`), `adr/` |
| L4 Planning/Execution | `docs/execution/` | `phases/`, `radio/`, `runs/` — state and evidence |
| L5 Code | `src/`, `tests/` (future) | Implementation and tests |

`CLAUDE.md`, `AGENTS.md`, and `.claude/` stay at the repo root because tooling requires it, but they belong to L1 logically. They are summaries — `docs/workflow/` is the authoritative source.

## Five-Stage Pipeline

Every task moves through one sequential pipeline. **Read `docs/workflow/WORKFLOW.md` and `AGENTS.md` first.** There are no parallel tracks; the former Track A1/A2/B naming is retired.

`기획 (Planning) → 설계 (Design) → 개발 (Development) → 검증 (Verification) → 리팩토링 (Refactoring)`

| Stage | Owner | Approval gate | Resulting status |
|-------|-------|---------------|------------------|
| 1. Planning | User + AI interview | **Product approval** | `design_pending` |
| 2. Design | User + AI interview | **RADIO approval** (SHA-256 bound) | `planned` |
| 3. Development | AI execution | none | `in_progress` |
| 4. Verification | AI execution | none | `in_progress` |
| 5. Refactoring | AI execution | none | `done` |

- Only stages 1 and 2 have approval gates. AI must never advance a task without explicit user approval.
- Stages 3–5 run only on a user-specified task ID. No auto-selection of the next task.
- Interviews do not produce code. Execution does not make design decisions — it returns to stage 1 (product) or stage 2 (technical).
- Record a handoff at every stage boundary per `docs/workflow/HANDOFF.md`: harness runs write `docs/execution/runs/<task-id>/handoff.md`, interviews write `docs/execution/runs/interviews/<date-topic>.md`.

## Task Lifecycle

`proposed` → `design_pending` → `planned` → `in_progress` → `done`

- Task index: `docs/execution/phases/index.jsonl` (one JSON object per line)
- Schema: `docs/execution/phases/index.schema.json`
- At most one `in_progress` task at a time
- All current/new tasks use `dual-approval-v3` (product + RADIO approval required)
- Approved RADIO documents live at `docs/execution/radio/<task-id>-radio.md`
- Commit messages must contain task ID matching `P[0-9]+-T[0-9]{2}`

## Commands

The previous harness was removed during the structure reorganization, so `package.json` currently has no scripts. The five-stage execution harness and its commands are rebuilt in **P0-T31**. Until then, stage order and approval gates are enforced by document contract, not tooling.

No production app build/lint/test commands exist yet — the project is in Phase 0 (foundation/planning).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth + Google OAuth |
| Database | PostgreSQL (Supabase, Seoul region) |
| Authorization | PostgreSQL RLS + server functions |
| Testing | Vitest, Playwright, SQL/RLS tests |
| State | TanStack Query + Server Components |
| Validation | Zod |
| Hosting | Vercel |

## Architecture: FSD + Server-First

Feature Sliced Design with unidirectional imports (top → bottom only):

```
src/
  app/        # Next.js routes, layouts, providers (thin adapters only)
  pages/      # Route-level screen composition
  widgets/    # Independent screen blocks
  features/   # User actions, Server Actions, mutations
  entities/   # Domain models, pure rules, DTOs
  shared/     # Reusable UI, config, common server client base
```

Key rules (`DEV-ARCH` from `docs/standards/DEVELOPMENT.md`):
- UI never imports DB, secrets, or server modules
- Server modules must declare `import "server-only"` as first import
- Entity owns domain models, state transitions, pure rules, and DTOs
- Multi-entity commands go in `features/*/api`

## Five Domain Boundaries

IDENTITY, SCHEDULING, ATTENDANCE, NOTIFICATIONS, PAY — each with clear aggregate ownership defined in `docs/product/DOMAIN.md`.

## Critical DEV Rules

All `DEV-*` rules are in `docs/standards/DEVELOPMENT.md`. Key mandatory (`MUST`) rules:

- **DEV-SSOT:** One authoritative owner per business fact. Client cache ≠ business truth. Server validates every request.
- **DEV-SEC:** UI hiding is not a security boundary. Authority enforced at server + DB. No tokens/secrets/PII in logs.
- **DEV-DATA:** DB constraints (`NOT NULL`, `CHECK`, `UNIQUE`, FK, RLS) enforce semantic invariants. Multi-write commands need explicit transactions.
- **DEV-TEST:** Pure rules → unit tests. Server actions/RLS → real PostgreSQL. Bug fixes require RED test first.
- **DEV-CACHE:** Private data never in shared cache or browser storage. Mutation → explicit cache invalidation.
- **DEV-OFFLINE:** Only app shell + public resources offline. No private data offline, no offline mutation queue.

## Product Invariants

- Attendance timestamps are server-generated and immutable
- Staff shortfall warns but does not block schedule confirmation
- Trainees excluded from headcount
- One worker with multiple positions fulfills all required positions
- Estimated pay based on scheduled hours, not actual time
- Rehearsal is self-recorded, not official attendance

## Documentation Hierarchy

When documents conflict, do not silently pick one. Stop and reconcile in order:

**PRD** → **Domain** → **ADR** → **Architecture** → **Development/RADIO** → **Phase** → **index.jsonl**

| Document | Governs |
|----------|---------|
| `docs/workflow/WORKFLOW.md` | Five-stage pipeline, approval gates, return rules |
| `docs/workflow/HANDOFF.md` | Handoff format and location |
| `docs/product/PRD.md` | Product behavior, scope, invariants |
| `docs/product/DOMAIN.md` | Shared language, aggregate boundaries |
| `docs/product/DESIGN.md` | Visual language, interaction patterns, component specs |
| `docs/standards/adr/*.md` | Irreversible architectural decisions (0013 accepted; 0012 on hold) |
| `docs/standards/ARCHITECTURE.md` | System structure, data models, tech stack |
| `docs/standards/DEVELOPMENT.md` | DEV-* conventions, FSD rules, testing, RADIO format |
| `docs/execution/radio/<id>-radio.md` | Task-specific technical design |
| `docs/execution/phases/index.jsonl` | Execution state, dependencies, verification |
| `docs/execution/runs/` | Execution evidence and stage handoffs |

## Git Hooks

- **commit-msg:** Validates task ID format (`P[0-9]+-T[0-9]{2}`)
- **pre-commit:** Currently calls the removed harness guard and will fail. It is rewired in P0-T31; until then commits may need `--no-verify`.

## Claude Code Hooks

`.claude/settings.json` registers a `PreToolUse` hook on `Write`/`Edit`/`MultiEdit`:

- **`.claude/hooks/tdd-guard.sh`:** Denies edits to business-logic source under `src/` when no matching test file exists. Exempt: `src/app/**` (route adapters), `**/ui/**` and `**/components/**` (presentation), `**/types/**`, `*.d.ts`, `*.config.*`, slice `index.ts` barrels, and non-source files. Test lookup order: sibling `*.test.*`/`*.spec.*` → `__tests__/` (same or parent dir) → `src/__tests__/` → root `tests/` tree.

Requires `jq`. Without it the hook warns on stderr and allows the edit.
