# 구현 기록

## 변경 파일

- `.agents/harness/scripts/diagnose-status.mjs`
- `.agents/harness/scripts/build-dashboard-data.mjs`
- `.agents/harness/dashboard/data/runs.js`
- `.agents/runs/issue-45/*`

## 주요 결정

- Markdown 산출물은 플레이스홀더 라인(`작성 필요.`, `- 작성 필요.`)이 남아 있으면 템플릿으로 본다.
- `review-score.json`은 template sentinel 값(`issue-000-review-attempt-1`, `1970-01-01T00:00:00.000Z`, `작성 필요`, evidence 없는 0점 FAIL)을 기준으로 템플릿 여부를 판단한다.
- `diagnose-status.mjs`는 artifact별 `complete`, `template`, `quality_warnings`를 표시하고 complete artifact만 stage/decision 추론에 사용한다.
- `build-dashboard-data.mjs`는 유효한 review score가 있는 run만 summary 평균과 PASS/REWORK/FAIL count에 반영한다.
- dashboard data는 작성된 산출물이 없는 template-only run을 제외하고, review 전 run은 `review_complete: false`, `total_score: null`, `data_quality_warnings`로 표시한다.

## 계획에서 달라진 점

- 없음.

## 알려진 리스크

- 템플릿 판별은 현재 템플릿 문구와 sentinel 값에 기반한다. 템플릿 형식이 바뀌면 판별 조건도 함께 갱신해야 한다.
