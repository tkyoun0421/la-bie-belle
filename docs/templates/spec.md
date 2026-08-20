---
owner: "@agent-pm"
status: "draft"
related_adr: ""
related_issue: ""
---

# Spec: {feature}

This file is the single source of truth for the feature. The `[Epic]` Issue links here and carries a summary only.

## Summary

What the feature does, in one paragraph, from the user's side.

## User value

Why a user wants this. If the answer is "because the system needs it", this is not a feature — it is an implementation detail of one.

## Scope

**In** — the behaviour this spec covers.

**Out** — behaviour deliberately excluded, and where it will be handled instead if it will be.

## Flow

The path through the feature, step by step. Name the screens and the decision points. No file paths, no code.

## Domain rules

The rules the feature must respect, in the vocabulary of `docs/domain/`. Link the domain file rather than restating its definitions.

## Acceptance criteria

Numbered, each in Given / When / Then form. These are what Dev slices against and what the reviewer checks, so each one has to be verifiable on its own.

1. **Given** {starting state} **when** {the user does X} **then** {the observable result}.

## Data and state

What is stored, what changes, and what survives a refresh or a crash. Shapes and meanings, not schemas.

## Errors and edge cases

What happens when it goes wrong: invalid input, a conflict with someone else's action, a failed external call, an empty result. Each one gets the behaviour the user sees.

## Open questions
