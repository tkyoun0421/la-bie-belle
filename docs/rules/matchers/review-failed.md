---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69"
---

# Matcher: Review failed

Load this when a review comes back FAIL, or when you receive a fix order.

## Orchestrator

Stop the merge. A `critical` or `high` finding blocks it.

1. Comment on the PR, listing the items to fix. This comment is the instruction — an instruction delivered only through a terminal did not happen.
2. Ring the authoring role's session.

The recipient is always the role that authored the PR — a `pm/` PR goes to PM, a `ui/` PR goes to UI.

A `normal` finding is not a fix order. Merge, then open a `[Ticket]` Issue for it.

## Authoring role

Fix on the same branch and push to the **same PR**, then ask for a re-review. A `critical` or `high` fix never goes to a new PR.
