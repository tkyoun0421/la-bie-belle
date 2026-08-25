# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

PRD와 도메인 용어가 섰다. `docs/prd.md`는 라비에벨 웨딩홀 근무자용 PWA로 제품을 정의한다 — 관리자가 월 근무표를 확정하면 근무자 폰에 뜨고, 현장에서 출근을 찍고, 그 기록에서 앱이 급여를 계산한다. 1차 범위는 근무표·교대·출근 인증·급여·휴무 희망·알림·계정·관리자 통계이고, 예식 정보 관리와 앱 안 채팅은 비범위다. 급여 가산 규칙은 예시 금액까지 본문에 박혀 있다 — 시급 12,000원 기준 평일 10시간 126,000원, 공휴일 10시간 180,000원. `docs/domain.md`는 근무표·포지션·배정·교대·출근 인증·시급·가산 같은 용어를 한 뜻으로 못박고, "근무"와 "승인"처럼 자리마다 뜻이 갈리는 말은 경계로 나눠 적었다.

개발 방법론은 ADR-002로 SDD(Spec-Driven Development)·DDD·TDD 순서를 정했다. 용어를 `docs/domain.md`에 먼저 고정하고, `docs/plan.md`의 완료 조건(또는 승격 기준에 걸리면 `docs/spec/<task>.md`)으로 명세를 쓰고, 거기서 실패하는 테스트를 뽑고, 그다음 구현한다. 도메인 규칙은 `entities/`에만 두고, 컨텍스트 경계는 코드 폴더가 아니라 `docs/domain.md` 문서로만 긋는다.

그 아래 협업 구조와 개발 바탕은 그대로다. Next.js + Tailwind + shadcn/ui가 FSD 배치로 서 있고(`src/app`·`screens`·`features`·`entities`·`shared`), `ci` job이 branch protection 필수 검사라 빨간불이면 merge가 막힌다. TDD는 `.claude/hooks/`의 훅 둘이 강제한다 — 짝 테스트가 없으면 파일을 쓸 수 없다. subagent 열 개가 있고(`explorer`·`docs-researcher`·`web-researcher`·`test-planner`·`unit-test-writer`·`e2e-test-writer`·`test-triage`·`implementer`·`pr-diff`·`session-recorder`), 기능 task는 `test-planner` → writer 둘 → `implementer` → `pr-diff` 순으로 돈다. 이 흐름은 아직 한 번도 실전에서 안 돌았다. 화면은 여전히 스캐폴드 기본 페이지 하나뿐이다.

## 다음 첫 수

사람이 다음 중에서 고른다.

- 디자인 레퍼런스 검토 — `plan.md`에 남은 task다. 시안 방향을 사람이 정한다.
- 첫 기능 task 쪼개기 — PRD가 섰으니 나눌 수 있다. `test-planner` → writer 둘 → `implementer` → `pr-diff` 흐름이 여기서 처음 실전으로 돈다.

후자를 고르면 열린 결정에 있는 영속·인증 기술 선택과 퇴사자 처리를 먼저 정해야 한다. 둘 다 그 흐름이 돌기 전에 막혀 있다.

## 열린 결정

- 디자인 시안 방향 — 사람이 레퍼런스를 검토한 뒤 정한다
- 세그먼트 목록 — 첫 기능 task에서 실제 파일을 보고 정한다
- `~/orca/workspaces/la-bie-belle/ladyfish` worktree — 61d7703에 멈춰 있다. 살릴 작업이 있는지 사람이 판단할 몫이다
- 영속과 인증 기술 선택 — PRD가 근무표와 계정을 요구로 확정해 더 이상 미룰 수 없다. DB 없이는 화면만 그리다 끝난다. ADR로 정할 때 `tdd-guard-unit.py`도 같이 봐야 한다. 이 훅은 `src/` 아래 실행 코드에 짝 unit 테스트를 무조건 요구하는데(`src/app/`과 `src/shared/ui/`만 예외), server action이나 repository가 생기면 그 파일들도 걸린다. 그 층은 mock 없이 unit으로 검증이 안 되니 훅을 같이 손보지 않으면 mock 범벅 테스트가 나온다
- 퇴사자와 지난 근무표 보존 — 급여 때문에 생각보다 급하다. 사람이 나가도 지난 정산 기록은 남아야 하고 근무표에서는 안 보여야 한다. 첫 기능 task 전에 정하는 편이 낫다
- `playwright.config.ts`의 CI 리트라이 2 — 지금은 e2e가 하나뿐이라 티가 안 나지만, 리트라이는 불안정한 테스트를 가려준다. spec이 쌓이면 유지할지 정한다

## 주의

- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- shadcn CLI 기본 preset(base-nova)이 Radix 대신 `@base-ui/react` 기반이다. 디자인 시스템 방향 결정 때 참고.
- 새 개념이 코드에 등장하면 먼저 `docs/domain.md`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- task 완료 조건이 세 문장을 넘거나 예외 규칙이 둘 이상이면 `docs/spec/<task>.md`로 승격한다(ADR-002). 첫 기능 task부터 이 기준을 적용한다.
