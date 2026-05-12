# Inbox

## Open

## Rules

- Detailed routing and cleanup rules live in `.agents/harness/inbox-policy.md`.
- Capture ad-hoc ideas, bugs, improvements, ops tasks, and harness tasks here without requiring a skill call.
- Give every item a stable `id: inbox-YYYY-MM-DD-NNN` field so run state can reference it.
- Keep only unresolved items in this file.
- If an item directly blocks the current issue's completion criteria, mark it `blocker` and reflect it in the current issue artifacts instead of leaving it only in the inbox.
- Mark related follow-up work as `follow-up`.
- Mark separate feature, ops, or improvement work as `candidate-issue`.
- Create a GitHub Issue only when the user explicitly asks or triage decides to promote the item.
- Before creating a PR, check current-issue inbox items and resolve them as `included-in-pr`, `promoted-to-issue`, or `deferred`.
- Remove items after they are included in the PR, promoted to a GitHub Issue, deferred with a recorded reason, or discarded.
- Before automatic removal based on AI judgment, report it in one line.
