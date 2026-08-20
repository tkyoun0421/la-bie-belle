---
owner: "@agent-ui"
status: "draft"
related_adr: ""
related_issue: ""
---

# UI: {screen}

Written after the screen is implemented, from reviewing the real thing. Dev applies it as a separate slice.

## Screen

Which screen this covers and where a user arrives from.

## Layout

Structure and spacing: what sits where, how it stacks, what the rhythm between blocks is. Describe by value — "24px between the form and the summary" — not by class name or file.

## Type and colour

Sizes, weights, and colours by value and role. Name the role too: "primary action", "muted metadata".

## States

Every state the elements can be in, and what each looks like: default, hover, focus, active, disabled, loading, empty, error. A state with no entry here is a state Dev will guess at.

## Responsive

What changes at which width, and what must never wrap or truncate.

## Accessibility

Focus order, contrast requirements, labels for anything conveyed by colour or icon alone, and keyboard paths through the screen.

## Out of scope

What this pass deliberately leaves alone, so the next review does not treat it as an omission.

## Open questions

Anything the implemented screen left ambiguous and the review could not settle alone. Written as questions.
