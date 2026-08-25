# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 총괄이 덮어쓴다.

## 지금 상태

협업 구조와 개발 바탕이 다 섰다. Next.js + Tailwind + shadcn/ui가 FSD 배치로 서 있고(`src/app`·`screens`·`features`·`entities`·`shared`), `ci` job이 branch protection 필수 검사라 빨간불이면 merge가 막힌다. TDD는 `.claude/hooks/`의 훅 둘이 강제한다 — 짝 테스트가 없으면 파일을 쓸 수 없고 우회할 길은 없다. 규칙의 근거는 `docs/adr/ADR-001-fsd-layout-and-tdd-guard.md`에 있다.

subagent가 열 개 있다. `explorer`(코드 탐색) · `docs-researcher`(저장소 문서) · `web-researcher`(저장소 밖) · `test-planner`(테스트 계획, sonnet) · `unit-test-writer` · `e2e-test-writer` · `test-triage`(검증 압축) · `implementer`(코드 생산) · `pr-diff`(merge 전 감사) · `session-recorder`(회차 마감). 갈래는 `CLAUDE.md`에 적혀 있다.

기능 task는 넷을 순서대로 태운다. `test-planner`로 리스크에 층을 배정하고, writer 둘이 실패하는 테스트를 쓰고, `implementer`가 통과시켜 PR을 열고, `pr-diff`가 감사한다. implementer는 테스트를 쓰지도 고치지도 못한다 — 받은 빨간불을 초록불로 바꿀 뿐이고, 테스트가 없으면 시작하지 않고 멈춘다. 이 흐름은 아직 실전에서 한 번도 안 돌았다. 다음 기능 task에서 처음 돈다.

회차 마감(회차 로그·plan.md·handoff.md 갱신, PR 열기)은 이제 `session-recorder`가 한다. 근거는 merge된 PR 본문에서 가져오고, PR에 안 남은 판단만 총괄이 프롬프트로 실어준다.

`CLAUDE.md`는 85줄대로 줄었다. subagent 설명이나 ADR에 이미 있는 내용을 사본으로 옮겨 적지 않는다는 역방향 규칙이 문서 지도 절에 있다 — 새로 뭔가 적기 전에 정본이 다른 데 있는지부터 확인한다.

제품은 아직 없다. 화면은 스캐폴드 기본 페이지 하나뿐이다.

## 다음 첫 수

PRD 작성. 사람과의 제품 인터뷰로 요구를 확정한다 — 결정이 담기는 문서라 총괄이 직접 쓴다. 완료 조건은 `docs/plan.md`에 있다.

## 열린 결정

- 디자인 시안 방향 — 사람이 레퍼런스를 검토한 뒤 정한다
- 세그먼트 목록 — 첫 기능 task에서 실제 파일을 보고 정한다
- `~/orca/workspaces/la-bie-belle/ladyfish` worktree — 61d7703에 멈춰 있다. 살릴 작업이 있는지 사람이 판단할 몫이다
- integration 테스트 층 — 지금은 검증할 대상이 저장소에 없다. PRD에서 영속이나 인증이 요구로 확정되면 그때 ADR로 자리와 러너와 CI 단계를 정한다. 같이 봐야 할 것이 하나 있다. `tdd-guard-unit.py`는 `src/` 아래 실행 코드에 짝 unit 테스트를 무조건 요구하는데(`src/app/`과 `src/shared/ui/`만 예외다), server action이나 repository가 생기면 그 파일들도 걸린다. 그 층은 mock 없이 unit으로 검증이 안 되니 훅을 같이 손보지 않으면 mock 범벅 테스트가 나온다
- `playwright.config.ts`의 CI 리트라이 2 — 지금은 e2e가 하나뿐이라 티가 안 나지만, 리트라이는 불안정한 테스트를 가려준다. spec이 쌓이면 유지할지 정한다

## 주의

- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- shadcn CLI 기본 preset(base-nova)이 Radix 대신 `@base-ui/react` 기반이다. 디자인 시스템 방향 결정 때 참고.
