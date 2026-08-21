---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69"
---

# Matcher: Publishing issues

Load this when opening a GitHub Issue or moving a card on the board.

Issue titles and bodies are written in Korean. See the language rule in `docs/rules/common.md`.

## Who reads an Issue

An Issue body is a report for the human reading GitHub. Local documents are English, so the Issue is the only surface that reader has — write enough Korean that the work is understandable without opening a file. The precise contract, such as endpoint names, column types, and response shapes, stays in the English document under `docs/`, which remains the source of truth.

## Kinds

The title prefix identifies the kind. `.github/ISSUE_TEMPLATE/` holds five forms for four kinds, because `[Slice]` splits into a feature form and a design form. An Issue opened with `gh` bypasses the form, so mirror the fields it asks for.

| Kind | Opened by | Content |
|------|-----------|---------|
| `[Epic]` | PM, or the orchestrator | One unit of work that breaks into several sub-issues — a feature, or a multi-step orchestrator task. A feature Epic links its SPEC file; an orchestrator Epic has none. Closed when every sub-issue is closed |
| `[Slice]` | Dev | One vertical slice of an Epic, attached to it as a GitHub sub-issue. A design slice applies a `docs/ui/` specification to a screen that already exists, has no parent Epic, and uses its own form |
| `[Ticket]` | Orchestrator | Follow-up for a `normal` review finding, improvement, or debt |
| `[Request]` | Any role | A change outside your ownership. The owning role decides on its own — accept and implement, or refuse with a reason and close. The orchestrator mediates only when two roles disagree |

The kind usually decides the assignee — a Slice means Dev, a Ticket means whoever owns the path it touches. An Epic and a Request name theirs in the body.

Link the PR to the Issue with `Closes #N` so the merge closes it automatically.

## Labels

Labels classify. They never carry status.

| Axis | Values |
|------|--------|
| type | `type:feature` `type:bug` `type:refactor` `type:docs` `type:chore` |
| surface | `surface:ui` `surface:db` `surface:auth` `surface:api` `surface:workflow` `surface:docs` |
| risk | `risk:security` `risk:privacy` `risk:performance` `risk:concurrency` `risk:migration` `risk:external` |

A form's `dropdown` field only records the axis in the body — it does not apply a label. Only the static `labels:` key at the top of a form does that. Label an Issue as you publish it with `gh issue create --label`, or right after, when it came in through the web form.

## Board

Status lives in the Status field of the [La Bie Belle](https://github.com/users/tkyoun0421/projects/8) project board. Put a new Issue on the board, then set its status. Adding a card does not set one — a card added and left alone sits in `No Status`, invisible to every column.

```
gh project item-add 8 --owner tkyoun0421 --url <issue-url>          # prints the item id
gh project item-edit --project-id PVT_kwHOBd4HfM4Bg89n \
  --id <item-id> \
  --field-id PVTSSF_lAHOBd4HfM4Bg89nzhf6jUI \
  --single-select-option-id <option-id>
```

| Status | Option id |
|--------|-----------|
| Backlog | `f025dca8` |
| Todo | `f66a47cd` |
| In Progress | `c2dd621b` |
| In Review | `b9e12ba6` |
| Done | `b9771004` |
| Blocked | `5b4d353f` |

To move a card that is already on the board, find its item id with `gh project item-list 8 --owner tkyoun0421 --format json` and run the same `item-edit`.

| Status | Meaning | Who moves it |
|--------|---------|--------------|
| Backlog | Published, not yet queued | Whoever opened it |
| Todo | Confirmed as next up — the dispatch queue | PM (slice order), orchestrator |
| In Progress | Branch cut, work underway | The assigned role |
| In Review | PR open, review and fix loop running | The assigned role |
| Done | Merged or closed | Automatic |
| Blocked | Spec gap, waiting on a Request, unmet dependency. **A reason comment is mandatory** | The assigned role |

Each role moves its own card. Cutting the branch means In Progress; opening the PR means In Review.
