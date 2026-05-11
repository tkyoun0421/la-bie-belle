---
name: ai-harness-status
description: 이 프로젝트에서 오랜만에 돌아와 현재 진행 중인 AI 하네스 이슈의 상태와 다음에 호출할 스킬을 알고 싶을 때 사용한다. .agents/runs/**, run-record.json, 단계별 산출물, review-score.json, dashboard data, inbox, GitHub Issue 본문/코멘트/라벨을 확인해 마지막 완료 단계, 누락 파일, PASS/REWORK/FAIL 상태, 사전 결정 메모, 미승격 후보 작업, 다음 추천 스킬을 진단할 때 사용한다. 작업을 진행하거나 파일을 수정하지 않는다.
---

# AI 하네스 상태

상태 진단만 수행한다. 계획, 구현, 검증, 리뷰, 대시보드 갱신, PR 생성은 하지 않는다.

## 확인 대상

- `.agents/runs/issue-*/run-record.json`
- `.agents/runs/issue-*/task-spec.md`
- `.agents/runs/issue-*/plan.md`
- `.agents/runs/issue-*/spec.md`
- `.agents/runs/issue-*/implementation-notes.md`
- `.agents/runs/issue-*/verification.md`
- `.agents/runs/issue-*/review-score.json`
- `.agents/runs/issue-*/review.md`
- `.agents/harness/dashboard/data/runs.js`
- `.agents/inbox.md`
- 진행 중인 GitHub Issue 본문
- 진행 중인 GitHub Issue 코멘트
- 진행 중인 GitHub Issue 라벨
- 열린 GitHub Issue 목록과 라벨

## GitHub 확인 규칙

- 로컬 `run-record.json`에 issue number와 URL이 있으면 해당 GitHub Issue를 확인한다.
- 로컬 실행 기록이 없지만 사용자가 특정 이슈 번호를 언급했거나 열린 이슈가 명확하면 해당 GitHub Issue를 확인한다.
- 다음 작업 우선순위를 말해야 하면 열린 GitHub Issue 목록도 확인한다.
- GitHub Issue 코멘트에서 다음 표현이 있으면 "사전 결정 필요"로 요약한다.
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
- GitHub Issue 라벨에서 다음 패턴이 있으면 우선순위와 차단 상태에 반영한다.
  - `priority:p0`
  - `priority:p1`
  - `priority:p2`
  - `priority:p3`
  - `status:blocked`
  - `needs-triage`
- 코멘트가 본문보다 최신이거나 본문에 없는 지시가 있으면 다음 추천 이유에 반드시 반영한다.
- `needs-triage`가 있거나 `priority:*` 라벨이 없으면 우선순위 미확정으로 보고, 구현 전 triage를 추천한다.
- 이슈 본문 또는 Project 필드에 Priority가 있어도 GitHub 라벨에 `priority:*`가 없으면 라벨 미반영 상태로 보고한다.
- `status:blocked`가 있으면 다음 추천 스킬보다 차단 사유 확인을 우선한다.
- GitHub 확인이 실패하면 실패했다고 보고하고, 로컬 산출물 기준 판단임을 명시한다.

## Inbox 확인 규칙

- `.agents/inbox.md`가 있으면 unresolved 항목을 확인한다.
- `current issue: #번호` 또는 `current issue: issue-번호`가 현재 진단 중인 이슈와 같으면 해당 이슈의 차단/후속 항목으로 요약한다.
- `current issue: none`이고 `candidate-issue`인 항목은 다음 작업 후보로 요약한다.
- `related` 항목은 현재 이슈의 직접 차단 요소가 아니라 후속 참고 항목으로 요약한다.
- 현재 이슈가 `PASS` 또는 closed 상태인데 관련 inbox 항목이 남아 있으면 `completed`, `promoted`, `deferred`, `discarded` 중 하나로 정리 필요하다고 보고한다.
- unresolved inbox 항목이 있고 GitHub Issue로 승격되지 않았으면 다음 추천에 `ai-harness-capture` 또는 `ai-harness-idea`를 포함한다.
- inbox 항목이 GitHub 열린 이슈와 의미상 중복되어 보이면 중복 가능성을 보고하되, 자동 삭제하거나 수정하지 않는다.
- inbox 확인에 실패하면 실패했다고 보고하고, inbox를 제외한 판단임을 명시한다.

