---
name: ai-harness-status
description: 이 프로젝트에서 현재 AI 하네스 이슈와 다음 추천 스킬을 진단할 때 사용한다. 로컬 diagnose-status 스크립트, .agents/runs/**, state.json, inbox, dashboard data, GitHub Issue 본문/코멘트/라벨을 확인한다. 상태 진단만 수행하며 산출물, 코드, GitHub Issue, inbox를 수정하지 않는다.
---

# AI Harness Status

Status is read-only. Do not plan, implement, verify, review, update dashboard data, create PRs, edit GitHub Issues, or edit `.agents/inbox.md`.

## First Step

Always start with the local read-only diagnosis:

```bash
node .agents/harness/scripts/diagnose-status.mjs
```

Use this output as the local baseline for:

- run-record status
- optional `state.json` stage and decision
- artifact-inferred stage
- review decision
- missing `state.json`
- unresolved inbox items
- dashboard generated_at and run count

If the script fails, report the failure and fall back to manual file inspection.

## Files To Check

- `.agents/runs/issue-*/run-record.json`
- `.agents/runs/issue-*/state.json`
- `.agents/runs/issue-*/task-spec.md`
- `.agents/runs/issue-*/plan.md`
- `.agents/runs/issue-*/spec.md`
- `.agents/runs/issue-*/implementation-notes.md`
- `.agents/runs/issue-*/verification.md`
- `.agents/runs/issue-*/review-score.json`
- `.agents/runs/issue-*/review.md`
- `.agents/harness/dashboard/data/runs.js`
- `.agents/inbox.md`
- current GitHub Issue body, comments, and labels
- open GitHub Issue list and labels when recommending next work

## GitHub Rules

- If `run-record.json` has an issue number or URL, inspect that GitHub Issue.
- If no run exists but the user mentions a specific issue number, inspect that issue.
- If recommending the next work item, inspect open GitHub Issues and labels.
- Summarize comments as "prior decision required" when they mention:
  - `다음 작업 전 결정할 것`
  - `결정 필요`
  - `구현 전에`
  - `스펙 확정`
  - `폴더 구조`
  - `네이밍 컨벤션`
  - `PRD`
  - `커밋 메시지`
  - `commitlint`
  - `CI 범위`
- Reflect these labels:
  - `priority:p0`
  - `priority:p1`
  - `priority:p2`
  - `priority:p3`
  - `status:blocked`
  - `needs-triage`
- If the issue body or Project fields say Priority but no `priority:*` label exists, report label mirror drift.
- If `status:blocked` exists, blocker inspection comes before skill recommendation.
- If GitHub inspection fails, state that the judgment is local-only.

## Inbox Rules

- Treat `.agents/inbox.md` as an active queue.
- Unresolved `current issue: #number` or `current issue: issue-number` items are blockers or follow-ups for that issue.
- Unresolved `current issue: none` plus `candidate-issue` items are next-work candidates.
- Completed or implemented items should not remain as long-term records in inbox.
- Do not delete or edit inbox entries during status.

## Stage Rules

Prefer `state.json` when it exists. If it does not exist, infer from artifacts:

- missing `task-spec.md` or `plan.md`: before planning
- `task-spec.md` and `plan.md`: planning complete
- `spec.md`: detailed spec complete
- `implementation-notes.md`: Red/Green or implementation recorded
- `verification.md`: verification complete
- `review-score.json` and `review.md`: review complete

Decision rules:

- `review-score.json.decision = PASS`: PR/dashboard work may be possible
- `REWORK`: implementation rework is required
- `FAIL`: human review is required

Warnings:

- Do not backfill or edit old completed runs during status.
- If `state.json` is missing for an old run, report it as legacy/fallback mode, not as something to mutate automatically.
- If `run-record.status`, `state.json.stage`, and artifact-inferred stage differ, report the drift.
- Empty templates are not complete artifacts.

## Next Skill Recommendation

- before planning: `ai-harness-plan`
- planning complete: `ai-harness-spec`
- detailed spec complete: `ai-harness-red`
- Red complete: `ai-harness-green`
- Green complete: `ai-harness-verify`
- verification complete: `ai-harness-review`
- review complete + `PASS`: `ai-harness-draft-pr` or `ai-harness-dashboard`
- review complete + `REWORK`: `ai-harness-implement`
- review complete + `FAIL`: ask for human confirmation
- dashboard older than run data: `ai-harness-dashboard`
- prior decision required: ask the user before implementation
- unresolved inbox candidates and no selected next work: `ai-harness-idea`
- unresolved inbox candidates should become GitHub Issue drafts: `ai-harness-capture`

## Output Format

```md
현재 진행 상태

Issue #번호: 제목
- 마지막 완료 단계: ...
- 현재 결정: PASS/REWORK/FAIL/없음
- 로컬 진단 경고: ...
- 라벨: ...
- 우선순위: P0/P1/P2/P3/미정
- 누락 산출물: ...
- 사전 결정 필요: ...
- inbox 미해결 항목: ...
- 다음 추천 스킬: ...
- 이유: ...
```

When open GitHub Issues and inbox candidates both exist:

```md
다음 작업 후보

- GitHub 열린 이슈: ...
- Inbox 후보: ...
- 우선 확인할 불일치: ...
- 추천 순서: ...
```
