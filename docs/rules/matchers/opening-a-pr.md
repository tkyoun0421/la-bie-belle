---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Opening a PR

Load this when opening a PR or pushing a fix to one that is already open.

PR titles and bodies are written in Korean. See the language rule in `common.md`.

## Title and body

The title is `type(scope): 요약`. The body carries the related Issue number (`Closes #N`, so the merge closes it automatically) and the change impact — Domain, Spec, and Arch.

Commit message conventions are enforced at the PR level only. Commits made during the work are free-form.

## After you open it

Move your board card to **In Review**, then ring the orchestrator session. Opening the PR is the completion report; the bell is only the signal.

You do not review your own PR.

## Pushing a fix

A fix for a `critical` or `high` finding goes to the **same PR** as a new push, never to a new PR, and is re-reviewed. See `matchers/review-failed.md`.
