---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Review failed

Load this when a review comes back FAIL, or when you receive a fix order.

## Orchestrator

Stop the merge. Do not merge around a `critical` or `high` finding, and do not fix it yourself.

1. Comment on the PR in Korean, listing each finding with its severity and what needs to change. This comment is the instruction — it is the only place the instruction exists.
2. Ring the authoring role's session with one line: go read the PR comment.

The recipient is always the role that authored the PR — a `pm/` PR goes to PM, a `ui/` PR goes to UI. Never reassign the fix to a different role because it is faster.

A `normal` finding is not a fix order. Merge, then open a `[Ticket]` Issue for it with the three label axes.

## Authoring role

1. Read the PR comment. That is the instruction; anything that arrived only by terminal does not count.
2. Fix on the **same branch** and push to the **same PR**. A new PR loses the review thread.
3. Reply in the PR comment thread saying what you changed, then ring the orchestrator for a re-review.
4. Leave the board card in **In Review** for the whole loop.

If you disagree with a finding, say so in the PR thread with evidence and wait for the ruling. Do not push a fix you believe is wrong, and do not silently ignore the finding.
