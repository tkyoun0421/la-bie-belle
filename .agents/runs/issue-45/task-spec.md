# 작업 명세

## 목표

하네스 status/dashboard/review 표시가 빈 템플릿 산출물을 실제 실행 결과로 오인하지 않도록, 실제 작성된 run과 누락/초기 템플릿 데이터를 구분한다.

## 범위

- `diagnose-status.mjs`가 빈 템플릿 산출물을 완료 산출물로 추론하지 않도록 개선
- `build-dashboard-data.mjs`가 빈 템플릿 review score를 실제 0점/FAIL run으로 표시하지 않도록 개선
- 누락 또는 템플릿 상태인 데이터에 데이터 품질 경고를 노출
- #45 run 산출물에 Red/Green/검증/리뷰 기록 남김

## 제외 범위

- dashboard UI 레이아웃 전면 개편
- 리뷰 루브릭 세분화
- PR follow-up 추적 자동화
- 기존 GitHub Issue 라벨/Project 필드 정리
- 제품 코드 변경

## 관련 파일 또는 영역

- `.agents/harness/scripts/diagnose-status.mjs`
- `.agents/harness/scripts/build-dashboard-data.mjs`
- `.agents/harness/templates/*`
- `.agents/harness/dashboard/data/runs.js`
- `.agents/runs/issue-45/*`

## 검증 방법

- 템플릿만 있는 `issue-38` 또는 신규 run이 `reviewed`/`FAIL`로 추론되지 않는지 확인
- #44처럼 실제 review score가 작성된 run은 PASS로 유지되는지 확인
- dashboard data에서 템플릿 run이 평균 점수와 FAIL count를 왜곡하지 않는지 확인
- `validate-score.mjs`로 #45 review score 검증

## 완료 기준

- 빈 템플릿 review 산출물이 status에서 terminal decision으로 표시되지 않는다.
- dashboard summary가 실제 review score가 있는 run만 issue score 평균과 pass/rework/fail count에 반영한다.
- 누락/템플릿 데이터는 실제 0점 대신 데이터 품질 경고 또는 missing 상태로 표현된다.
- #44 PASS run은 계속 정상 PASS로 표시된다.

## 리스크

- 템플릿 판별 조건이 너무 넓으면 실제 낮은 점수의 review를 누락할 수 있다.
- 템플릿 판별 조건이 너무 좁으면 기존처럼 빈 산출물이 실제 실패로 보일 수 있다.
- dashboard summary 계산 기준 변경으로 과거 수치가 달라질 수 있다.
