# 구현 기록

## 변경 파일

- `.agents/harness/scripts/build-dashboard-data.mjs`
- `.agents/harness/scripts/validate-dashboard-data.mjs`
- `.agents/harness/dashboard/index.html`
- `.agents/harness/dashboard/data/runs.js`
- `.agents/runs/issue-47/spec.md`

## 주요 결정

- 다음 작업 후보는 사용자 결정에 따라 GitHub 열린 이슈와 inbox 후보를 모두 포함한다.
- GitHub 이슈 수집은 best-effort로 처리해 `gh api` 실패가 dashboard data 생성을 막지 않게 했다.
- active run과 archived run은 `run_state`와 `archived` 필드로 명시한다.
- dashboard summary에 `active_count`, `archived_count`를 추가했다.
- dashboard data 구조 검증용 `validate-dashboard-data.mjs`를 추가했다.

## Red 결과

- `node .agents/harness/scripts/validate-dashboard-data.mjs`
- 실패 이유: 기존 `runs.js`에 `summary.active_count`, `summary.archived_count`, `data_quality_warnings`, `next_work`, `run_state`가 없었다.

## 계획에서 달라진 점

- 없음.

## 알려진 리스크

- 대시보드 HTML에는 기존 인코딩 깨짐 문구가 일부 남아 있다. 이번 작업은 #47 범위인 상태 구분, 경고, 후보 표시 동작에 집중했다.
