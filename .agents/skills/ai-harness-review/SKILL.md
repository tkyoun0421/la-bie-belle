---
name: ai-harness-review
description: 이 프로젝트에서 AI 하네스 리뷰 단계만 수행할 때 사용한다. 원본 이슈, 산출물, 변경 diff, verification.md를 근거로 review-score.json과 review.md를 작성하고 PASS/REWORK/FAIL 게이트를 결정해야 할 때 사용한다.
---

# AI 하네스 리뷰

리뷰 단계만 수행한다.

## 선행 조건

다음 파일이 없으면 리뷰하지 말고 누락 파일을 보고한다.

- `.agents/runs/issue-{number}/task-spec.md`
- `.agents/runs/issue-{number}/plan.md`
- `.agents/runs/issue-{number}/spec.md`
- `.agents/runs/issue-{number}/implementation-notes.md`
- `.agents/runs/issue-{number}/verification.md`

## 강제 규칙

- `review-score.json`의 `evidence`, `deductions`, `strengths`, `weaknesses`, `recommended_next_action` 값은 한국어로 작성한다.
- `review.md`는 한국어로 작성한다.
- 파일명, JSON 키, 상태값(`PASS`, `REWORK`, `FAIL`), 명령어, 코드 식별자, 라이브러리명은 원문 영어를 유지할 수 있다.
- 검증되지 않은 주장이나 추측을 좋은 점으로 쓰지 않는다.
- 미확정 사용자 결정이 남아 있었는데 산출물이 먼저 작성된 흔적이 있으면 인수인계 품질에서 감점한다.

## 절차

1. 원본 이슈, 산출물, 변경 diff, 검증 기록을 읽는다.
2. `.agents/harness/rubrics/issue-execution.v1.yaml` 기준으로 채점한다.
3. 결과물 품질 70점, 작업 과정 품질 30점으로 분리해 판단한다.
4. `review-score.json`과 `review.md`를 작성한다.
5. 점수 기록을 검증한다.

```bash
node .agents/harness/scripts/validate-score.mjs .agents/runs/issue-{issue_number}/review-score.json
```

## 게이트

- `PASS`: 80-100점. 바로 리뷰/머지 가능한 일반 PR 생성 가능.
- `REWORK`: 65-79점. 구현 재작업이 필요.
- `FAIL`: 0-64점. 사람 확인 필요.

## 금지

- 코드를 수정하지 않는다.
- PR을 만들지 않는다.
