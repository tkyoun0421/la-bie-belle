---
name: decision
description: "Writes an ADR (product and domain decisions, PM) or a TDR (technical decisions, Dev). Picks the path and the numbering from the calling role. Normally reached through the /doc router."
---

# Decision record

The role decides which it is. PM writes `docs/adr/ADR-00N-<slug>.md` from `docs/templates/adr.md`. Dev writes `docs/architecture/decisions/TDR-00N-<slug>.md` from `docs/templates/tdr.md`.

## Number it

```
ls docs/adr            # or: ls docs/architecture/decisions
```

The number is the highest existing one plus one, zero-padded to three digits. Two records must never share a number — check at write time, not from memory.

## Gather

Run `docs-locator` for records already covering this ground. If one exists and this decision reverses it, you are superseding: write the new record, then set the old one's `status` to `superseded` and name the replacement. Never edit the old record's Context, Decision, Alternatives, or Trade-offs — those stay as they were when the decision was made.

The four sections need: what forced the decision, what was decided, which alternatives were genuinely on the table and why each lost, and what this costs.

The alternatives section is the one that earns the record. "We considered other options" records nothing — name the library, the pattern, the service, and the specific reason it lost. Without that, the same alternative gets proposed again in six months.

## Write

Dispatch `docs-generator`. New records start at `status: proposed` and move to `accepted` when the decision is actually in force.

Keep it to the decision. Implementation detail belongs in the spec or the code, and file paths belong nowhere — they go stale before the record does.

## Publish

Dispatch `gh-pr-generator`. When the record supersedes an earlier one, say which in the PR body — that is the pair a reviewer has to check together.
