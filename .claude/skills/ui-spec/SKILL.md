---
name: ui-spec
description: "Writes docs/ui/<screen>.md — the visual and interaction finish of a screen that already exists. Normally reached through the /doc router. UI only, and never touches code."
---

# UI spec

`docs/ui/<screen>.md`, from `docs/templates/ui-spec.md`.

## Precondition

The screen must already be implemented. Design follows implementation here; there is nothing to review otherwise. If the screen does not exist yet, stop and say so rather than specifying it blind.

Run the app and look at the real screen. A spec written from the spec file instead of from the running screen documents what was intended, not what shipped, and the gap between those two is exactly what this document is for.

## Gather

Unless the router already handed you citations, run `docs-locator` for the feature spec behind the screen, so the states you describe match the states the feature actually has.

Walk every state deliberately: default, hover, focus, active, disabled, loading, empty, error. A state with no entry is a state Dev will guess at, and the guess will be wrong in a way nobody notices until a user hits it.

Check the keyboard path through the screen and anything conveyed by colour or icon alone.

## Write

Dispatch `docs-generator` with the template, the target path, and the observations.

Specify by value and by role — "24px between the form and the summary", "the primary action darkens 8% on hover". Never by class name, component name, or file path: those belong to Dev and they change without telling you.

Name what this pass deliberately leaves alone, under Out of scope, so the next review does not read it as an omission.

## Publish

Dispatch `gh-pr-generator`. The merge is what creates Dev's work — a UI spec landing on `main` is the signal that a slice applying it can be cut. Never hand Dev the change directly.
