# 기능 상세 스펙

## 사용자 시나리오

- 작업자가 새 issue run을 시작한 직후 status를 보면, 템플릿 파일이 존재하더라도 실제 review 완료처럼 보이지 않아야 한다.
- 작업자가 dashboard를 보면, 실제 review가 작성되지 않은 run이 0점 FAIL로 평균과 실패 수를 왜곡하지 않아야 한다.
- Reviewer가 실제 0점 FAIL을 작성한 경우에는 템플릿이 아니라 유효한 review 결과로 표시되어야 한다.

## 정상 흐름

- `start-issue.mjs`가 생성한 템플릿 파일은 `template: true`, `complete: false`로 진단한다.
- stage 추론은 complete artifact만 사용한다.
- review decision은 complete review score에서만 가져온다.
- dashboard summary의 평균 점수와 PASS/REWORK/FAIL count는 유효한 review score가 있는 run만 반영한다.
- review score가 없는 run은 dashboard 개별 run에 `total_score: null`, `decision: null`, data quality warning을 갖는다.

## 엣지케이스

- 실제 review가 0점 FAIL일 수 있으므로, 점수값만으로 템플릿 여부를 판단하지 않는다.
- `score_id`가 아직 템플릿 sentinel(`issue-000-review-attempt-1`)이거나 `recommended_next_action`에 `작성 필요`가 있으면 템플릿으로 본다.
- markdown 산출물에 `작성 필요`만 남아 있으면 템플릿으로 본다.
- 일부 섹션만 작성된 중간 산출물은 complete로 보지 않고 quality warning을 남긴다.

## 에러 상태

- JSON 파싱 실패는 parse error warning으로 표시하고 complete artifact로 보지 않는다.
- run-record가 없으면 dashboard 대상에서 제외한다.

## 빈 상태

- active run이 없으면 기존처럼 빈 runs 목록을 반환한다.
- review score가 하나도 없으면 dashboard average issue score는 `null`로 둔다.

## 로딩 상태

- 해당 없음. CLI 스크립트와 dashboard data 생성 기준 변경이다.

## 권한과 인증 조건

- 로컬 파일 읽기/쓰기 권한이 필요하다.
- GitHub API 권한은 이 구현 자체에는 필요하지 않다.

## 입력 검증

- `review-score.json`은 JSON parse가 가능해야 한다.
- review decision은 complete review score에서만 PASS/REWORK/FAIL로 사용한다.
- artifact 경로는 기존 run-record artifact contract를 따른다.

## 데이터 규칙

- artifact info는 `exists`, `bytes`, `updated_at`에 더해 `complete`, `template`, `quality_warnings`를 제공한다.
- dashboard run은 `data_quality_warnings` 배열을 제공한다.
- summary count/average는 complete review score가 있는 reviewed run만 대상으로 한다.

## UI 동작

- dashboard UI 코드는 변경하지 않는다.
- dashboard data에 null score와 warning 배열을 제공해 후속 UI 개선이 가능하게 한다.

## API 또는 모듈 계약

- `diagnose-status.mjs` 출력은 기존 필드를 유지하고 artifact별 메타데이터를 추가한다.
- `build-dashboard-data.mjs`의 `window.AI_HARNESS_RUNS` 구조는 기존 필드를 유지하되 `data_quality_warnings`, `review_complete`, nullable score/decision을 추가한다.

## 테스트 케이스

- 템플릿 상태의 issue-38은 `inferred_artifact_stage: planned`, `decision: null`로 진단된다.
- 실제 PASS review가 있는 issue-44는 `reviewed`, `PASS`로 유지된다.
- issue-45가 review 작성 전에는 dashboard summary에 실패로 집계되지 않는다.
- dashboard data 생성 후 review 없는 run은 `data_quality_warnings`를 가진다.
- #45 review score 작성 후 `validate-score.mjs`가 통과한다.

## Red 단계 우선순위

1. 현재 `diagnose-status.mjs`가 템플릿 issue-38을 `reviewed`/`FAIL`로 오인하는 것을 기록한다.
2. 현재 `build-dashboard-data.mjs`가 템플릿 review score를 summary 평균과 FAIL count에 포함하는 것을 기록한다.
3. Green 이후 같은 명령에서 issue-38이 실제 완료 run으로 집계되지 않는지 확인한다.
