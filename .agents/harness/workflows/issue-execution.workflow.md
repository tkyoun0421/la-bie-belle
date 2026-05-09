# 이슈 실행 워크플로우

## 목적

GitHub Issue 하나를 AI 멀티 에이전트 흐름으로 처리하고, PR 생성 전 품질 게이트를 통과시키는 절차를 정의한다.

## 실행 디렉터리

각 실행은 다음 위치에 기록한다.

```txt
.agents/runs/issue-{issue_number}/
  task-spec.md
  plan.md
  spec.md
  implementation-notes.md
  verification.md
  review-score.json
  review.md
  harness-health-score.json
  harness-improvements.md
  run-record.json
```

## 단계

Pre-Issue. 이슈 생성 승인
   - PRD 기반 새 GitHub Issue가 필요한 경우 먼저 계획안, 이슈 제목, 본문, 라벨을 사람에게 제시한다.
   - 작업 중 떠오른 수시 발생 작업은 `.agents/inbox.md`에 자동 캡처하고, 승격이 결정된 항목만 `ai-harness-capture`로 이슈 초안을 만든다.
   - 사람이 승인하기 전에는 GitHub Issue를 생성하지 않는다.
   - 승인 후에만 GitHub Issue를 생성하고 다음 단계로 진행한다.

0. Start Issue
   - `node .agents/harness/scripts/start-issue.mjs {issue_number}`로 실행 디렉터리와 기본 산출물 파일을 생성한다.

1. Planner
   - GitHub Issue를 읽고 `task-spec.md`, `plan.md`를 생성한다.

2. Spec
   - 생성된 Issue와 `task-spec.md`, `plan.md`를 바탕으로 `spec.md`를 생성한다.
   - 구현 전 정상 흐름, 엣지케이스, 에러/빈/로딩 상태, 테스트 케이스, Red 단계 우선순위를 정리한다.

3. Red
   - `spec.md`의 테스트 케이스와 Red 우선순위에 따라 실패 테스트를 작성하고 실패를 확인한다.
   - 결과를 `implementation-notes.md`에 기록한다.

4. Green
   - 실패 테스트를 통과시키는 최소 구현을 수행한다.
   - 구조 개선은 하지 않고 `implementation-notes.md`에 Green 기록을 남긴다.

5. Refactor
   - Green 이후 테스트가 통과하는 상태에서 조건부로 실행한다.
   - 동작 변경 없이 구조만 개선하거나, 리팩토링 생략 사유를 기록한다.

6. Verifier
   - 검증을 실행하고 `verification.md`를 생성한다.

7. Reviewer
   - 원본 Issue, 산출물, diff, 검증 로그를 보고 `review-score.json`, `review.md`를 생성한다.
   - `node .agents/harness/scripts/validate-score.mjs .agents/runs/issue-{issue_number}/review-score.json`으로 점수 기록을 검증한다.
   - 80점 이상이면 `PASS`.
   - 65-79점이면 `REWORK`.
   - 64점 이하면 `FAIL`.

8. Rework Loop
   - `REWORK`는 Implementer에게 재작업을 요청한다.
   - 재작업 후 Verifier와 Reviewer를 다시 실행한다.
   - 기본 재작업 횟수는 1회다.

9. PR
   - Reviewer 결정이 `PASS`일 때만 GitHub Draft 상태가 아닌 일반 PR을 생성한다.
   - PR 생성 전 원본 이슈 완료 기준, 작업 중 추가된 사항, 현재 이슈 관련 inbox 항목을 확인한다.
   - PR 본문에는 머지 시 원본 이슈가 자동 종료되도록 `Closes #이슈번호`를 포함한다.
   - PR 본문은 `.github/pull_request_template.md` 섹션을 유지해 작성한다.
   - 머지와 배포는 사람이 결정한다.

10. Harness Evaluator
   - 이슈 종료 후 하네스 건강도를 가볍게 평가한다.
   - 낮은 항목은 개선안으로 기록한다.

## 중단 조건

- Planner 단계에서 구현 방향을 결정할 수 없는 핵심 질문이 남은 경우.
- Implementer가 계획 오류나 위험한 범위 확장을 발견한 경우.
- Verifier가 핵심 검증 실패를 확인한 경우.
- Reviewer가 `FAIL`을 결정한 경우.

## 대시보드 반영

다음 명령으로 `run-record.json`, `review-score.json`, `harness-health-score.json`을 대시보드 데이터로 변환한다.

```bash
node .agents/harness/scripts/build-dashboard-data.mjs
```

대시보드는 변환된 데이터를 읽어 다음을 표시한다.

- 이슈별 총점과 결정
- 항목별 점수와 감점 사유
- 잘된 부분과 부족한 부분
- 반복 감점 항목
- 하네스 건강도와 개선 제안
