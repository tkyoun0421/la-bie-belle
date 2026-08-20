---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Publishing issues

Load this when opening a GitHub Issue or moving a card on the board.

Issue titles and bodies are written in **Korean**. A human reads them.

## Kinds

The title prefix identifies the kind, and the kind decides who owns it.

| Kind | Opened by | Content |
|------|-----------|---------|
| `[Epic]` | PM | One feature. A link to the SPEC file plus a summary. PM closes it when every slice is closed |
| `[Slice]` | Dev | One vertical slice, attached to its Epic as a GitHub sub-issue |
| `[Ticket]` | Orchestrator | Follow-up for a `normal` review finding, improvement, or debt |
| `[Request]` | Any role | A change outside your ownership. The owning role decides on its own — accept and implement, or refuse with a reason and close. The orchestrator steps in only when two roles deadlock |

When the owner is not obvious from the kind, name it in the body.

Never copy specification detail into an Issue body. Summary and link only.

## Labels

Labels classify. They never carry status.

| Axis | Values |
|------|--------|
| type | `type:feature` `type:bug` `type:refactor` `type:docs` `type:chore` |
| surface | `surface:ui` `surface:db` `surface:auth` `surface:api` `surface:workflow` `surface:docs` |
| risk | `risk:security` `risk:privacy` `risk:performance` `risk:concurrency` `risk:migration` `risk:external` |

## Board

Status lives in the Status field of the [La Bie Belle](https://github.com/users/tkyoun0421/projects/8) project board. Put a new Issue on the board, then set its status.

```
gh project item-add 8 --owner tkyoun0421 --url <issue-url>
```

| Status | Meaning | Who moves it |
|--------|---------|--------------|
| Backlog | Published, not yet queued | Whoever opened it |
| Todo | Confirmed as next up — the dispatch queue | PM (slice order), orchestrator |
| In Progress | Branch cut, work underway | The assigned role |
| In Review | PR open, review and fix loop running | The assigned role |
| Done | Merged or closed | Automatic |
| Blocked | Spec gap, waiting on a Request, unmet dependency. **A reason comment is mandatory** | The assigned role |

Each role moves its own card. Cutting the branch means In Progress; opening the PR means In Review.
