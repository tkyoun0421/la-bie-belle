---
owner: "@agent-dev"
status: "draft"
related_adr: ""
related_issue: ""
---

# Architecture Overview

The one place coding standards and conventions live. Written during the first design pass and kept current as the codebase grows.

## Purpose

What this codebase is and the shape it takes. One paragraph, enough that a new agent knows where it has landed.

## Stack

Languages, frameworks, and services in use, each with the job it does here. A choice that carries lock-in belongs in a TDR — link it rather than arguing it here.

## Structure

The top-level directories and what belongs in each. State what does *not* belong there too; that is what stops drift.

## Conventions

Naming, file layout, import order, error handling, logging — whatever a reviewer would otherwise flag by taste. Write the rule, not the preference: "components are named after what they render, not where they sit" beats "keep names clean".

## Testing

What gets tested and at which seam. Name the prior art — the existing test another agent should copy the shape of.

## Decisions

An index of the TDRs under `docs/architecture/decisions/`, newest first, each one line. The records themselves stay canonical; this is only the map.
