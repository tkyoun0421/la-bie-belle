---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Writing docs

Load this whenever you create or edit anything under `docs/`.

Local documents are written in English. See the language rule in `docs/rules/common.md`.

## Templates

Start from `docs/templates/`, never from a blank file.

| Document | Path | Template |
|----------|------|----------|
| PRD | `docs/prd.md` | `docs/templates/prd.md` |
| Domain | `docs/domain/<topic>.md` | `docs/templates/domain.md` |
| ADR | `docs/adr/ADR-00N-<slug>.md` | `docs/templates/adr.md` |
| TDR | `docs/architecture/decisions/TDR-00N-<slug>.md` | `docs/templates/tdr.md` |
| SPEC | `docs/specs/<feature>.md` | `docs/templates/spec.md` |
| UI spec | `docs/ui/<screen>.md` | `docs/templates/ui-spec.md` |

## Front matter

Every document opens with the same four fields. Update them whenever you touch the document.

```yaml
---
owner: "@agent-pm"
status: "active"
related_adr: "ADR-001"
related_issue: "#42"
---
```

`status` takes one of two vocabularies depending on the document. Decision records — ADR and TDR — use `proposed` → `accepted` → `superseded`. Everything else uses `draft` → `active` → `superseded`. Both flow in one direction only.

No modification dates and no version numbers. Git is the source of truth: `git log -1 --format=%as -- <file>`.

## One source of truth

The single source of truth for a specification is the file under `docs/specs/`. An Issue body carries a summary and a link, never a copy of the detail. Corrections go to the file.

## Decision records

Product and domain decisions are `docs/adr/ADR-00N-<slug>.md`, owned by PM. Technical decisions are `docs/architecture/decisions/TDR-00N-<slug>.md`, owned by Dev.

Both are **append-only**. Superseding never deletes the old record; it only changes its `status` to `superseded` and names the record that replaces it.

Both use the same template:

```
Context / Decision / Alternatives considered / Trade-offs
```

## Blank slate

Never reference the previous project's output on the `snapshot/2026-08-20-pre-reset` branch.
