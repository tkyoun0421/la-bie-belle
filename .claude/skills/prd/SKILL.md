---
name: prd
description: "Writes or edits docs/prd.md, the product requirements document. Normally reached through the /doc router, which has already loaded the rules and cut the branch. PM only."
---

# PRD

One file, `docs/prd.md`, from `docs/templates/prd.md`.

## Gather

The PRD is the one document with no upstream source in the repository. Everything in it comes from the user.

If the conversation does not already contain the answers, call the `grilling` skill first and let it do the interviewing. It is not vendored into this repository, so when it is unavailable, ask directly for what the template needs and keep the questions to that. Do not build your own question list — `grilling` is sharper at it, and duplicating it means the user gets asked twice.

What the template needs answered: who has the problem and what it costs them today, what counts as success in measurable terms, what is deliberately out of scope, and the two or three journeys a user actually walks.

Nothing here is a guess. What the user has not decided goes to **Open questions** as a question.

## Write

Dispatch `docs-generator` with the template path, the target path, and everything gathered. It writes English and fills every section.

## Publish

Dispatch `gh-pr-generator`. The PRD produces no Epic — it is the source the specs are later cut from, not a unit of work.

## Editing an existing PRD

Read the current file first and change only what the request touches. A PRD accumulates; rewriting it wholesale loses decisions nobody remembers making. If a change contradicts something already there, say so rather than quietly replacing it.
