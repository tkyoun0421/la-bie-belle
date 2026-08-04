# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

La Bie Belle (라비에벨) is a mobile PWA for wedding hall shift management — handling shift requests, position assignments, attendance records, and estimated pay. The goal is to replace group chat and manual assignment sheets entirely. Product specs are in Korean; code is in English.

## Five-Layer Structure

Upper layers govern lower layers. When documents conflict, the upper layer wins. Rationale: `docs/standards/adr/0013-project-layer-structure.md`.

| Layer | Location | Owns |
|-------|----------|------|
| L1 Collaboration | `CLAUDE.md`, `.claude/`, `docs/workflow/` | How work is done: stages, approvals, handoff |
| L2 Product/Domain | `docs/product/` | What is built and why: PRD, DOMAIN, DESIGN |
| L3 Standards | `docs/standards/` | ARCHITECTURE, DEVELOPMENT (`DEV-*`), `adr/` |
| L4 Planning/Execution | `docs/execution/` | `phases/`, `radio/`, `runs/`, `reviews/`, `dashboard/` — state, evidence and derived views |
| L5 Code | `src/`, `tests/` (future) | Implementation and tests |

`CLAUDE.md` and `.claude/` stay at the repo root because tooling requires it, but they belong to L1 logically. This file is a summary — `docs/workflow/` is the authoritative source.

## Five-Stage Pipeline

Every task moves through one sequential pipeline. **Read `docs/workflow/WORKFLOW.md` first.** There are no parallel tracks; the former Track A1/A2/B naming is retired.

`기획 (Planning) → 설계 (Design) → 개발 (Development) → 검증 (Verification) → 리팩토링 (Refactoring)`

| Stage | Owner | Approval gate | Resulting status |
|-------|-------|---------------|------------------|
| 1. Planning | User + AI interview | **Product approval** | `design_pending` |
| 2. Design | User + AI interview | **RADIO approval** (SHA-256 bound) | `planned` |
| 3. Development | AI execution | none | `in_progress` |
| 4. Verification | AI execution | none | `in_progress` |
| 5. Refactoring | AI execution | none | `done` |

- Only stages 1 and 2 have approval gates. AI must never advance a task without explicit user approval.
- User control lives at the two approval gates, not in per-task execution orders.
- Interviews do not produce code. Execution does not make design decisions — it returns to stage 1 (product) or stage 2 (technical).
- Record a handoff at every stage boundary per `docs/workflow/HANDOFF.md`: harness runs write `docs/execution/runs/<task-id>/handoff.md`, interviews write `docs/execution/runs/interviews/<date-topic>.md`.

## Continuous Engineering Loop

Stages 3–5 do not stop after one task. The loop runs `planned` tasks continuously in dependency order until the queue is empty. Authoritative rule: `docs/workflow/WORKFLOW.md` (연속 루프 규칙), rationale: ADR-0013 §4.

- At most one `in_progress` task at a time — the loop is sequential, never parallel.
- Candidates are `planned` tasks with both approvals, a valid execution contract, and all `depends_on` tasks `done`.
- Queue empty → end the loop normally and report all results at once.
- A task needing a new product/technical decision, or exceeding the retry limit, is marked `blocked` with a decision signal and handoff; the loop then continues with the next `planned` task that does not depend on it.
- At loop end, report the collected `blocked` list with reasons. Blocked tasks re-enter the queue only after the relevant interview stage resolves and re-approves them.
- An explicit user instruction to run a single task ID overrides the loop.

## Task Lifecycle

`proposed` → `design_pending` → `planned` → `in_progress` → `done`
(`blocked`, `verification_pending`, `skipped` are also valid states — see `docs/execution/phases/README.md`.)

- Task index: `docs/execution/phases/index.jsonl` (one JSON object per line)
- Schema: `docs/execution/phases/index.schema.json`
- At most one `in_progress` task at a time, repo-wide
- All current/new tasks use `dual-approval-v3` (product + RADIO approval required)
- Approved RADIO documents live at `docs/execution/radio/<task-id>-radio.md`
- Commit messages must contain task ID matching `P[0-9]+-T[0-9]{2}`

### Index rules

- Every task needs at least one valid `spec_refs` entry. `spec_refs` are tracking links, not copied requirements.
- Never reuse or delete task IDs, dependencies, or statuses. Abandoned tasks keep their ID and history.
- Work discovered mid-implementation is recorded as a proposal for the right stage, never folded silently into the current task.
- Changes that break a `done` task's acceptance criteria go into a new task with an agreed regression scope.
- Completed tasks' execution history and approval hashes are never altered retroactively.

## Implementation Principles

- Do not build anything outside MVP scope. Deferred items need explicit approval before entering a phase.
- PII and authority checks are enforced at the server boundary and in DB policy, not just the UI.
- Changes to authority, estimated pay, attendance, or account recovery require regression tests.
- Design implementation follows only the Design scope approved in the planning stage.

## Commands

