# 작업 명세

## 목표

리뷰 점수 100점을 채점자가 더 세세하게 나눠 적용할 수 있도록 기존 9개 카테고리 아래에 하위 배점 항목을 추가한다. 핵심은 문서 설명량이 아니라 실제 `review-score.json`에서 하위 점수를 합산하고 검증할 수 있는 점수 구조다.

## 범위

- 기존 `review-score.json.categories[]` 구조는 유지한다.
- 각 카테고리에 선택 필드 `subcriteria[]`를 추가해 세부 배점을 기록한다.
- `subcriteria[]`가 있으면 하위 점수 합계가 상위 카테고리 점수와 정확히 일치해야 한다.
- 감점 항목은 문자열 또는 객체를 허용하되, 객체형 감점에는 개선 작업으로 이어지는 `follow_up`을 기록할 수 있게 한다.
- 루브릭, 템플릿, JSON 스키마, 검증 스크립트를 같은 점수 구조로 맞춘다.

## 제외 범위

- 기존 완료 run 파일을 일괄 마이그레이션하지 않는다.
- PASS/REWORK/FAIL 경계는 바꾸지 않는다.
- 대시보드 UI에 하위 항목 표시를 추가하지 않는다.

## 관련 파일 또는 영역

- `.agents/harness/rubrics/issue-execution.v1.yaml`
- `.agents/harness/templates/review-score.json`
- `.agents/harness/schemas/score-record.schema.json`
- `.agents/harness/scripts/validate-score.mjs`
- `.agents/skills/ai-harness-review/SKILL.md`
- `.agents/harness/prompts/reviewer.md`

## 검증 방법

- 기존 #47 `review-score.json`이 하위 항목 없이도 검증을 통과해야 한다.
- 새 #48 `review-score.json` 템플릿이 하위 항목 포함 상태로 검증을 통과해야 한다.
- 하위 항목 점수 합계가 상위 점수와 다르면 검증이 실패해야 한다.
- 객체형 감점에 `reason`이 없으면 검증이 실패해야 한다.

## 완료 기준

- 100점 루브릭이 실제 채점 가능한 하위 배점으로 나뉜다.
- 새 점수 구조가 기존 점수 파일과 하위 호환된다.
- 검증 스크립트가 하위 배점의 합계 오류를 잡는다.

## 리스크

- 배점이 지나치게 세분화되면 리뷰어가 기계적으로 채점할 수 있으므로 하위 항목은 카테고리별 2-4개로 제한한다.
- 기존 파일 호환성을 깨뜨리지 않도록 `subcriteria`는 선택 항목으로 둔다.
