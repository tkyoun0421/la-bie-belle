# 하네스 개선 평가

## 결정

- 하네스 건강도: 82/100
- 평가 대상: issue #45 실행과 #44/#45 dashboard 반영 상태

## 주요 개선

- 빈 템플릿 산출물을 실제 reviewed/FAIL 결과와 구분하게 됐다.
- dashboard summary가 실제 review 완료 run만 평균과 PASS/FAIL count에 반영한다.
- 활성 run에 하네스 건강도 평가가 없으면 archived 점수를 현재 평균으로 표시하지 않고 `평가 없음`으로 표시한다.
- dashboard에 노출되는 리뷰 근거, 감점 사유, 카테고리 라벨, 개선 제안 설명을 한글로 정리했다.

## 남은 리스크

- 템플릿 판별 로직이 `diagnose-status.mjs`와 `build-dashboard-data.mjs`에 중복되어 있다.
- 템플릿 산출물, 실제 PASS, 실제 0점 FAIL을 구분하는 자동 회귀 테스트가 없다.
- 하네스 평가 단계가 PR 생성 이후 사용자 지적을 받고 수행되어 단계 순서가 늦었다.

## 제안

- `2026-05-12-template-artifact-regression-tests`: 템플릿 산출물 판별 회귀 테스트 추가