The five-stage pipeline is enforced by a lightweight gate harness in `harness/` (P0-T31). It has zero runtime dependencies and runs TypeScript directly via Node 22 type stripping (`node --experimental-strip-types`), so `engines.node` requires Node >= 22.6.

```bash
pnpm gate:index          # index.jsonl: JSON lines + index.schema.json + state rules
pnpm gate:radio          # planned/in_progress tasks: radio_sha256 == actual RADIO file hash
pnpm gate:handoff        # handoff.md exists with the 7 required fields (optional arg: task ID)
pnpm gate:tdd            # tdd.json of a test_mode=tdd task proves RED before GREEN per command
pnpm gate:scope          # staged files stay inside the current task RADIO's 변경 허용 경로 globs
pnpm gate:all            # the five gates above in one run
pnpm harness:self-test   # node:test suite for all six gates, incl. hook acceptance in a temp repo
pnpm harness:typecheck   # tsc --noEmit over harness/
pnpm dashboard           # regenerate docs/execution/dashboard/index.html (read-only ops dashboard)
```

- Gate state rules: at most one `in_progress` task, no `planned`/`in_progress` task without both approvals and `radio_ref`, every `depends_on` id exists, every record has at least one `spec_refs` entry.
- A gate that passes prints nothing and exits 0. Violations go to stderr in Korean with the offending file and a fix hint, exit code 1.
- The current task is the single `in_progress` task. With none, the TDD and commit-scope gates pass so workflow meta commits stay possible; the index and RADIO hash gates always run.
- `gate:handoff`, `gate:tdd`, and `gate:scope` target the current `in_progress` task when given no argument.
- Layout: `harness/gates/` (entry points), `harness/lib/` (judgement logic, pure functions plus thin IO), `harness/dashboard/` (dashboard generator), `harness/self-test/` (fixtures and tests).
- Commit scope comes from the `## 변경 허용 경로` section of the task's approved RADIO: the first fenced code block, one glob per line, sealed by the approval SHA-256.

### Operations dashboard (P0-T29)

`pnpm dashboard` writes one self-contained HTML file — inline CSS, zero external resources, mobile first — to `docs/execution/dashboard/index.html`. Contract: `docs/standards/adr/0012-static-operations-dashboard.md`.

- Four sections: 진행도, 준비도 루브릭, 검증, 다음 행동·차단, plus the base time and base commit at the top.
- Readiness is machine judged out of 100: contract compliance 40 (repository-gate pass rate over index·radio·handoff·tdd, reusing `harness/lib` gates; scope and commit-msg are shown as reference only), evidence completeness 25, execution readiness 20, document freshness 15 (regeneration compliance is measured against the `base-commit` marker of the previously committed artifact). Grades: 90+ 우수, 70–89 양호, below 70 주의. Every score shows the numbers behind it.
- Read-only derivation. It never writes to `index.jsonl`, `runs/`, or `reviews/`, and never approves or transitions anything. Missing or malformed sources render as 누락 / 결과 없음 / 형식 오류 instead of guessed values; generation failure is advisory and never blocks a task.
- Regenerate after a task reaches `done`/`blocked`/`skipped` or a phase boundary changes.

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
| `docs/standards/adr/*.md` | Irreversible architectural decisions (0012 and 0013 accepted) |
| `docs/standards/ARCHITECTURE.md` | System structure, data models, tech stack |
| `docs/standards/DEVELOPMENT.md` | DEV-* conventions, FSD rules, testing, RADIO format |
| `docs/execution/radio/<id>-radio.md` | Task-specific technical design |
| `docs/execution/phases/index.jsonl` | Execution state, dependencies, verification |
| `docs/execution/runs/` | Execution evidence and stage handoffs |
| `docs/execution/dashboard/index.html` | Generated read-only operations view (derived, never a source of truth) |

## Git Hooks

`core.hooksPath` is `.githooks`.

- **pre-commit:** Runs `harness/gates/pre-commit.ts` — index, RADIO hash, TDD evidence, and commit scope gates. All four run so every violation is reported at once.
- **commit-msg:** Requires a task ID matching `P[0-9]+-T[0-9]{2}` in the message body; comment lines do not count.
- Local hooks are still bypassable with `--no-verify`. That is a git limitation, compensated by re-running `pnpm gate:all` in CI (P0-T05).

## Claude Code Hooks

`.claude/settings.json` registers a `PreToolUse` hook on `Write`/`Edit`/`MultiEdit`:

- **`.claude/hooks/tdd-guard.sh`:** Denies edits to business-logic source under `src/` when no matching test file exists. Exempt: `src/app/**` (route adapters), `**/ui/**` and `**/components/**` (presentation), `**/types/**`, `*.d.ts`, `*.config.*`, slice `index.ts` barrels, and non-source files. Test lookup order: sibling `*.test.*`/`*.spec.*` → `__tests__/` (same or parent dir) → `src/__tests__/` → root `tests/` tree.

Requires `jq`. Without it the hook warns on stderr and allows the edit.
