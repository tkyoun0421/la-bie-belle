---
name: doc
description: "Router for every document this project produces. Takes a kind and a topic — /doc spec 예약취소, /doc adr 결제수단 — resolves ownership, cuts the branch, and hands off to the stage skill. Use it for any request to write or edit a PRD, domain document, ADR, TDR, spec, UI spec, architecture overview, or to break an Epic into slices. Korean triggers: PRD 쓰자, ADR 남겨, 스펙 만들어, 도메인 용어 정리, UI 스펙 작성, 에픽 슬라이스로 쪼개."
---

# Doc router

You are the entry point for document work. You do not write documents yourself — you resolve who owns what, prepare the branch, and hand off.

## 1. Load the rules

Read `.agent-role` at the repository root. A missing file means you are the orchestrator.

Then read, in this order:

- `docs/rules/common.md`
- `docs/rules/roles/<role>.md`
- `docs/rules/matchers/writing-docs.md`

Everything below assumes those are loaded. Do not restate their content — follow it.

## 2. Resolve the kind

| Kind | Target | Owner | Stage skill |
|------|--------|-------|-------------|
| `prd` | `docs/prd.md` | pm | `prd` |
| `domain` | `docs/domain/<topic>.md` | pm | `domain` |
| `adr` | `docs/adr/ADR-00N-<slug>.md` | pm | `decision` |
| `tdr` | `docs/architecture/decisions/TDR-00N-<slug>.md` | dev | `decision` |
| `spec` | `docs/specs/<feature>.md` | pm | `spec` |
| `ui` / `ui-spec` | `docs/ui/<screen>.md` | ui | `ui-spec` |
| `arch` | `docs/architecture/overview.md` | dev | `arch` |
| `slices` | no file — GitHub Issues | dev | `slices` |

When no kind was given, ask which one. Do not guess between a spec and a decision — they land in different places and different hands.

`decision` on its own is not a kind: resolve it to `adr` or `tdr` before checking ownership, because the two have different owners. A product or domain choice is an ADR; a technical one is a TDR. When the calling role already settles it, say which you picked and continue.

The orchestrator's own documents — `docs/rules/` and `docs/templates/` — have no stage skill. From the `main` checkout, follow `docs/rules/matchers/writing-docs.md` directly and skip to step 4.

Tell them apart this way. What and why the product exists is the PRD. What a word means and what must always be true is a domain document. A fork in the road where one path was chosen and someone will later ask "why this way" is a decision record. How one feature behaves is a spec. The visual and interaction finish of a screen that already exists is a UI spec. How the codebase is arranged and what conventions it follows is the architecture overview.

## 3. Check ownership

Compare the target path against `config/ownership.json` and your role.

If you do not own it, **stop here**. Dispatch `gh-issue-generator` to open a `[Request]` Issue for the owning role, describing what you need and why, then report the Issue number. Do not write the file, and do not open a branch.

One role does not read the registry that way. The `orchestrator` key is `["*"]`, which is access and not authorship — the orchestrator writes none of the documents in the table above. From the `main` checkout the answer is always a `[Request]`, or an assignment to the owning role.

## 4. Cut the branch

`slices` produces no file and opens no PR, so it gets no branch. Skip to step 5 for that kind.

For everything else:

```
git fetch origin && git checkout -b <role>/<task-name> origin/main
```

Then move the related board card to **In Progress** — `docs/rules/matchers/publishing-issues.md` has the command and the option ids.

## 5. Hand off

Call the stage skill with the Skill tool, passing the topic and anything already known from the conversation. The stage skill owns the rest — gathering, writing, publishing.

Before handing off, run `docs-locator` when the document will depend on existing ones: a spec needs the domain vocabulary and any decisions that bind it, a decision needs to know whether an earlier record already covers the ground. Pass the citations to the stage skill and say you ran it, so it does not search the same ground again.
