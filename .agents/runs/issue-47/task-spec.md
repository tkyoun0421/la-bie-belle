# 작업 명세

## 목표

AI 하네스 대시보드에서 현재 활성 run과 과거 archive run을 더 명확히 구분하고, 누락/오래됨/불일치 같은 데이터 품질 경고를 드러낸다.

## 범위

- 대시보드 데이터에서 active run과 archived run을 구분할 수 있게 한다.
- active/archived 개수를 요약 데이터에 포함한다.
- 리뷰 점수 누락, 오래된 dashboard data, terminal 상태인데 active queue에 남은 run 같은 데이터 품질 경고를 정의한다.
- 대시보드 화면에서 run 상태와 데이터 품질 경고를 확인할 수 있게 한다.
- 다음 작업 후보 표시 범위는 사용자와 별도 확정 후 spec 단계에서 결정한다.

## 제외 범위

- GitHub Issue 생성/수정 자동화.
- inbox 자동 분류.
- 리뷰 점수 루브릭 변경.
- 대시보드 전체 UI 재설계.
- 제품 앱 코드 변경.

## 관련 파일 또는 영역

- `.agents/harness/scripts/build-dashboard-data.mjs`
- `.agents/harness/dashboard/index.html`
- `.agents/harness/dashboard/data/runs.js`
- `.agents/harness/history/runs.json`
- `.agents/runs/issue-*/`

## 검증 방법

- `node .agents/harness/scripts/build-dashboard-data.mjs`
- `node .agents/harness/scripts/diagnose-status.mjs`
- 생성된 `.agents/harness/dashboard/data/runs.js`에서 active/archived 구분과 경고 필드를 확인한다.
- 필요하면 `.agents/harness/dashboard/index.html`을 열어 화면 렌더링을 확인한다.

## 완료 기준

- dashboard data가 active run과 archived run을 구분한다.
- dashboard summary에 active/archived 개수가 들어간다.
- 데이터 품질 경고가 생성되고 화면에서 확인 가능하다.
- 기존 run 목록, 점수, 상세 보기 렌더링이 깨지지 않는다.

## 리스크

- 다음 작업 후보를 GitHub 열린 이슈까지 포함할지, 로컬 데이터만 볼지는 아직 결정되지 않았다.
- 기존 dashboard 문구 일부에 인코딩 깨짐이 있으므로 이번 작업에서 광범위한 문구 정리까지 포함하면 범위가 커질 수 있다.
- archive history의 기존 title 일부는 이미 깨져 있으므로 기록 보존과 문구 정리를 분리해야 한다.
