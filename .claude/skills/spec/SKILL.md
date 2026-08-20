---
name: spec
description: "Writes docs/specs/<feature>.md — the single source of truth for one feature — and publishes the matching [Epic] Issue. Normally reached through the /doc router. PM only."
---

# Spec

`docs/specs/<feature>.md`, from `docs/templates/spec.md`. This file is canonical; the Epic links to it.

## Gather

Unless the router already handed you citations, run `docs-locator` for the domain vocabulary this feature touches and any decision record that constrains it. A spec that renames a domain term or contradicts an accepted ADR is a defect, not a proposal.

Synthesise from what the conversation and the repository already hold. If the feature has not been discussed at all, call the `grilling` skill first. It is not vendored into this repository, so when it is unavailable, ask directly for what the template needs.

## Acceptance criteria carry the weight

Everything else in the spec is context; the numbered Given / When / Then list is what Dev slices against and what the reviewer checks.

Each criterion is verifiable on its own, names an observable result rather than an internal state, and covers one path. Split "the booking is saved and the guest is emailed" into two — they fail independently.

The list is not done when the happy path is covered. Invalid input, a conflict with someone else's action, a failed external call, an empty result: each gets a criterion, or gets named under Out of scope.

## Write

Dispatch `docs-generator` with the template, the target path, and everything gathered. Use the domain vocabulary exactly as `docs/domain/` defines it — link the domain file rather than restating definitions.

No file paths, no code snippets. The exception is a shape that carries a decision more precisely than prose can — a state machine, a schema — trimmed to the decision.

## Publish

Two dispatches, in order.

1. `gh-issue-generator` — an `[Epic]` Issue in Korean carrying a link to the spec file and a summary, never a copy of the detail. It applies the labels and puts the card on the board.
2. `gh-pr-generator` — the PR for the spec file, referencing the Epic.

## Editing an existing spec

Corrections go to the file, never to the Issue body. When a merged spec changes and slices are already open against it, say so in the PR body — Dev needs to know which slices moved under them.
