# AI Harness Architecture

이 문서는 AI 하네스를 제품 코드와 별개의 agentic system으로 보고, Clean Architecture와 디자인 패턴 관점에서 관리하기 위한 기준을 정리한다.

## 목표

- 다음 작업 선택, 이슈 실행, 검증, 리뷰, 대시보드 갱신의 책임을 분리한다.
- GitHub Issue, Project 필드, 라벨, inbox, run artifact, dashboard 사이의 상태 충돌을 줄인다.
- 스킬 문서가 특정 도구 구현에 끌려가지 않고, 하네스의 유스케이스 규칙을 안정적으로 따르게 한다.
- 자동화는 작은 구조화 데이터부터 도입하고, 반복되는 판정 로직만 스크립트로 승격한다.

## Domain Model

하네스의 핵심 도메인은 다음 개념으로 본다.

- `Issue`: GitHub에서 추적되는 실행 가능한 작업 단위.
- `InboxItem`: 아직 GitHub Issue로 승격되지 않은 임시 후보, 후속 작업, 리스크.
- `Run`: 하나의 Issue를 하네스 흐름으로 실행한 기록.
- `Stage`: `plan`, `spec`, `red`, `green`, `verify`, `review`, `dashboard`, `pr`.
- `Artifact`: 단계별 산출물. 예: `task-spec.md`, `spec.md`, `verification.md`, `review-score.json`.
- `Decision`: `PASS`, `REWORK`, `FAIL`, `blocked`, `needs-triage`.
- `Priority`: `P0`, `P1`, `P2`, `P3`.
- `Blocker`: 작업 진행 전에 해결해야 하는 정책 결정, 의존 작업, 외부 환경 문제.

## Use Cases

각 스킬은 아래 유스케이스 중 하나를 수행한다.

- `diagnose-status`: run, inbox, GitHub Issue, dashboard를 읽고 현재 상태와 다음 추천을 판정한다.
- `choose-next-work`: 열린 Issue와 inbox 후보를 비교해 다음 작업 후보를 만든다.
- `capture-inbox-item`: inbox 항목을 GitHub Issue 초안으로 승격한다.
- `plan-issue`: Issue를 실행 가능한 `task-spec.md`와 `plan.md`로 구체화한다.
- `write-spec`: 구현 전 미확정 결정을 확정하고 `spec.md`를 작성한다.
- `run-red`: 실패 테스트 또는 테스트 불가 사유를 기록한다.
- `run-green`: Red 조건을 통과시키는 최소 구현을 수행한다.
- `verify-run`: 테스트, 린트, 타입체크, 빌드, 수동 확인 결과를 기록한다.
- `review-run`: 산출물과 diff를 근거로 PASS/REWORK/FAIL을 결정한다.
- `update-dashboard`: 실행 기록을 dashboard 데이터로 변환한다.
- `evaluate-harness`: 하네스 자체의 건강도를 평가하고 개선안을 만든다.
- `draft-pr`: PASS된 작업을 일반 PR로 정리한다.

## Ports

유스케이스는 아래 포트에만 의존한다고 가정한다.

