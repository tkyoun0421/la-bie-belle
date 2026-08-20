---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69"
---

# Common Rules

The constitution for agent collaboration on La Bie Belle. When another document contradicts the rules set under `docs/rules/`, the rules set wins. Only the orchestrator amends it, and only through a PR.

## Module map

Rules are split along three axes. Load `docs/rules/common.md` always, your own role file always, and a matcher only when its situation occurs.

| Axis | Path | When to load |
|------|------|--------------|
| Always | `docs/rules/common.md` | Every task |
| Who | `docs/rules/roles/<role>.md` | Every task, for the role in `.agent-role` |
| When | `docs/rules/matchers/<situation>.md` | Only when that situation occurs |

| Matcher | Load it when |
|---------|--------------|
| `writing-docs.md` | Creating or editing anything under `docs/` |
| `publishing-issues.md` | Opening a GitHub Issue or moving a board card |
| `opening-a-pr.md` | Opening a PR, or pushing a fix to an open one |
| `reviewing-a-pr.md` | Reviewing a PR and assigning severity to findings |
| `review-failed.md` | A review came back FAIL, or you received a fix order |
| `blocked.md` | You cannot proceed and must stop |
| `parallel-work.md` | Splitting work across subagents or worktrees |
| `handling-secrets.md` | Touching credentials or `.env*` files |

## Roles and workspaces

| Worktree | Agent | Owns |
|----------|-------|------|
| `main` checkout | Orchestrator (`@orchestrator`) | `docs/rules/`, `docs/templates/`, `config/`, `.claude/`, `.githooks/`, `.github/` — with access to every path |
| `pm` | PM (`@agent-pm`) | `docs/prd.md`, `docs/domain/`, `docs/adr/`, `docs/specs/` |
| `dev` | Dev (`@agent-dev`) | `docs/architecture/` (technical decisions under `architecture/decisions/` as TDRs), `src/`, root development config |
| `ui` | UI (`@agent-ui`) | `docs/ui/` — never code |

`config/ownership.json` is the machine-readable source of truth for ownership. Where it disagrees with the table above, the JSON wins.

Never edit a path you do not own. Open a `[Request]` Issue for the owning agent instead.

Each worktree carries its identity in two untracked files: `CLAUDE.local.md` holds the instructions, `.agent-role` holds the role marker the enforcement hooks read.

Coding standards and conventions live in `docs/architecture/overview.md`, owned by Dev and written during the first design pass.

## Branches, PRs, and merges

Branches are short-lived and scoped to one task. At the start of every task, run `git fetch origin` and cut a fresh `<role>/<task-name>` branch from `origin/main` — `pm/…`, `dev/…`, `ui/…`, `orch/…`. Long-lived branches are forbidden.

Never commit directly to `main`. Every change, the orchestrator's included, lands through a PR.

Only the orchestrator merges, and always as a **squash merge** — one commit on `main` per unit of work. A merge requires a PASS from the independent `pr-reviewer` agent. Nobody reviews their own PR. Once the product is deployed, merge authority moves to a human.

PR titles use `type(scope): summary`, and the body carries the related Issue number and the change impact. Commit message conventions are enforced at the PR level only; commits during the work are free-form. See `docs/rules/matchers/opening-a-pr.md`.

## Work tracking

Tasks are tracked in GitHub Issues. History is tracked in `git log` and PR diffs. There is no separate tasks file and no changelog file.

The single source of truth for a specification is the file under `docs/specs/`. An Issue body carries a summary and a link, never a copy of the detail. Corrections go to the file.

Feature implementation comes before design. Applying a design is a separate slice, taken up after the `docs/ui/` specification exists.

Status lives in the Status field of the [La Bie Belle](https://github.com/users/tkyoun0421/projects/8) project board, not in labels. See `docs/rules/matchers/publishing-issues.md`.

## Language

Local documents are written in **English** — everything under `docs/` and `.claude/`. English keeps agent context cheap and unambiguous.

GitHub artifacts are written in **Korean** — Issue titles and bodies, PR titles and bodies, and every comment. A human reads those directly.

Code, commands, identifiers, file paths, CLI flags, and commit type keywords (`feat`, `fix`, …) stay verbatim in both languages.

One exception: a skill's `description` field may carry Korean trigger phrases. That field is matched against what the user types, and the user types Korean.

## Communication

**The record is canonical; the bell is only a signal.** Every instruction, request, and report between agents is written to GitHub — a PR comment or an Issue. The Orca `terminal send` bell carries one line that says "go look". An instruction delivered only through a terminal did not happen.

A PR is itself the completion report: the role opens the PR and rings the orchestrator.

Merge news is not broadcast. The orchestrator forwards a merge only when it creates the next piece of work for a specific role — a merged SPEC hands slicing to Dev, a merged feature hands review to UI. Everything else, each role picks up naturally when it pulls `main` at the start of its next task.

## Enforcement

Two mechanisms guard ownership, and both **fail closed**: a broken `config/ownership.json` or an unregistered role in `.agent-role` blocks rather than allows. Only the orchestrator, which has no `.agent-role`, runs unchecked.

- **PreToolUse hook** `.claude/hooks/ownership-guard.sh` (logic in `ownership-check.py`) rejects `Edit`, `Write`, and `NotebookEdit` on paths outside the role's ownership at the moment of editing. Absolute paths outside the role's own worktree are rejected too, including other worktrees; temp directories and `~/.claude` are the exceptions.
- **pre-commit hook** `.githooks/pre-commit` checks ownership of staged changes — additions, modifications, deletions, and both sides of a rename — and blocks any `.env*` or `.envrc` anywhere in the tree, with `.env.example` as the only exception. After cloning or resetting the repo, run `git config core.hooksPath .githooks` once.

Known limit: a role agent can disable its own guard with `git commit --no-verify` or by editing `.agent-role`. That is a rule violation, and the last line of defence is the independent PR review — the reviewer always cross-checks the branch prefix against the ownership of every changed path.

## Ground rules

- The repository is **public**. See `docs/rules/matchers/handling-secrets.md`.
- Output from the previous project, on the `snapshot/2026-08-20-pre-reset` branch, is off limits. This project starts from a blank slate.

## Open items

Amend this rules set once these are decided.

- Document index and search script (tsx)
- Automated test harness for the ownership guards (#63)
