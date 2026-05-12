# Inbox Policy

`.agents/inbox.md` is an active queue for unresolved work discovered during an AI harness run. It is not a long-term archive.

## Item Shape

Each inbox item should keep enough context to route it later:

- `id: inbox-YYYY-MM-DD-NNN`
- `current issue: #number` when tied to an active issue, or `current issue: none`
- `type`: `Product`, `Bug`, `Ops`, `Harness`, or `Idea`
- `tag`: initial routing tag
- `content`: one sentence describing the work

## Classification Tags

Use these tags to describe the nature of an unresolved item:

- `in-scope`: belongs inside the current issue's completion criteria.
- `blocker`: must be resolved before the current issue can pass verification or review.
- `follow-up`: related to the current issue but not required for this PR.
- `candidate-issue`: separate feature, bug, ops, or harness work that should be triaged as its own issue.
- `discarded`: no longer actionable, duplicate, or explicitly out of scope.

`in-scope` and `blocker` items should be reflected in the current run artifacts instead of living only in the inbox. `candidate-issue` items should remain unimplemented until triage or explicit promotion.

## PR-Time Outcomes

Before creating a PR, every inbox item tied to the current issue must have one outcome:

- `included-in-pr`: the work was completed inside the current PR and is recorded in run artifacts or the PR body.
- `promoted-to-issue`: the work was turned into a GitHub Issue for separate triage or execution.
- `deferred`: the work is intentionally left for later with a reason recorded in the run, issue, or PR.

If an item is partly included and partly follow-up, record the included part in the PR and promote or defer the remaining part separately.

## Completion And Removal

`completed` is an outcome, not a reason to keep closed items in `.agents/inbox.md`.

Remove an inbox item after one of these happens:

- It is included in the current PR and recorded in the PR body or run artifacts.
- It is promoted to a GitHub Issue.
- It is deferred with a clear reason in the run, issue, or PR.
- It is discarded with a clear reason.

Long-term records belong in GitHub Issues, PR bodies, run artifacts, or review notes. `.agents/inbox.md` should contain only unresolved active queue items.

## Status Rules

Status checks should treat unresolved `current issue: #number` items as blockers or follow-ups for that issue. Unresolved `current issue: none` plus `candidate-issue` items are next-work candidates. Completed, promoted, deferred, or discarded items should not remain in the inbox as long-term records.
