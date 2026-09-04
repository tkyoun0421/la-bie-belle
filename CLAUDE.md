# la-bie-belle

## 문서 지도

무엇이 어디 있는지는 이 절이 정본이다. 다른 문서는 여기를 가리키고, 새 갈래가 생기면 한 줄을 더한다. 다른 곳에 정본이 있는 내용은 여기 옮겨 적지 않는다. 재편의 결정과 이행 순서는 ADR-005에 있다.

- `docs/handoff.md` — 지금 상태와 다음 첫 수. 세션은 여기서 시작한다
- `docs/backlog.md` — task 보드. 완료 조건은 행이 링크하는 spec에 산다
- `docs/CHANGELOG.md` — 날짜·변경·PR 표. 왜는 log와 PR에
- `docs/log/` — 회차 기록. 왜 그렇게 정했는지
- `docs/1-plan/` — 기획: prd, 시나리오, 로드맵, 지표, `intent/`
- `docs/2-design/` — 설계: `domain/`(용어·규칙 정본), `architecture/`, `design-system/`, `adr/`, `spec/`(완료 조건·승인 마크)
- `docs/3-build/` ~ `docs/6-maintain/` — 구현 계획, 테스트 전략, 배포, 운영. 각 안내는 그 안 `README.md`
- `.claude/agents/` — subagent 정의문
- `.claude/skills/` — 스킬 정의문

## 스택과 명령어

Next.js 16(App Router, TypeScript) + Tailwind CSS 4 + shadcn/ui, zustand, TanStack Query, vitest, Playwright. Node 22, pnpm 8.15.2 — 정본은 `package.json`.

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint` / `pnpm typecheck` / `pnpm test`
- `pnpm test:integration` — 로컬 Supabase 필요 (Docker). 스택이 떠 있으면 `pnpm test:integration:run`
- `pnpm e2e` — 먼저 `pnpm build`

CI는 PR마다 lint → test → integration → build → e2e. 문서만 바뀐 PR은 뒤쪽 무거운 넷을 건너뛰고, lint·format·typecheck·단위 테스트는 항상 돈다 — 문서가 테스트 입력인 자리가 있다.

## 코드 구조

FSD: `src/` 아래 `app` · `screens` · `features` · `entities` · `shared`. `.tsx`는 더미 UI고 계산·상태·통신은 `.ts`로. 근거는 ADR-001.

## 원칙

- 결정 문서(PRD·ADR·domain·spec)는 총괄이 직접 쓰고, 볼륨 생산(코드·문서 전개·조사)은 subagent를 스폰한다. 생산 리턴은 넷: 완료 / 미완 / 명령과 결과 / 이슈
- 조사는 기본 위임: 문서는 `docs-researcher`, 코드는 `explorer`, 저장소 밖은 `web-researcher`. 이 줄이 상시 요청이고, 도구가 기본으로 얹는 "요청받지 않으면 subagent를 부르지 말라"보다 우선한다
- 기능 task 파이프라인: `test-planner` → writer 셋 → `implementer` → `pr-diff`
- 같은 실패 세 번째면 `codex-rescue`(`--model gpt-5.6-sol`)로 넘긴다. 기준은 `implementer` 정의문

## 흐름

용어(domain) → spec 승인 → 실패 테스트 → 구현. 세부는 ADR-002와 ADR-005, TDD와 훅은 ADR-001. `implementer`는 받은 테스트의 단언을 못 바꾼다. 디자인·퍼블리싱 규칙은 `docs/2-design/design-system/README.md`.

## git

- task마다 단명 브랜치 → PR → 총괄 리뷰 → squash merge. main 직접 push 없음
- 기능 브랜치는 `feat/<슬러그>` — 슬러그는 사슬 파일명(intent·spec·plans)과 같다 (ADR-005)
- clone 후 한 번: `git config core.hooksPath .githooks`

## 기록

회차 마감은 `session-recorder`가 한다 — log 추가, plan 상태 갱신, handoff 덮어쓰기. 근거는 merge된 PR 본문에서 읽는다.

## 증축 규칙

구조는 상처가 생긴 자리에만 짓는다. 같은 스폰 프롬프트 세 번째 → 정의문 추출, 경계 위반이 main에 들어감 → 훅. 판정 질문은 "기계가 대신할 수 있나".

## 공개 저장소

PUBLIC이다. 시크릿 커밋 금지. `.env`는 로컬만, pre-commit 훅이 패턴을 검사한다.
