---
name: domain
description: "Writes or edits a document under docs/domain/ — the project's vocabulary, entities, invariants, and state transitions. Normally reached through the /doc router. PM only."
---

# Domain

`docs/domain/<topic>.md`, from `docs/templates/domain.md`.

## Gather

Run `docs-locator` first for existing domain files and any decision record that fixes a term. A second file defining the same word differently is worse than no file.

Then sharpen the language against what the user actually says.

- When a word is overloaded, force the split. "You said account — do you mean the Customer or the login? Those are different things."
- When two words mean one thing, pick one and list the other under `_Avoid_` so it does not come back.
- Test relationships with concrete scenarios rather than abstractions. "A party of six books a table for four and two people cancel — is that one booking or two?" An invariant that survives three such scenarios is worth writing down.

If the vocabulary has not been discussed at all yet, call the `grilling` skill and let it drive.

## Write

Dispatch `docs-generator` with the template, the target path, and the gathered vocabulary. Definitions stay to one or two sentences and say what a thing *is*, not what it does.

Only terms specific to this project belong here. General programming concepts do not, however often the code uses them.

## Publish

Dispatch `gh-pr-generator`.

If a term you are changing already appears in a merged spec, say so in the PR body. Renaming a word in the domain without touching the specs that use it leaves the two out of step.
