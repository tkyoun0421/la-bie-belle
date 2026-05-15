# 구현 계획

## 가정

- 사용자의 “2번” 결정은 기존 스키마 유지 + 하위 항목 확장으로 본다.
- 이번 작업의 우선순위는 문서화보다 세부 점수화 구조와 검증이다.

## 단계

1. 9개 기존 카테고리의 배점을 유지하면서 각 카테고리를 2-4개 하위 항목으로 나눈다.
2. 루브릭 YAML에 하위 항목별 점수와 채점 관점을 기록한다.
3. `review-score.json` 템플릿에 `subcriteria[]`를 추가한다.
4. JSON 스키마가 `subcriteria[]`와 객체형 감점 항목을 허용하도록 확장한다.
5. `validate-score.mjs`가 하위 항목 점수 합계와 감점 객체 형식을 검증하도록 보강한다.
6. 리뷰어 스킬/프롬프트에는 “상위 점수는 하위 점수 합계로 산출한다”는 규칙만 간결하게 추가한다.
7. 검증 결과를 `verification.md`에 기록한다.

## 예상 변경 파일

- `.agents/harness/rubrics/issue-execution.v1.yaml`
- `.agents/harness/templates/review-score.json`
- `.agents/harness/schemas/score-record.schema.json`
- `.agents/harness/scripts/validate-score.mjs`
- `.agents/skills/ai-harness-review/SKILL.md`
- `.agents/harness/prompts/reviewer.md`
- `.agents/runs/issue-48/*`

## 열린 질문

- 없음.
