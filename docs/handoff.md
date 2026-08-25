# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 총괄이 덮어쓴다.

## 지금 상태

협업 구조와 개발 바탕이 다 섰다. Next.js + Tailwind + shadcn/ui가 FSD 배치로 서 있고(`src/app`·`screens`·`features`·`entities`·`shared`), `ci` job이 branch protection 필수 검사라 빨간불이면 merge가 막힌다. TDD는 `.claude/hooks/`의 훅 둘이 강제한다 — 짝 테스트가 없으면 파일을 쓸 수 없고 우회할 길은 없다. 규칙의 근거는 `docs/adr/ADR-001-fsd-layout-and-tdd-guard.md`에 있다.

subagent 여섯이 있다. `explorer`(코드 탐색) · `docs-researcher`(저장소 문서) · `web-researcher`(저장소 밖) · `test-triage`(검증 압축) · `implementer`(코드 생산) · `pr-diff`(merge 전 감사). 갈래는 `CLAUDE.md`에 적혀 있다.

제품은 아직 없다. 화면은 스캐폴드 기본 페이지 하나뿐이다.

## 다음 첫 수

PRD 작성. 사람과의 제품 인터뷰로 요구를 확정한다 — 결정이 담기는 문서라 총괄이 직접 쓴다. 완료 조건은 `docs/plan.md`에 있다.

## 열린 결정

- 디자인 시안 방향 — 사람이 레퍼런스를 검토한 뒤 정한다
- 세그먼트 목록 — 첫 기능 task에서 실제 파일을 보고 정한다
- `~/orca/workspaces/la-bie-belle/ladyfish` worktree — 61d7703에 멈춰 있다. 살릴 작업이 있는지 사람이 판단할 몫이다

## 주의

- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- shadcn CLI 기본 preset(base-nova)이 Radix 대신 `@base-ui/react` 기반이다. 디자인 시스템 방향 결정 때 참고.
