# 구현 계획

## 가정

- `start-issue.mjs`는 호환성을 위해 템플릿 파일을 계속 생성한다.
- 빈 템플릿 파일은 산출물 파일이 존재하더라도 완료 산출물로 보지 않는다.
- 실제 0점/FAIL review는 템플릿의 sentinel 값과 작성 필요 문구가 제거된 경우에만 유효한 review로 본다.

## 단계

1. 현재 `diagnose-status.mjs`와 `build-dashboard-data.mjs`에서 파일 존재만으로 stage/decision을 추론하는 지점을 확인한다.
2. Red 단계로 템플릿 run이 `reviewed`/`FAIL`로 오인되는 현재 출력을 기록한다.
3. 공통 템플릿 판별 헬퍼를 각 스크립트에 추가한다.
4. status 진단에서 artifact별 `complete`/`template`/`quality_warnings`를 표시하고, stage 추론은 complete artifact만 사용하게 한다.
5. dashboard data에서 유효한 review score가 있는 run만 summary 평균과 PASS/REWORK/FAIL count에 반영하고, 누락 데이터는 `data_quality_warnings`로 노출한다.
6. #44 PASS와 #45 진행 상태, issue-38 템플릿 상태를 함께 검증한다.
7. #45 산출물과 review score를 작성하고 점수 검증을 실행한다.

## 예상 변경 파일

- `.agents/harness/scripts/diagnose-status.mjs`
- `.agents/harness/scripts/build-dashboard-data.mjs`
- `.agents/runs/issue-45/task-spec.md`
- `.agents/runs/issue-45/plan.md`
- `.agents/runs/issue-45/spec.md`
- `.agents/runs/issue-45/implementation-notes.md`
- `.agents/runs/issue-45/verification.md`
- `.agents/runs/issue-45/review-score.json`
- `.agents/runs/issue-45/review.md`
- `.agents/runs/issue-45/state.json`
- `.agents/runs/issue-45/run-record.json`

## 열린 질문

- 없음. 이슈 본문은 dashboard/status/review 표시 기준 점검을 모두 범위로 제시하므로 세 영역 모두 다룬다.
