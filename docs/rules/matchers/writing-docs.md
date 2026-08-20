---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Writing docs

Load this whenever you create or edit anything under `docs/`.

## Front matter

Every document opens with the same three fields. Update them whenever you touch the document.

```yaml
---
owner: "@agent-pm"
related_adr: "ADR-001"
related_issue: "#42"
---
```

`owner` is one of `@orchestrator`, `@agent-pm`, `@agent-dev`, `@agent-ui`. A field that does not apply holds an empty string — never drop the key. The value format of `related_issue` is still undecided (#68); until it is settled, write a single `#N`.

No dates, no version numbers, no revision history. Git is the source of truth: `git log -1 --format=%as -- <file>`.

## Templates

Start from `docs/templates/`, never from a blank file or from another project's document.

| Document | Path | Template |
|----------|------|----------|
| PRD | `docs/prd.md` | `docs/templates/prd.md` |
| Domain | `docs/domain/<topic>.md` | `docs/templates/domain.md` |
| ADR | `docs/adr/ADR-00N-<slug>.md` | `docs/templates/adr.md` |
| TDR | `docs/architecture/decisions/TDR-00N-<slug>.md` | `docs/templates/tdr.md` |
| SPEC | `docs/specs/<feature>.md` | `docs/templates/spec.md` |
| UI spec | `docs/ui/<screen>.md` | `docs/templates/ui-spec.md` |

Numbering for ADRs and TDRs is the highest existing number plus one. Check with `ls docs/adr` or `ls docs/architecture/decisions`.

## Writing rules

Local documents are written in English. Filenames are kebab-case and English.

- **One source of truth.** A SPEC lives in its file. Issues link to it. When another document needs the content, link — do not copy.
- **No file paths and no code snippets.** They go stale within a sprint. The exception is a snippet that carries a decision more precisely than prose can — a state machine, a schema, a type shape — trimmed to the decision, not a working demo.
- **Decisions are append-only.** Status flows Proposed → Accepted → Superseded and nothing else. Superseding creates a new numbered file; the old one keeps its content and changes only its status.
- **Fill every section.** What you do not know yet becomes a question under Open Questions, not a vague sentence in the body.
- **State things.** Write "the booking is cancelled", not "the booking may possibly be cancelled". Anything you cannot state belongs in Open Questions.
- **Prose by default.** Bullets only where the list is the point. No emoji. Bold for genuine emphasis only.
- **Explain for a junior developer.** When a pattern, protocol, or piece of jargon appears, give it one inline sentence of explanation.
- Never reference the previous project's output on `snapshot/2026-08-20-pre-reset`.

## Before opening the PR

Re-read the document against this file: front matter present, no dates, every section filled, nothing copied from another source of truth. Then go to `matchers/opening-a-pr.md`.
