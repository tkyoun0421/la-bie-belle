# 검증

## 실행 결과

- `node .agents/harness/scripts/validate-score.mjs .agents/harness/templates/review-score.json` 통과
- `node .agents/harness/scripts/validate-score.mjs .agents/runs/issue-47/review-score.json` 통과
- `node .agents/harness/scripts/validate-score.mjs .agents/runs/issue-48/review-score.json` 통과
- `node --check .agents/harness/scripts/validate-score.mjs` 통과
- `node --check .agents/harness/scripts/build-dashboard-data.mjs` 통과
- `node --check .agents/harness/scripts/archive-completed-runs.mjs` 통과
- `pnpm test` 통과: 2개 파일, 6개 테스트
- `pnpm lint` 통과
- `pnpm typecheck` 통과
- `pnpm build` 통과
- `node .agents/harness/scripts/build-dashboard-data.mjs` 통과
- `node .agents/harness/scripts/validate-dashboard-data.mjs` 통과
- `git diff --check` 통과, 줄바꿈 변환 경고만 있음

## 확인한 내용

- 새 템플릿은 하위 배점과 내부 품질 기준을 포함해 검증을 통과한다.
- 기존 #47 점수 파일은 `subcriteria[]` 없이도 검증을 통과한다.
- 테스트에서 하위 점수 합계 불일치, 감점 객체 `reason` 누락, 하위 품질 기준 누락이 실패로 잡힌다.
- 대시보드 데이터 생성은 객체형 감점을 `reason`, `follow_up`, `severity`로 보존한다.

## 남은 리스크

- PowerShell `ConvertFrom-Json`은 UTF-8 한국어 파일을 기본 인코딩으로 읽을 때 깨질 수 있으므로, JSON 처리는 Node 기반 검증을 기준으로 삼았다.
- 대시보드 UI에는 아직 하위 항목 상세 표시가 없다.
