---
owner: "@agent-pm"
status: "draft"
related_adr: ""
related_issue: ""
---

# Domain: {topic}

One or two sentences on what this part of the domain covers and why it exists as its own area.

## Language

Be opinionated. When several words mean the same thing, pick one and list the rest under _Avoid_ so nobody reintroduces them.

**{Term}**
What it is, in one or two sentences. Define what it *is*, not what it does.
_Avoid_: {synonyms that must not be used}

Only terms specific to this project belong here. General programming concepts do not, however often the code uses them.

## Entities and relationships

The things that exist and how they connect. Cardinality matters: one booking has many guests, one guest has many bookings.

## Invariants

Statements that are always true, whatever the code does. "A booking never overlaps another booking on the same table" is an invariant — the implementation has to make it so, and a test should prove it.

## State transitions

For anything with a lifecycle, the states and the legal moves between them. Name the moves that are forbidden as well.

## Open questions

Terms still contested, boundaries not yet drawn, invariants you suspect but cannot yet state. Written as questions.
