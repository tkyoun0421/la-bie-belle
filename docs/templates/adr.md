---
owner: "@agent-pm"
status: "proposed"
related_adr: ""
related_issue: ""
---

# ADR-00N: {the decision in a short noun phrase}

## Context

What forced a decision. The situation, the pressure, and anything a future reader would need to understand why this was even a question.

## Decision

What was decided, stated in the present tense as a rule the project now follows.

## Alternatives considered

The options that were genuinely on the table, each with the reason it lost. An alternative dismissed here will be proposed again in six months unless the reason is written down.

## Trade-offs

What this decision costs. Every real decision gives something up — name it, so nobody later mistakes the cost for an oversight.

---

Records are append-only. Never rewrite a decided record: to reverse it, write a new one and set this one's `status` to `superseded`, noting which record replaces it. Status flows `proposed` → `accepted` → `superseded` and nowhere else.
