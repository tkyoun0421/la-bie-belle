---
name: ai-harness-status
description: 이 프로젝트에서 오랜만에 돌아와 현재 진행 중인 AI 하네스 이슈의 상태와 다음에 호출할 스킬을 알고 싶을 때 사용한다. .agents/runs/**, run-record.json, 단계별 산출물, review-score.json, dashboard data를 확인해 마지막 완료 단계, 누락 파일, PASS/REWORK/FAIL 상태, 다음 추천 스킬을 진단할 때 사용한다. 작업을 진행하거나 파일을 수정하지 않는다.
---

# AI 하네스 상태

상태 진단만 수행한다. 계획, 구현, 검증, 리뷰, 대시보드 갱신, 초안 PR 생성은 하지 않는다.

## 확인 대상

- `.agents/runs/issue-*/run-record.json`
- `.agents/runs/issue-*/task-spec.md`
- `.agents/runs/issue-*/plan.md`
- `.agents/runs/issue-*/implementation-notes.md`
- `.agents/runs/issue-*/verification.md`
- `.agents/runs/issue-*/review-score.json`
- `.agents/runs/issue-*/review.md`
- `.agents/harness/dashboard/data/runs.js`

## 단계 판정

각 이슈별로 존재하는 산출물과 점수 기록을 기준으로 마지막 완료 단계를 판단한다.

- `task-spec.md`, `plan.md` 없음: 계획 전
- `task-spec.md`, `plan.md` 있음: 계획 완료
- `implementation-notes.md` 있음: 구현 완료
- `verification.md` 있음: 검증 완료
- `review-score.json`, `review.md` 있음: 리뷰 완료
- `review-score.json`의 decision이 `PASS`: 초안 PR 가능
- `review-score.json`의 decision이 `REWORK`: 구현 재작업 필요
- `review-score.json`의 decision이 `FAIL`: 사람 확인 필요

## 다음 스킬 추천

- 계획 전: `ai-harness-plan`
- 계획 완료: `ai-harness-implement`
- 구현 완료: `ai-harness-verify`
- 검증 완료: `ai-harness-review`
- 리뷰 완료 + `PASS`: `ai-harness-draft-pr` 또는 `ai-harness-dashboard`
- 리뷰 완료 + `REWORK`: `ai-harness-implement`
- 리뷰 완료 + `FAIL`: 사람 확인 요청
- 대시보드 데이터가 실행 기록보다 오래됨: `ai-harness-dashboard`

## 출력 형식

다음 형식으로 짧게 보고한다.

```md
현재 진행 상태

Issue #번호: 제목
- 마지막 완료 단계: ...
- 현재 결정: PASS/REWORK/FAIL/없음
- 누락 산출물: ...
- 다음 추천 스킬: ...
- 이유: ...
```

여러 이슈가 있으면 다음 작업 우선순위를 함께 제안한다.

## 금지

- 산출물을 새로 만들지 않는다.
- 점수를 작성하거나 수정하지 않는다.
- 대시보드 데이터를 갱신하지 않는다.
- 코드를 수정하지 않는다.
