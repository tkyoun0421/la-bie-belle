# 구현 계획

## 가정

- 이번 단계에서는 #47을 구현하기 전 계획만 정리한다.
- `spec.md`는 사용자와 미확정 결정을 확인한 뒤 작성한다.
- 현재 확정된 범위는 active/archived run 구분과 데이터 품질 경고 개선이다.

## 단계

1. 사용자와 다음 작업 후보 표시 범위를 확정한다.
   - 선택지 A: 로컬 run/history/inbox만 표시한다.
   - 선택지 B: GitHub 열린 이슈까지 best-effort로 포함한다.
2. 확정된 결정을 바탕으로 `spec.md`를 작성한다.
3. Red 단계에서 dashboard data 필드 검증을 먼저 추가한다.
4. Green 단계에서 `build-dashboard-data.mjs`와 dashboard UI를 최소 변경한다.
5. Verify 단계에서 dashboard data 생성, status 진단, 화면 렌더링을 확인한다.

## 예상 변경 파일

- `.agents/harness/scripts/build-dashboard-data.mjs`
- `.agents/harness/dashboard/index.html`
- `.agents/harness/dashboard/data/runs.js`
- `.agents/runs/issue-47/spec.md`
- `.agents/runs/issue-47/implementation-notes.md`
- `.agents/runs/issue-47/verification.md`

## 열린 질문

- 대시보드의 "다음 작업 후보"가 GitHub 열린 이슈와 inbox 후보까지 포함해야 하는가, 아니면 로컬 run/history/inbox 기준으로만 표시해야 하는가?
