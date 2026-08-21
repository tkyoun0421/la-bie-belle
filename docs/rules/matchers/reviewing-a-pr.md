---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69"
---

# Matcher: Reviewing a PR

Load this when reviewing a PR or ruling on the severity of a finding.

Judge the diff and the repository state, never the author's account of them. A reviewer reports; a reviewer does not fix.

## Severity

Three tiers. The reviewer assigns them first; the orchestrator rules on borderline cases.

| Severity | Criteria | Handling |
|----------|----------|----------|
| **critical** | Secrets or PII exposed (the repo is public), data loss or destruction paths, authentication or authorisation bypass, `main` broken (build or existing tests fail) | No merge. The orchestrator orders an immediate fix from the authoring role |
| **high** | Acceptance criteria unmet, clear functional bug, ownership violation, behaviour change with no test, domain policy implemented wrongly | No merge. The orchestrator orders an urgent fix from the authoring role |
| **normal** | Refactoring, naming, performance headroom, minor convention slips such as missing front matter, spec ambiguity needing confirmation | Merge proceeds. Each item becomes a `[Ticket]` Issue for follow-up |

One `critical` or `high` finding makes the verdict FAIL. A PR with only `normal` findings passes, and every one of them is still listed.

Add newly discovered borderline cases to this table as they come up.

## What to check, in order

1. **Secrets** (critical) — any `.env` family file or hardcoded key or token in the diff.
2. **Ownership** (high) — every changed path belongs to the branch prefix's role per `config/ownership.json`. Three prefixes carry their own name; `orch/` is the key `orchestrator`. Check this even though the hooks exist: a role agent can bypass them, so the review is the last line of defence.
3. **Authorship** (high) — on an `orch/` PR only. The `orchestrator` key is `["*"]`, so the registry check above passes every path and cannot catch this axis. `docs/rules/roles/orchestrator.md` forbids the orchestrator from writing what pm, dev, or ui owns: it assigns that work instead. An `orch/` PR that changes a path under another role's key is a finding, and the registry's approval is not a defence. There is no exception: an accepted `[Request]` means the owning role implements the change itself, never that it hands its paths over.
4. **Spec conformance** (high) — the implementation matches the acceptance criteria in the SPEC file and the Issue, and adds no behaviour the spec never asked for.
5. **Correctness** (high to critical) — clear bugs, broken edge cases, type and logic errors. Breaking `main` makes it critical.
6. **Tests** (high) — behaviour changes carry tests, and existing tests were not weakened without reason.
7. **Conventions** (normal) — title format, Issue number, Impact lines, and updated front matter on document changes.

## Report

Report as final text only:

```
VERDICT: PASS | FAIL
FINDINGS:
- [critical|high|normal] file:line — the problem in one line. The evidence in one line.
(write "없음" when there are none)
```

Guesses you cannot back with the diff do not go in the report.
