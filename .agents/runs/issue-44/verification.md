# 검증 기록

## 실행한 명령

```txt
Test-Path .agents\harness\inbox-policy.md
rg -n "inbox-policy|included-in-pr|promoted-to-issue|deferred|in-scope|discarded|follow-up|blocker|candidate-issue|completed" .agents\inbox.md .agents\harness .agents\skills
node .agents/harness/scripts/diagnose-status.mjs
git diff -- .agents/harness/inbox-policy.md .agents/inbox.md .agents/harness/workflows/issue-execution.workflow.md .agents/harness/agents/draft-pr.agent.md .agents/skills/ai-harness-draft-pr/SKILL.md .agents/skills/ai-harness-capture/SKILL.md .agents/skills/ai-harness-status/SKILL.md .agents/runs/issue-44
```

## 결과

- `Test-Path` returned `True`; the central policy document exists.
- `rg` found the required classification and PR-time outcome terms in the new policy and related harness/skill docs.
- `diagnose-status.mjs` completed without inbox parsing errors and reported `unresolved_count: 0`.
- Diff review confirmed the product code and automation scripts were not changed.

## 완료 기준 매핑

- Classification and outcome meanings are documented in `.agents/harness/inbox-policy.md`.
- `.agents/inbox.md` now references the policy and keeps the unresolved active queue rule.
- Draft PR docs and skill instructions require `included-in-pr`, `promoted-to-issue`, or `deferred` before PR creation.
- Capture and status skills now refer to the policy and keep promoted/completed items out of long-term inbox storage.

## 건너뛴 검증

- Application build/test/lint were not run because this issue changes only harness documentation and run artifacts.

## 남은 리스크

- `diagnose-status.mjs` currently treats pre-created template review artifacts as completed artifacts, so it reports stage drift until review artifacts are populated. That is an existing status inference limitation, not a #44 policy failure.
