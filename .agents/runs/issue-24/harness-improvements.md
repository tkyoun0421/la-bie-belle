# 하네스 개선 제안

## 평가 요약

- 대상: Issue #24 프로젝트 개발 표준 뼈대 생성
- 총점: 74/100
- 기준: `.agents/harness/rubrics/harness-health.v1.yaml`
- 판단: 하네스는 기본 실행 흐름을 유지했지만, PR 직전 검증과 대시보드 누락 상태 표시가 약하다.

## 낮은 항목

### verification_gate_quality: 13/20

PR CI에서 commitlint revision range 오류가 뒤늦게 발견됐다. 로컬 검증은 통과했지만 GitHub Actions의 checkout 깊이와 base/head sha 접근 조건을 반영하지 못했다.

추가로 Windows 줄끝과 Prettier check 불일치도 PR 브랜치에서 뒤늦게 발견됐다. 검증 단계가 “로컬 명령 통과”와 “PR CI에서 같은 조건으로 통과”를 분리해 보지 못한 것이 원인이다.

제안:

- `.agents/harness/improvements/proposals/2026-05-10-verification-ci-parity.json`

### record_and_dashboard_quality: 5/10

대시보드 데이터는 issue 점수는 표시했지만, 하네스 건강도 산출물이 없을 때 `0`으로만 표시했다. 이 상태는 실제 0점인지 평가 미실행인지 구분되지 않는다.

대시보드 갱신 단계도 건강도 산출물 부재를 먼저 보고하지 않아 사용자가 직접 물어보기 전까지 누락이 드러나지 않았다.

제안:

- `.agents/harness/improvements/proposals/2026-05-10-dashboard-health-missing-state.json`

## 승인 전 금지

- 이 평가는 설정, 프롬프트, 루브릭, 자동화 권한을 직접 변경하지 않는다.
- 제안은 `proposed` 상태이며, 사용자 승인 후 별도 작업으로 구현한다.