- `IssueTrackerPort`: Issue 본문, 코멘트, 라벨, open/closed 상태를 읽고 필요한 경우 갱신한다.
- `ProjectBoardPort`: MVP, Type, Source, Status, Priority 같은 Project 필드를 읽는다.
- `InboxStore`: `.agents/inbox.md`의 unresolved 항목을 읽고, 명시적 승격/정리 시에만 수정한다.
- `RunArtifactStore`: `.agents/runs/issue-*`의 run 기록과 단계별 산출물을 읽고 쓴다.
- `DashboardStore`: dashboard 입력 데이터를 읽고 쓴다.
- `GitPort`: diff, status, commit, PR 준비 상태를 확인한다.
- `VerificationPort`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` 같은 검증 명령을 실행한다.
- `UserDecisionPort`: 정책 질문, triage, 승인/보류 결정을 사용자에게 확인한다.

## Adapters

현재 구현에서 각 포트는 다음 어댑터로 연결된다.

- GitHub CLI와 `gh api`: `IssueTrackerPort`, 일부 `ProjectBoardPort`.
- `.agents/inbox.md`: `InboxStore`.
- `.agents/runs/**`: `RunArtifactStore`.
- `.agents/harness/dashboard/data/runs.js`: `DashboardStore`.
- `git`: `GitPort`.
- `pnpm`과 로컬 스크립트: `VerificationPort`.
- 스킬 출력과 사용자 응답: `UserDecisionPort`.

## Dependency Rule

하네스 규칙은 도구보다 안쪽에 있어야 한다.

- 스킬 문서는 GitHub API 응답 형태보다 도메인 규칙을 먼저 설명한다.
- 스크립트는 도메인 판정 규칙을 복제하지 않고, 가능하면 구조화 데이터만 읽고 쓴다.
- dashboard는 상태의 원천이 아니라 run artifact의 projection이다.
- inbox는 임시 저장소이며, 실행 가능한 작업의 원천은 GitHub Issue다.
- Project Priority가 원본이면 priority label은 mirror다. 둘이 다르면 status가 불일치로 보고한다.

## State Machine

Issue 실행은 다음 상태 전이를 따른다.

```txt
planned -> specified -> red -> green -> verified -> reviewed -> dashboarded -> pr-drafted
```

예외 상태:

- `needs-triage`: priority, scope, owner, blocked 여부가 확정되지 않음.
- `blocked`: 외부 결정이나 선행 작업 때문에 진행 불가.
- `rework`: review 결과가 REWORK라 구현 단계로 되돌아감.
- `failed`: review 결과가 FAIL이라 사람 확인 필요.

## Recommended Patterns

- State Machine: 단계 전이와 예외 상태를 명시한다.
- Strategy: 다음 추천 스킬 선택 로직을 조건별 전략으로 분리한다.
- Repository: GitHub, inbox, run artifact, dashboard를 저장소 어댑터로 다룬다.
- Policy Object: priority, blocked, PASS/REWORK/FAIL, inbox 승격 규칙을 정책 객체처럼 관리한다.
- Event Log: stage 완료, review 결정, dashboard 갱신 같은 사실을 누적 기록한다.

## Source Of Truth

현재 기준의 우선순위는 다음과 같다.

1. GitHub Issue open/closed 상태: 실행 가능 여부의 최상위 판단.
2. `review-score.json`: 완료된 run의 PASS/REWORK/FAIL 판단.
3. `.agents/runs/issue-*/run-record.json`: run identity, attempt, artifact path.
4. 단계별 artifact: 실제 단계 완료 근거.
5. GitHub label: 사람이 Issue 목록에서 보는 priority/blocked mirror.
6. GitHub Project field: roadmap과 queue 관리 원본. 자동 접근이 불안정하면 본문 메타데이터와 label로 보완한다.
7. `.agents/inbox.md`: 아직 승격되지 않은 후보와 후속 작업.
8. dashboard data: run artifact에서 파생된 표시용 projection.

충돌이 있으면 `ai-harness-status`가 자동 수정하지 않고 불일치로 보고한다.

## Structured State Proposal

다음 개선 단계에서는 각 run에 `state.json`을 추가하는 방식을 검토한다.

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

도입 순서:

1. schema만 추가하고 기존 산출물과 병행한다.
2. `start-issue.mjs`가 초기 `state.json`을 생성하게 한다.
3. `ai-harness-status`와 dashboard가 `state.json`이 있으면 우선 읽고, 없으면 기존 산출물로 fallback한다.
4. review, dashboard, PR 단계가 stage와 synced timestamp를 갱신한다.

## Guardrails

- 자동화는 inbox 항목을 임의 삭제하지 않는다.
- priority label을 자동으로 바꿀 때는 GitHub Issue 본문 또는 Project 필드에 근거가 있어야 한다.
- closed Issue에 unresolved inbox 항목이 남아 있으면 정리 필요로 보고한다.
- dashboard는 missing score와 실제 0점을 구분해야 한다.
- 검증 명령은 로컬과 CI의 차이를 verification에 기록해야 한다.
- 하네스 개선안은 사람 승인 전 설정 변경, rubric 변경, gate 변경을 하지 않는다.
