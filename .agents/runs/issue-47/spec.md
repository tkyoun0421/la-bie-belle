# 상세 스펙

## 확정된 결정

- 대시보드의 다음 작업 후보는 GitHub 열린 이슈와 inbox 후보까지 포함한다.
- GitHub 후보 수집은 best-effort로 처리한다. `gh api` 실패, 인증 실패, 네트워크 실패가 있어도 dashboard data 생성은 실패하지 않고 경고를 남긴다.
- 이번 작업은 하네스 대시보드 데이터 생성과 대시보드 표시만 다룬다.

## 사용자 시나리오

- 하네스 운영자는 대시보드에서 active run과 archived run 개수를 볼 수 있다.
- 하네스 운영자는 이슈별 run 행이 active인지 archived인지 바로 구분할 수 있다.
- 하네스 운영자는 리뷰 점수 누락, terminal active run 잔존, GitHub 후보 수집 실패 같은 데이터 품질 경고를 볼 수 있다.
- 하네스 운영자는 다음 작업 후보로 GitHub 열린 이슈와 inbox 후보를 함께 볼 수 있다.

## 정상 흐름

1. `build-dashboard-data.mjs`가 active run, history, 개선 제안, inbox를 읽는다.
2. `build-dashboard-data.mjs`가 `gh api`로 열린 GitHub 이슈 목록을 best-effort로 읽는다.
3. 생성 데이터에 다음 필드가 포함된다.
   - `summary.active_count`
   - `summary.archived_count`
   - `data_quality_warnings`
   - `next_work.github_issues`
   - `next_work.inbox_candidates`
   - `next_work.warnings`
4. 대시보드는 요약 카드, run 행, 경고 영역, 다음 작업 후보 영역에 새 데이터를 표시한다.

## 엣지 케이스

- active run이 없어도 오류가 아니다. `active_count: 0`으로 표시한다.
- archived run이 없어도 오류가 아니다. `archived_count: 0`으로 표시한다.
- inbox 후보가 없으면 빈 배열로 표시한다.
- GitHub 열린 이슈가 없으면 빈 배열로 표시한다.
- GitHub 후보 수집에 실패하면 `next_work.warnings`에 원인을 남기고 로컬 데이터만으로 dashboard data를 생성한다.
- reviewed + terminal decision 상태의 active run이 남아 있으면 archive/cleanup 필요 경고를 남긴다.
- review score가 없는 active run은 행을 유지하고 데이터 품질 경고로 표시한다.

## 데이터 규칙

- active run 행은 `run_state: "active"`, `archived: false`를 가진다.
- archived run 행은 `run_state: "archived"`, `archived: true`를 가진다.
- GitHub 후보의 priority는 `priority:*` 라벨을 우선하고, 없으면 이슈 본문의 `Priority: P0`부터 `Priority: P3`까지를 읽는다.
- GitHub 후보의 blocked 여부는 `status:blocked` 라벨로 판단한다.
- GitHub 후보 목록에서 pull request는 제외한다.
- inbox 후보는 `.agents/inbox.md`의 unresolved 항목 중 `candidate-issue`가 포함된 항목으로 판단한다.

## UI 동작

- 이슈 목록 테이블에는 active/archived 상태 열이 추가된다.
- 데이터 품질 경고가 있으면 이슈 목록 위에 표시한다.
- 다음 작업 후보는 이슈 목록 화면 하단에 표시한다.
- 기존 PASS/REWORK/FAIL 필터는 계속 동작한다.

## 테스트 케이스

1. dashboard data 생성이 성공한다.
2. 생성 데이터에 `summary.active_count`, `summary.archived_count`가 있다.
3. 모든 run 행에 `run_state`가 있다.
4. 생성 데이터에 `data_quality_warnings` 배열이 있다.
5. 생성 데이터에 `next_work.github_issues`, `next_work.inbox_candidates`, `next_work.warnings` 배열이 있다.
6. `gh` 사용 가능 환경에서는 열린 일반 이슈가 GitHub 후보로 들어간다.
7. `diagnose-status`가 오류 없이 현재 run 상태를 출력한다.

## Red 단계 우선순위

1. `runs.js` 구조를 검사하는 검증 스크립트를 추가한다.
2. 현재 dashboard data에 새 필드가 없어서 검증이 실패하는 것을 확인한다.
3. Green 단계에서 data 생성기와 dashboard UI를 수정해 검증을 통과시킨다.
