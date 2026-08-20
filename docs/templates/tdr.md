---
owner: "@agent-dev"
status: "proposed"
related_adr: ""
related_issue: ""
---

# TDR-00N: {the decision in a short noun phrase}

## Context

What forced a decision. The technical situation, the constraint, and anything a future reader would need to understand why this was even a question.

## Decision

What was decided, stated in the present tense as a rule the codebase now follows.

## Alternatives considered

The options that were genuinely on the table, each with the reason it lost. Name the library, service, or pattern explicitly — "we considered other options" records nothing.

## Trade-offs

What this decision costs: the performance, the coupling, the migration burden, the thing that becomes harder. Name it, so nobody later mistakes the cost for an oversight.

---

Records are append-only. Never rewrite a decided record: to reverse it, write a new one and set this one's `status` to `superseded`, noting which record replaces it. Status flows `proposed` → `accepted` → `superseded` and nowhere else.
