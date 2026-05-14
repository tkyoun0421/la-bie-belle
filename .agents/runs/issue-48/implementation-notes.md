# 구현 노트

## Red

- `validate-score.mjs`가 기존 점수 합계만 확인하고 하위 배점 구조를 검증하지 못하는 상태를 확인했다.
- 하위 항목 점수 합계 불일치, 객체형 감점 사유 누락, 하위 항목 품질 기준 누락을 실패 케이스로 추가했다.

## Green

- `issue-execution.v1.yaml`을 9개 기존 카테고리 아래의 31개 하위 배점 항목으로 세분화했다.
- `review-score.json` 템플릿에 `subcriteria[]`를 추가해 각 하위 항목이 `score`, `max_score`, `evidence`, `deductions`, `quality_levels`를 갖도록 했다.
- `score-record.schema.json`은 하위 항목과 객체형 감점 항목을 허용하도록 확장했다.
- `validate-score.mjs`는 다음을 검증한다.
  - 하위 항목 `score` 합계와 상위 카테고리 `score` 일치
  - 하위 항목 `max_score` 합계와 상위 카테고리 `max_score` 일치
  - 하위 항목의 `quality_levels.full/partial/minimal/zero` 존재
  - 객체형 감점의 `reason`, `points`, `follow_up`, `severity` 형식
- 리뷰어 프롬프트와 스킬에 상위 점수는 하위 점수 합계로 산출한다는 규칙을 추가했다.
- 대시보드/아카이브 스크립트가 객체형 감점을 `reason`, `follow_up`, `severity`로 보존하도록 정규화했다.

## 범위 조정

- 대시보드 UI에 하위 항목을 표시하는 작업은 제외했다.
- 기존 완료 run은 마이그레이션하지 않고, 하위 항목이 없는 기존 점수 파일은 계속 통과하도록 했다.
