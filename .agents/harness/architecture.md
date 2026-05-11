# AI 하네스 아키텍처

이 문서는 AI 하네스를 제품 코드와 분리된 agentic system으로 보고 관리하기 위한 기준이다. 목표는 작업 상태, 실행 흐름, 자동화 책임을 명확히 유지하는 것이다.

## 목표

- 다음 작업 선택, 이슈 실행, 검증, 리뷰, 대시보드 반영, 완료 run 정리를 분리한다.
- GitHub Issue, Project 필드, 라벨, inbox, run 산출물, dashboard data 사이의 상태 불일치를 줄인다.
- 스킬은 특정 도구 응답 형식보다 하네스 유스케이스 규칙을 따르게 한다.
- 구조화 상태는 새 run부터 점진 도입하고, 과거 run은 산출물 기반 fallback으로 읽는다.

## 도메인 모델

- `Issue`: GitHub에서 추적하는 실행 가능한 작업 단위.
- `InboxItem`: 아직 GitHub Issue로 승격되지 않은 임시 후보, 후속 작업, 리스크.
- `Run`: 하나의 Issue를 로컬 하네스 흐름으로 실행한 기록.
- `Stage`: `planned`, `specified`, `red`, `green`, `verified`, `reviewed`, `dashboarded`, `pr-drafted`.
- `Artifact`: 단계별 산출물. 예: `task-spec.md`, `spec.md`, `verification.md`, `review-score.json`.
- `Decision`: `PASS`, `REWORK`, `FAIL`, `blocked`, `needs-triage`.
- `Priority`: `P0`, `P1`, `P2`, `P3`.
- `Blocker`: 진행 전에 해결해야 하는 정책 결정, 의존 작업, 환경 문제.

## 유스케이스

- `diagnose-status`: 로컬 상태, inbox, dashboard, GitHub 상태를 읽고 다음 단계를 추천한다.
- `choose-next-work`: 열린 Issue와 inbox 후보를 비교한다.
- `capture-inbox-item`: inbox 항목을 GitHub Issue 초안으로 승격한다.
- `plan-issue`: Issue를 `task-spec.md`와 `plan.md`로 구체화한다.
- `write-spec`: 구현 전 결정을 확정하고 `spec.md`를 작성한다.
- `run-red`: 실패 조건을 만들거나 기록한다.
- `run-green`: 실패 조건을 통과시키는 최소 구현을 한다.
- `verify-run`: 검증 명령을 실행하고 `verification.md`를 작성한다.
- `review-run`: 결과를 채점하고 PASS/REWORK/FAIL을 결정한다.
- `update-dashboard`: run 기록을 dashboard data로 투영한다.
- `evaluate-harness`: 하네스 건강도를 평가하고 개선안을 제안한다.
- `draft-pr`: PASS run을 일반 PR로 정리한다.
- `archive-completed-runs`: 완료된 run의 핵심 평가 이력을 장기 기록으로 압축한다.
- `cleanup-completed-runs`: 완료된 로컬 run 디렉터리를 active queue에서 제거한다.

## 포트와 어댑터

- `IssueTrackerPort`: GitHub Issue 본문, 코멘트, 라벨, open/closed 상태.
- `ProjectBoardPort`: MVP, Type, Source, Status, Priority.
- `InboxStore`: `.agents/inbox.md`.
- `RunArtifactStore`: `.agents/runs/issue-*`.
- `RunHistoryStore`: `.agents/harness/history/runs.json`.
- `DashboardStore`: `.agents/harness/dashboard/data/runs.js`.
- `GitPort`: diff, status, commit, PR 준비 상태.
- `VerificationPort`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- `UserDecisionPort`: 사용자 결정과 승인.

현재 어댑터는 `gh api`, 로컬 markdown/JSON 파일, git, pnpm, 스킬 출력이다.

## 의존성 규칙

