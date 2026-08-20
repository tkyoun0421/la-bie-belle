---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Parallel work

Load this when splitting work across subagents or worktrees.

## Between roles

Always allowed. PM, Dev, and UI run at the same time by design, and they integrate through `main` — never by reaching into each other's folders.

Never read or edit another role's worktree directory. Another agent may be mid-edit there, and its working tree is not a source of truth. Read `origin/main` instead.

## Inside one worktree

Read-only subagents can run in parallel freely.

Writing subagents cannot share a checkout. When you parallelise write work, give each unit its own temporary worktree (`isolation: worktree`). Two agents editing one checkout produce interleaved edits that no diff can untangle.

## Sequencing slices

Slices that touch the same files run in sequence, not in parallel — the merge order decides the outcome, and racing them just moves the conflict to review.

A wide mechanical refactor never runs beside feature work on the same paths. Land the refactor first, then rebase the features onto it.

## Reviewing parallel output

When several subagents write, audit the combined diff for deletions before opening the PR: `git diff --name-status origin/main`. An agent that rewrote a settled document instead of adding to it shows up as a modification you did not ask for.
