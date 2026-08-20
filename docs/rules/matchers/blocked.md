---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Blocked

Load this when you cannot proceed.

Never stop quietly. A session that goes silent looks identical to a session that is still working, and the orchestrator has no way to tell them apart.

## What counts as blocked

- The specification has a gap and the answer cannot be guessed safely.
- A `[Request]` Issue is waiting on another role.
- A dependency slice has not landed yet.
- The ownership guard refuses a change you genuinely need.

Ambiguity you can resolve by reading the SPEC, the domain document, or an ADR is not a block. Read first.

## What to do

1. Move the board card to **Blocked**.
2. Leave a comment on the Issue — in Korean — that states what you were doing, what stopped you, exactly what you need, and who can unblock it. A card in Blocked without this comment is itself a problem.
3. If a specific role can unblock it, open a `[Request]` Issue against them and link it.
4. Ring the orchestrator only when the block stalls the queue. The comment is the record either way.

Then pick up the next unblocked item rather than idling.

## Unblocking

Whoever resolves the block says so in the comment thread. The blocked role moves its own card back to In Progress — the orchestrator does not move it for them.
