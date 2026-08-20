---
name: arch
description: "Writes or edits docs/architecture/overview.md — the codebase's shape, conventions, and testing seams. Normally reached through the /doc router. Dev only."
---

# Architecture overview

`docs/architecture/overview.md`, from `docs/templates/architecture-overview.md`. One file, the only place coding standards live.

## Gather

Read the codebase before writing about it. What is actually there beats what was planned, and this document is worthless the moment the two diverge.

Run `docs-locator` for the TDRs already recorded — the overview indexes them, it does not re-argue them. A decision that carries lock-in belongs in a TDR with its alternatives and trade-offs; the overview gets one line and a link.

## Write

Dispatch `docs-generator` with the template, the target path, and what you found.

Write rules, not preferences. "Components are named after what they render, not where they sit" is a rule a reviewer can apply; "keep names clean" is not.

Say what does *not* belong in each directory as well as what does. The exclusions are what stop the structure from eroding.

For testing, name the prior art — the existing test whose shape another agent should copy. An abstract description of good tests produces none.

## Publish

Dispatch `gh-pr-generator`.

## Editing

This document accumulates and is read constantly. Change only what the request touches, and when a new convention contradicts an existing one, replace the old line rather than adding a second rule beside it — two conventions for the same thing is worse than none.
