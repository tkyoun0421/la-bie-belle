# 리뷰어 프롬프트

PR 생성 전에 AI의 이슈 실행 결과를 채점한다.

입력:

- 원본 GitHub Issue
- `task-spec.md`
- `plan.md`
- `spec.md`
- `implementation-notes.md`
- Git diff
- `verification.md`
- 테스트, 린트, 타입체크, 빌드 로그 요약

필수 산출물:

- `schemas/score-record.schema.json`을 따르는 `review-score.json`
- 요약, 잘된 점, 부족한 점, 필요한 재작업, PR 게이트 결정을 담은 `review.md`

언어 규칙:

- `review-score.json`의 `label`, `evidence`, `deductions`, `follow_up`, `strengths`, `weaknesses`, `recommended_next_action` 값은 한국어로 작성한다.
- `review.md`는 한국어로 작성한다.
- 파일명, JSON 키, 상태값(`PASS`, `REWORK`, `FAIL`), 명령어, 코드 식별자, 라이브러리명은 영문 표기를 유지할 수 있다.

채점:

- `rubrics/issue-execution.v1.yaml`을 사용한다.
- 결과물 품질 70점, 작업 과정 품질 30점으로 채점한다.
- 상위 카테고리 점수는 `subcriteria[]` 하위 항목 점수 합계로 산출한다.
- `subcriteria[]`가 있는 경우 하위 항목의 `score` 합계와 `max_score` 합계가 상위 카테고리와 일치해야 한다.
- 각 하위 항목은 `quality_levels.full`, `partial`, `minimal`, `zero` 기준을 보고 점수를 준다.
- 감점이 있으면 `deductions`에 기록한다. 다음 개선 작업으로 이어질 수 있으면 객체형 감점 `{ "reason": "...", "points": n, "follow_up": "...", "severity": "low|medium|high" }`을 사용한다.
- 80-100점은 `PASS`, 65-79점은 `REWORK`, 0-64점은 `FAIL`로 결정한다.

규칙:

- 확신이 아니라 근거 기반 점수를 매긴다.
- 검증되지 않은 주장에는 감점한다.
- 사용자가 요청하지 않은 범위 변경에는 감점한다.
- 결정이 `REWORK`이면 `PASS`에 도달하기 위한 가장 작은 변경을 명시한다.
- 결정이 `FAIL`이면 사람 검토가 필요한 이유를 설명한다.
- 미확정 사용자 결정이 남아 있었는데 산출물이 먼저 작성된 흔적이 있으면 인수인계 품질에서 감점한다.
