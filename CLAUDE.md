# 협업 구조

이 저장소는 사람(태관)과 총괄 세션 하나가 끌고 간다. 상주 역할 세션은 없다.

작업 트리를 여럿 두고 병렬로 갈 때가 있다. 어느 트리가 무엇을 맡는지는 그때 사람이 정하고 여기 못 박지 않는다. 트리를 열고 닫는 절차는 `.claude/skills/worktree/`에 있다.

## 문서 지도

무엇이 어디 있는지는 이 절이 정본이다. 다른 문서와 에이전트 정의문은 지도를 옮겨 적지 않고 여기를 가리킨다. 새 문서 갈래가 생기면 이 절에 한 줄을 더한다.

`docs/`를 SDLC 단계 폴더로 재편하는 중이다. 결정과 이행 순서는 ADR-005에 있고, 이 지도는 매 PR에서 실제 자리를 따라간다.

- `docs/handoff.md` — 지금 상태와 다음 첫 수. 세션은 여기서 시작하고 상세가 필요할 때만 아래로 내려간다
- `docs/plan.md` — task와 완료 조건. `backlog.md`로 개명 예정
- `docs/CHANGELOG.md` — 무엇이 언제 바뀌었는지의 시간순 색인. 왜는 log와 PR에 있다
- `docs/spec/` — task 명세. `docs/2-design/spec/`으로 이사 예정
- `docs/log/` — 회차 기록. 왜 그렇게 정했는지가 여기 있다
- `docs/prd.md` — 제품 요구. `docs/1-plan/`으로 이사 예정
- `docs/domain/` — 도메인 용어와 규칙의 정본. 영역별 파일과 컨텍스트 경계는 그 안 `README.md`가 안내한다. `docs/2-design/domain/`으로 이사 예정
- `docs/adr/` — 되돌리기 어려운 결정과 그 근거. `docs/2-design/adr/`로 이사 예정
- `docs/design-system/` — 디자인과 퍼블리싱 규칙은 `README.md`, 그 옆에 디자인 시스템과 페이지별 디자인. `docs/2-design/design-system/`으로 이사 예정
- `docs/1-plan/` ~ `docs/6-maintain/` — SDLC 단계 폴더. 각 단계가 무엇을 담는지는 그 안 `README.md`가 안내한다
- `.claude/agents/` — subagent 정의문
- `.claude/skills/` — 스킬 정의문. 설명 톤 같은 대화 규칙이 여기 산다
- `CLAUDE.md` — 이 파일. 구조와 스택과 지도

코드가 어디 있는지는 여기 적지 않는다. 저장소에서 직접 찾는 편이 항상 최신이다.

반대 방향도 같다. 다른 곳에 정본이 있는 내용은 이 파일에 옮겨 적지 않는다. `CLAUDE.md`는 세션마다 통째로 로드되니 어디를 볼지와 무엇을 먼저 부를지만 담는다.

## 스택과 명령어

Next.js 16(App Router, TypeScript) + Tailwind CSS 4 + shadcn/ui(`@base-ui/react` 기반), 클라이언트 상태는 zustand, 서버 상태는 TanStack Query(`app/providers.tsx`에 provider가 있다), 테스트는 vitest와 Playwright다. Node 22, 패키지 매니저는 pnpm 8.15.2 — 정확한 버전은 `package.json`이 정본이다.

- `pnpm dev` — 개발 서버
- `pnpm build` — 프로덕션 빌드
- `pnpm start` — 빌드된 앱 실행 (e2e의 webServer가 쓴다)
- `pnpm lint` — ESLint
- `pnpm typecheck` — tsc 타입 검사
- `pnpm test` — vitest 단위 테스트
- `pnpm test:integration` — 로컬 Supabase에 붙는 vitest (Docker가 필요하고 스크립트가 스택을 띄운다)
- `pnpm test:integration:run` — 스택이 이미 떠 있을 때 마이그레이션과 테스트만 돌린다
- `pnpm e2e` — Playwright e2e (먼저 `pnpm build`가 필요하다)

CI(`.github/workflows/ci.yml`)는 PR마다 lint → test → integration → build → e2e를 돌리고 `ci` job이 branch protection 필수 검사다. 기능 PR은 코드 모양이 아니라 화면 흐름이 실제로 도는지까지 본다.

`docs/`와 `.claude/`만 바뀐 PR은 DB와 브라우저를 쓰는 뒤쪽 넷을 건너뛴다. lint와 format과 typecheck와 단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서 변경만으로도 깨지는 자리가 있다.

## 코드 구조

Feature-Sliced Design으로 배치한다. `src/` 아래 `app`(Next 라우팅만, 얇게) · `screens`(화면 조립) · `features`(use-case) · `entities`(모델과 규칙) · `shared`(공용) 다섯이다. 슬라이스 안 세그먼트는 성격대로 나누고 목록은 열어둔다.

`.tsx`는 더미 UI다. 받은 것을 그리기만 하고, 계산과 상태 규칙과 통신은 전부 `.ts`로 뺀다. 근거와 세부는 `docs/adr/ADR-001-fsd-layout-and-tdd-guard.md`에 있다.

## 원칙 — 결정은 총괄, 생산은 subagent