## 단계 판정

각 이슈별로 존재하는 산출물과 점수 기록을 기준으로 마지막 완료 단계를 판단한다.

- `task-spec.md`, `plan.md` 없음: 계획 전
- `task-spec.md`, `plan.md` 있음: 계획 완료
- `spec.md` 있음: 상세 스펙 완료
- `implementation-notes.md` 있음: 구현 또는 Red/Green 기록 있음
- `verification.md` 있음: 검증 완료
- `review-score.json`, `review.md` 있음: 리뷰 완료
- `review-score.json`의 decision이 `PASS`: 바로 리뷰/머지 가능한 일반 PR 생성 가능
- `review-score.json`의 decision이 `REWORK`: 구현 재작업 필요
- `review-score.json`의 decision이 `FAIL`: 사람 확인 필요

주의:

- 빈 템플릿 파일은 완료 산출물로 보지 않는다. `작성 필요`, placeholder, 깨진 템플릿만 있으면 누락 또는 미완료로 판정한다.
- `implementation-notes.md`가 Red 실패 기록만 담고 있으면 "Red 완료"로 보고 다음 추천 스킬은 `ai-harness-green`이다.
- GitHub 코멘트에 사전 결정 항목이 있으면, 단계상 Green이 가능해 보여도 먼저 해당 결정을 확인하도록 추천한다.
- run-record의 status와 산출물 기준 단계가 충돌하면 충돌을 보고하고, 산출물과 GitHub 상태를 함께 근거로 판단한다.

## 다음 스킬 추천

- 계획 전: `ai-harness-plan`
- 계획 완료: `ai-harness-spec`
- 상세 스펙 완료: `ai-harness-red`
- Red 완료: `ai-harness-green`
- Green 구현 완료: `ai-harness-verify`
- 검증 완료: `ai-harness-review`
- 리뷰 완료 + `PASS`: `ai-harness-draft-pr` 또는 `ai-harness-dashboard`
- 리뷰 완료 + `REWORK`: `ai-harness-implement`
- 리뷰 완료 + `FAIL`: 사람 확인 요청
- 대시보드 데이터가 실행 기록보다 오래됨: `ai-harness-dashboard`
- GitHub Issue 코멘트에 사전 결정 항목이 있음: 구현 전 사용자 확인 및 산출물 정리
- GitHub Issue 라벨에 `needs-triage` 또는 priority 누락이 있음: 우선순위 라벨 확정
- GitHub Issue 라벨에 `status:blocked`가 있음: 차단 사유 확인
- unresolved inbox 후보가 있고 다음 작업이 확정되지 않음: `ai-harness-idea`
- unresolved inbox 후보를 GitHub Issue 초안으로 승격해야 함: `ai-harness-capture`

## 출력 형식

다음 형식으로 짧게 보고한다.

```md
현재 진행 상태

Issue #번호: 제목
- 마지막 완료 단계: ...
- 현재 결정: PASS/REWORK/FAIL/없음
- 라벨: ...
- 우선순위: P0/P1/P2/P3/미정
- 누락 산출물: ...
- 사전 결정 필요: ...
- inbox 미해결 항목: ...
- 다음 추천 스킬: ...
- 이유: ...
```

여러 이슈가 있으면 다음 작업 우선순위를 함께 제안한다.

열린 GitHub Issue와 inbox 후보가 함께 있으면 다음 형식으로 함께 요약한다.

```md
다음 작업 후보

- GitHub 열린 이슈: ...
- Inbox 후보: ...
- 우선 확인할 불일치: ...
- 추천 순서: ...
```

## 금지

- 산출물을 새로 만들지 않는다.
- 점수를 작성하거나 수정하지 않는다.
- 대시보드 데이터를 갱신하지 않는다.
- 코드를 수정하지 않는다.
- GitHub Issue 본문이나 코멘트를 수정하지 않는다.
- `.agents/inbox.md`를 수정하거나 항목을 자동 삭제하지 않는다.