- 하네스 정책은 dashboard 표시 코드에만 있으면 안 되고, 스킬, 스크립트, 스키마, 문서에 명시되어야 한다.
- dashboard data는 상태 원천이 아니라 projection이다.
- inbox는 임시 active queue이며 영구 기록이 아니다.
- `.agents/runs/issue-*`는 active execution queue이며 영구 아카이브가 아니다.
- 오래 보존할 로컬 평가 기록은 `.agents/harness/history/runs.json`에 남긴다.
- dashboard data는 active runs와 run history를 합쳐서 생성한다.
- GitHub Issue, PR, commit은 외부 추적과 변경 맥락의 장기 기록이다.
- Project Priority가 원본이면 priority label은 목록 가시성을 위한 mirror다.

## 상태 전이

```txt
planned -> specified -> red -> green -> verified -> reviewed -> dashboarded -> pr-drafted
```

예외 상태:

- `needs-triage`: priority, scope, owner, blocked 여부가 확정되지 않음.
- `blocked`: 외부 결정이나 의존 작업 때문에 진행 불가.
- `rework`: 리뷰 결과 구현 재작업 필요.
- `failed`: 사람 확인 필요.

## 구조화 상태

새 run은 `start-issue.mjs`가 생성할 때 `state.json`을 포함해야 한다.

예상 필드:

```json
{
  "run_id": "issue-28",
  "issue_number": 28,
  "stage": "planned",
  "decision": null,
  "priority": "P0",
  "blocked": false,
  "blockers": [],
  "inbox_refs": [],
  "dashboard_synced_at": null,
  "updated_at": "2026-05-11T00:00:00.000Z"
}
```

호환 규칙:

- `state.json`이 있으면 status와 dashboard 스크립트는 이를 우선 읽는다.
- `state.json`이 없으면 기존 산출물에서 상태를 추론한다.
- 과거 완료 run에 `state.json`이 없다는 이유만으로 백필하지 않는다.

## 완료 Run 정리

완료된 run 산출물은 장기 기록으로 아카이브한 뒤 active queue에서 제거한다.
`.agents/runs/issue-*`를 삭제해도 평가 이력은 `.agents/harness/history/runs.json`과 dashboard projection에 남아야 한다.

삭제 조건:

- `review-score.json`과 `review.md`가 있다.
- 리뷰 결정이 `PASS`, `REWORK`, `FAIL` 중 하나다.
- `archive-completed-runs.mjs --apply`로 run history에 저장되었다.
- 완료 후 dashboard data가 active runs와 history 기준으로 갱신되었다.
- GitHub Issue, PR, commit history 중 하나에 최종 결과가 남아 있다.
- 현재 진행 중인 작업이 아니다.

정리 흐름:

1. `node .agents/harness/scripts/diagnose-status.mjs`로 `cleanup_candidate`를 확인한다.
2. `node .agents/harness/scripts/archive-completed-runs.mjs`로 아카이브 dry-run을 확인한다.
3. 에이전트가 완료 조건을 만족한다고 판단하면 `node .agents/harness/scripts/archive-completed-runs.mjs --apply`를 실행한다.
4. `node .agents/harness/scripts/build-dashboard-data.mjs`로 dashboard projection을 갱신한다.
5. `node .agents/harness/scripts/cleanup-completed-runs.mjs`로 삭제 dry-run을 확인한다.
6. run history에 저장된 run만 `node .agents/harness/scripts/cleanup-completed-runs.mjs --apply`로 active queue에서 제거한다.
7. status 진단 중에는 삭제하지 않는다. archive와 cleanup은 별도 작업으로 수행한다.

## 개선안 Lifecycle

`.agents/harness/improvements/proposals`는 active queue다.

- pending proposal만 둔다.
- 구현, GitHub Issue 승격, 반려, 보류 사유 기록 중 하나가 끝나면 active queue에서 제거한다.
- 장기 기록은 commit, Issue, PR, 활성 run 산출물, dashboard snapshot에 둔다.

## 안전 규칙

- status 진단 중 inbox 항목을 수정하거나 삭제하지 않는다.
- GitHub label은 명시적인 apply 작업이 아니면 변경하지 않는다.
- run 디렉터리는 run history 저장, dry-run, 별도 cleanup 작업 없이 삭제하지 않는다.
- dashboard에서 missing score와 실제 0점을 구분한다.
- 로컬 검증과 CI 검증의 차이는 `verification.md`에 기록한다.
- proposal만으로 prompt, rubric, gate, permission을 바꾸지 않는다.
