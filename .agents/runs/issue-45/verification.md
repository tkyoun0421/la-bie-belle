# 검증 기록

## 실행한 명령

```txt
node .agents/harness/scripts/diagnose-status.mjs
node .agents/harness/scripts/build-dashboard-data.mjs
Get-Content .agents\harness\dashboard\data\runs.js -Encoding UTF8 | Select-Object -First 120
```

## 결과

- `diagnose-status.mjs`에서 template-only issue-38은 `inferred_artifact_stage: unplanned`, `decision: null`, `cleanup_candidate: false`로 표시됐다.
- #44는 실제 작성된 review artifact를 기준으로 `reviewed`, `PASS`를 유지했다.
- #45는 review 작성 전 상태에서 `specified`, `decision: null`로 표시됐고 템플릿 review/verification artifact 경고를 표시했다.
- `build-dashboard-data.mjs`는 template-only issue-38을 dashboard runs에서 제외했다.
- dashboard summary는 review 완료 run만 집계해 `issue_count: 1`, `average_issue_score: 92`, `pass_count: 1`, `fail_count: 0`을 표시했다.
- review 전 #45는 `review_complete: false`, `total_score: null`, `data_quality_warnings`를 표시했다.
- 후속 보정에서 dashboard 리뷰 근거, 감점 사유, 카테고리 라벨, 개선 제안 설명, agent/workflow 설명을 한글로 표시하도록 갱신했다.
- 활성 run에 하네스 건강도 평가가 없으면 archived run의 74점을 현재 `average_harness_score`로 표시하지 않고 `null`로 표시하도록 수정했다.
- dashboard 화면은 null 점수를 `평가 없음`으로 표시한다.

## 완료 기준 매핑

- 빈 템플릿 review 산출물은 더 이상 status에서 terminal decision으로 표시되지 않는다.
- dashboard summary는 실제 review score가 있는 run만 평균과 결정 count에 반영한다.
- 누락/템플릿 데이터는 실제 0점 대신 `null` score와 data quality warning으로 표시된다.
- #44 PASS run은 정상 PASS로 유지된다.
- dashboard 근거 문구와 하네스 표시가 한글/미평가 상태로 정리됐다.

## 건너뛴 검증

- 없음.

## 남은 리스크

- 실제 0점 FAIL review가 템플릿 sentinel 값을 제거하고 evidence/deductions를 작성해야 유효 review로 집계된다.
