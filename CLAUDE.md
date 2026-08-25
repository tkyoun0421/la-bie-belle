# 협업 구조

이 저장소는 사람(태관)과 총괄 세션 하나가 끌고 간다. 상주 역할 세션은 없다.

## 문서 지도

무엇이 어디 있는지는 이 절이 정본이다. 다른 문서와 에이전트 정의문은 지도를 옮겨 적지 않고 여기를 가리킨다. 새 문서 갈래가 생기면 이 절에 한 줄을 더한다.

- `docs/handoff.md` — 지금 상태와 다음 첫 수. 세션은 여기서 시작한다
- `docs/plan.md` — task와 완료 조건
- `docs/log/` — 회차 기록. 왜 그렇게 정했는지가 여기 있다
- `docs/prd.md` — 제품 요구
- `docs/adr/` — 되돌리기 어려운 결정과 그 근거
- `docs/design-system/` — 디자인 시스템과 페이지별 디자인
- `.claude/agents/` — subagent 정의문
- `CLAUDE.md` — 이 파일. 구조와 스택과 지도

코드가 어디 있는지는 여기 적지 않는다. 저장소에서 직접 찾는 편이 항상 최신이다.

## 세션 시작

새 총괄 세션은 `docs/handoff.md`를 먼저 읽고 거기서 이어간다. 상세가 필요할 때만 `docs/plan.md`와 `docs/log/`를 본다.

## 스택과 명령어

Next.js 16(App Router, TypeScript) + Tailwind CSS 4 + shadcn/ui(`@base-ui/react` 기반), 클라이언트 상태는 zustand, 서버 상태는 TanStack Query(`app/providers.tsx`에 provider가 있다), 테스트는 vitest와 Playwright다. Node 22, 패키지 매니저는 pnpm 8.15.2 — 정확한 버전은 `package.json`이 정본이다.

- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm start` — 빌드된 앱 실행 (e2e의 webServer가 쓴다)
- `pnpm lint` — ESLint
- `pnpm typecheck` — tsc 타입 검사
- `pnpm test` — vitest 단위 테스트
- `pnpm e2e` — Playwright e2e (먼저 `pnpm build`가 필요하다)

CI(`.github/workflows/ci.yml`)는 PR마다 lint → test → build → e2e를 돌리고, `ci` job이 branch protection 필수 검사다.

## 원칙 — 결정은 총괄, 생산은 subagent

- 결정이 담기는 문서는 총괄이 대화에서 바로 쓴다. PRD, ADR, plan, 회차 로그가 여기 속한다.
- 볼륨 있는 생산은 subagent를 스폰한다. 코드 전부, 디자인 시스템 문서 전개, 페이지별 명세, 조사가 여기 속한다.
- 생산 스폰의 리턴에는 넷을 요구한다: 완료한 것, 미완으로 남긴 것, 돌린 명령과 그 결과, 발견한 이슈. 다음 스폰과 검수가 이 기록에서 출발한다.
- 경계가 애매하면 이 질문으로 판정한다: "스폰 프롬프트에 넣을 말이 대화 요약뿐인가?" 그렇다면 총괄이 직접 쓰는 쪽이 싸다.
- 찾는 일은 읽기 전용 subagent에 맡겨 총괄 컨텍스트를 아낀다. 코드 위치와 흐름은 `explorer`, 저장소 문서는 `docs-researcher`, 저장소 밖은 `web-researcher`다.
- 우리 관행과 바깥 자료가 둘 다 필요하면 `docs-researcher`를 먼저 부른다. 우리가 뭘 정해뒀는지 알고 나서 바깥을 봐야 한다.
- 검증 명령의 긴 출력은 `test-triage`가 압축해 온다. lint·typecheck·test를 돌리고 실패와 확인할 곳만 돌려준다.

## 흐름

PRD와 ADR을 먼저 세우고 `docs/plan.md`의 task로 쪼갠다. task마다 완료 조건을 같이 쓴다 — 코드가 생기기 전에 "이게 되면 완료"를 확인 가능한 문장으로 총괄이 정한다. 구현 뒤에 쓴 테스트는 이미 내린 결정을 확인할 뿐이라, 완료의 정의는 구현보다 먼저여야 한다.

기능 개발과 디자인은 병렬로 가고, 디자인이 완료된 화면부터 퍼블리싱이 붙는다.

- 디자인 산출물은 `docs/design-system/` 문서다. 디자인 시스템을 먼저, 페이지별 디자인을 다음에 만든다. 시안 방향 같은 결정은 사람이 내리고 문서 전개만 스폰한다.
- 기능 화면은 shadcn/ui + Tailwind 기본값으로 만든다. 퍼블리싱은 토큰과 스타일 교체로 입힌다.
- 퍼블리싱 검수는 자동 루프다. 검수 스폰은 합격 여부와 지적 목록을 구조화해 리턴하고, 지적마다 `docs/design-system/`의 조항을 인용해야 반려가 성립한다. 반려가 2회를 넘으면 루프를 멈추고 사람이 판정한다. 대개 디자인 문서가 모호한 탓이다.

## git

- task마다 단명 브랜치를 따고 PR로 낸다. 총괄이 리뷰하고 squash merge한다. main 직접 push는 없다.
- 코드 생산 스폰은 worktree 격리로 돌린다.
- CI는 build·lint·test에 행위 검증(Playwright e2e)을 더한다. 기능 PR은 코드 모양이 아니라 화면 흐름이 실제로 도는지까지 본다.
- clone 후 한 번 실행한다: `git config core.hooksPath .githooks`

## 기록

회차가 끝나면 총괄이 셋을 갱신한다. 쓰는 주체는 셋 다 총괄뿐이다.

- `docs/log/` 회차 로그 — 쌓는 역사다
- `docs/plan.md` task 상태
- `docs/handoff.md` — 다음 세션을 위한 현재 상태 스냅샷이라 쌓지 않고 덮어쓴다

새 문서 갈래를 만들었으면 문서 지도에도 한 줄을 더한다.

## 증축 규칙

구조는 상처가 생긴 자리에만 짓는다.

1. 같은 스폰 프롬프트를 세 번째 쓰게 되면 그때 `.claude/agents/` 정의문으로 추출한다.
2. 경계 위반이 리뷰를 통과해 main에 들어가면 그때 훅을 단다.

## 공개 저장소

이 저장소는 PUBLIC이다. 시크릿은 절대 커밋하지 않는다. `.env`는 로컬에만 두고, pre-commit 훅이 시크릿 패턴을 검사한다.