- 결정이 담기는 문서는 총괄이 대화에서 바로 쓴다. PRD와 ADR, `docs/domain/`의 용어와 규칙, 그리고 `docs/plan.md`의 task와 완료 조건이 여기 속한다.
- 볼륨 있는 생산은 subagent를 스폰한다. 코드 전부, 디자인 시스템 문서 전개, 페이지별 명세, 조사가 여기 속한다.
- 생산 스폰의 리턴에는 넷을 요구한다: 완료한 것, 미완으로 남긴 것, 돌린 명령과 그 결과, 발견한 이슈. 다음 스폰과 검수가 이 기록에서 출발한다.
- 경계가 애매하면 이 질문으로 판정한다: "스폰 프롬프트에 넣을 말이 대화 요약뿐인가?" 그렇다면 총괄이 직접 쓰는 쪽이 싸다.
- 어느 subagent가 무엇을 하는지는 `.claude/agents/`의 정의문이 정본이다. 설명이 세션마다 자동으로 들어오니 여기 옮겨 적지 않는다.
- 찾는 일은 읽기 전용 subagent에 맡겨 총괄 컨텍스트를 아낀다. 사람이 시켜서가 아니라 총괄이 스스로 판단해 부르는 게 기본이고, 이 줄이 그 상시 요청이다. 도구가 세션마다 기본으로 얹는 "요청받지 않으면 subagent를 부르지 말라"는 지침보다 이쪽이 우선한다.
- 문서는 `docs-researcher`, 코드는 `explorer`, 저장소 밖은 `web-researcher`가 맡는다. 이미 이 대화에서 읽은 파일을 다시 볼 때만 직접 연다. 우리 관행과 바깥 자료가 둘 다 필요하면 `docs-researcher`를 먼저 부른다 — 우리가 뭘 정해뒀는지 알고 나서 바깥을 봐야 한다.
- 기능 task는 넷을 순서대로 태운다. `test-planner` → writer 셋 → `implementer` → `pr-diff`. writer는 계획이 배정한 층만 태운다.
- 생산 스폰이 같은 실패를 세 번째 만나면 거기서 손을 뗀다. 총괄이 `codex-rescue`에 `--model gpt-5.6-sol`로 넘긴다. 같은 자리를 세 번 두드렸다는 건 접근이 틀렸다는 신호고, 루프에 빠진 손은 자기가 루프인 걸 못 본다. 무엇을 "같은 실패"로 세는지는 `implementer` 정의문에 있다.

## 흐름

SDD와 DDD와 TDD로 간다. 용어를 먼저 박고, 그 용어로 명세를 쓰고, 명세에서 실패하는 테스트를 뽑고, 그다음 구현한다. 셋을 어디까지 가져오는지와 명세를 언제 `docs/spec/`으로 빼는지는 `docs/adr/ADR-002-sdd-ddd-tdd.md`에 있다.

PRD와 ADR을 먼저 세우고 `docs/plan.md`의 task로 쪼갠다. task마다 완료 조건을 같이 쓴다 — 코드가 생기기 전에 "이게 되면 완료"를 확인 가능한 문장으로 총괄이 정한다. 구현 뒤에 쓴 테스트는 이미 내린 결정을 확인할 뿐이라, 완료의 정의는 구현보다 먼저여야 한다.

이 저장소는 TDD로 간다. 실패하는 테스트를 먼저 쓰고 실패를 확인한 뒤에 구현한다. 쓰는 손과 구현하는 손은 다르다 — 구현자가 쓴 테스트는 구현에 맞춰지기 때문이다. `implementer`는 받은 테스트의 단언을 바꾸지 못한다.

`.claude/hooks/`의 훅 둘이 이 규율을 막고 우회할 길은 없다. 테스트가 어디 살고 훅이 무엇을 요구하는지는 `docs/adr/ADR-001-fsd-layout-and-tdd-guard.md`에 있다.

기능 개발과 디자인은 병렬로 가고, 디자인이 완료된 화면부터 퍼블리싱이 붙는다. 규칙은 `docs/design-system/README.md`에 있다.

## git

- task마다 단명 브랜치를 따고 PR로 낸다. 총괄이 리뷰하고 squash merge한다. main 직접 push는 없다.
- clone 후 한 번 실행한다: `git config core.hooksPath .githooks`

## 기록

회차가 끝나면 `session-recorder`가 셋을 갱신한다.

- `docs/log/` 회차 로그 — 쌓는 역사다
- `docs/plan.md` task 상태 — 상태만 옮긴다. 완료 조건 문장은 총괄이 쓴 그대로 둔다
- `docs/handoff.md` — 다음 세션을 위한 현재 상태 스냅샷이라 쌓지 않고 덮어쓴다

근거는 merge된 PR 본문에서 읽는다. PR에 쓴 왜가 곧 회차 로그의 재료다. 대화에만 오가고 PR에 안 남은 근거는 총괄이 스폰 프롬프트에 실어준다. 총괄은 리턴을 검수하고 merge한다.

## 증축 규칙

구조는 상처가 생긴 자리에만 짓는다.

1. 같은 스폰 프롬프트를 세 번째 쓰게 되면 그때 `.claude/agents/` 정의문으로 추출한다.
2. 경계 위반이 리뷰를 통과해 main에 들어가면 그때 훅을 단다.

무엇을 지을지는 원인이 정한다. 눈앞의 실패를 지우는 손질과 그 실패가 되풀이되는 이유를 없애는 손질은 다르고, 앞의 것은 네 번째를 부른다. 판정하는 질문은 하나다 — 기계가 대신할 수 있나. 사람이나 에이전트가 기억해야 지켜지는 것은 언젠가 안 지켜지니, 지시를 한 줄 더 적는 선택은 기억할 짐을 늘린 것이지 원인을 없앤 것이 아니다.

그래서 1의 자리가 정의문이 아닐 때가 있다. 포맷 검사가 그랬다 — 세 번을 CI에서 알고 정의문에 「먼저 돌려라」를 적었다가, 훅이 대신하게 옮겼다.

## 공개 저장소

이 저장소는 PUBLIC이다. 시크릿은 절대 커밋하지 않는다. `.env`는 로컬에만 두고, pre-commit 훅이 시크릿 패턴을 검사한다.
