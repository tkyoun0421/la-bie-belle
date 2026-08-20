---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Writing docs

Load this whenever you create or edit anything under `docs/`.

Local documents are written in English. See the language rule in `common.md`.

## Front matter

Every document opens with the same three fields. Update them whenever you touch the document.

```yaml
---
owner: "@agent-pm"
related_adr: "ADR-001"
related_issue: "#42"
---
```

No modification dates and no version numbers. Git is the source of truth: `git log -1 --format=%as -- <file>`.

## One source of truth

The single source of truth for a specification is the file under `docs/specs/`. An Issue body carries a summary and a link, never a copy of the detail. Corrections go to the file.

## Decision records

Product and domain decisions are `docs/adr/ADR-00N-<slug>.md`, owned by PM. Technical decisions are `docs/architecture/decisions/TDR-00N-<slug>.md`, owned by Dev.

Both are **append-only**. Status flows Proposed → Accepted → Superseded and nothing else. Superseding never deletes the old record; it only changes its status.

Both use the same template:

```
Context / Decision / Alternatives considered / Trade-offs
```

## Blank slate

Never reference the previous project's output on the `snapshot/2026-08-20-pre-reset` branch.
