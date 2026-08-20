---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Opening a PR

Load this when opening a PR or pushing a fix to one that is already open.

PR titles and bodies are written in **Korean**. A human reads them.

## Before you open it

The branch must be a fresh `<role>/<task-name>` cut from `origin/main` for this task alone. Every changed path must belong to your role in `config/ownership.json` — an `orch/` branch is the only exception.

## Title and body

The title is `type(scope): 요약`. The body carries:

- What changed and why, in a few sentences.
- `Closes #N` for the Issue it resolves, so the merge closes it automatically.
- Impact — Domain, Spec, and Arch. State "없음" where there is none rather than omitting the line.
- For a document change, confirmation that front matter was updated.

`.github/PULL_REQUEST_TEMPLATE.md` holds the exact shape.

## After you open it

Move your board card to **In Review**, then ring the orchestrator session with a single line pointing at the PR. The bell is a signal; the PR is the report. Never put the substance of the report in the terminal message.

You do not review your own PR. Wait for the orchestrator to dispatch `pr-reviewer`.

## Pushing a fix

A fix for a review finding goes to the **same PR** as a new push, never to a new PR. After pushing, say so in a PR comment so the re-review has something to anchor on. See `matchers/review-failed.md`.
