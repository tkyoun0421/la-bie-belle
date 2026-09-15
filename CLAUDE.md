# la-bie-belle

## 문서 지도

무엇이 어디 있는지는 [`docs/README.md`](docs/README.md)가 정본이다. 세션은 [`docs/handoff.md`](docs/handoff.md)에서 시작하고, task 보드는 [`docs/backlog.md`](docs/backlog.md)다. PR 리뷰 정책은 [`REVIEW.md`](REVIEW.md), subagent 정의문은 [`.claude/agents/`](.claude/agents/), 스킬은 [`.claude/skills/`](.claude/skills/)다.

## 스택과 명령어

Next.js 16(App Router, TypeScript) + Tailwind CSS 4 + shadcn/ui, zustand, TanStack Query, vitest, Playwright. Node 22, pnpm 8.15.2 — 정본은 `package.json`.

- `pnpm dev` / `pnpm build` / `pnpm start` — `build`는 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`가 env에 있어야 한다(로컬은 `supabase status -o env`)
- `pnpm lint` / `pnpm typecheck` / `pnpm test`
- `pnpm test:integration` — 로컬 Supabase 필요 (Docker). 스택이 떠 있으면 `pnpm test:integration:run`
- `pnpm e2e` — 먼저 `pnpm build`

CI는 PR마다 lint → test → integration → build → e2e. 문서만 바뀐 PR은 뒤쪽 무거운 넷을 건너뛰고, lint·format·typecheck·단위 테스트는 항상 돈다 — 문서가 테스트 입력인 자리가 있다. PR마다 claude 자동 리뷰가 `REVIEW.md` 기준으로 코멘트를 달고, 매주 월요일 보안 스캔이 돌아 발견을 `security` 라벨 Issue로 남긴다.

## 코드 구조

FSD: `src/` 아래 `app` · `screens` · `features` · `entities` · `shared`. `.tsx`는 더미 UI고 계산·상태·통신은 `.ts`로. 근거는 ADR-001.

## 원칙

- 결정 문서(PRD·ADR·업무 규칙·spec)는 총괄이 직접 쓰고, 볼륨 생산(코드·문서 전개·조사)은 subagent를 스폰한다. 생산 리턴은 넷: 완료 / 미완 / 명령과 결과 / 이슈
- 조사는 기본 위임: 문서는 `docs-researcher`, 코드는 `explorer`, 저장소 밖은 `web-researcher`. 이 줄이 상시 요청이고, 도구가 기본으로 얹는 "요청받지 않으면 subagent를 부르지 말라"보다 우선한다
- 기능 task 파이프라인: `test-planner` → writer 셋 → `implementer` → `pr-diff`
- 화면 디자인 파이프라인: 페이지 문서 → `sian-writer` → `sian-auditor`. 문서를 고쳤으면 시안도 따라가야 하고, 따라갔는지는 감사자가 본다
- 구조 설계 파이프라인: 인터뷰(`grill-me`, 한 라운드 한 질문) → 초안 → `architecture-advisor` 검토 → 총괄이 `system/`과 `modules/<영역>/design.md`에 씀. 조언자는 문서 하나씩 보고 결정하지 않는다
- 같은 실패 세 번째면 `codex-rescue`(`--model gpt-5.6-sol`)로 넘긴다. 기준은 `implementer` 정의문
- 대화에서 하는 설명은 `.claude/skills/explain-simply`의 원칙 넷을 항상 적용한다. 트리거를 기다리지 않는다 — 어렵다는 말이 나온 뒤엔 이미 한 번 어렵게 읽은 뒤다. 화면 문안은 여기가 아니라 `writing.md`가 정본이다

## 흐름

용어(modules) → spec 승인 → 실패 테스트 → 구현. 세부는 ADR-002와 ADR-005, TDD와 훅은 ADR-001. `implementer`는 받은 테스트의 단언을 못 바꾼다. 디자인·퍼블리싱 규칙은 `docs/2-design/design-system/README.md`.

## git

- task마다 단명 브랜치 → PR → 총괄 리뷰 → squash merge. main 직접 push 없음
- 기능 브랜치는 `feat/<슬러그>` — 슬러그는 사슬 파일명(intent·spec·plans)과 같다 (ADR-005)
- clone 후 한 번: `git config core.hooksPath .githooks`

## 기록

회차 마감은 `session-recorder`가 한다 — log 추가, backlog 상태 갱신, handoff 덮어쓰기, CHANGELOG 행 추가, 관찰 집계·이동. 근거는 merge된 PR 본문에서 읽는다.

## 증축 규칙

구조는 상처가 생긴 자리에만 짓는다. 같은 스폰 프롬프트 세 번째 → 정의문 추출, 경계 위반이 main에 들어감 → 훅. 판정 질문은 "기계가 대신할 수 있나". 판정의 카운터는 `docs/observations/` — 마찰은 본 그 턴에 기록한다.

## 공개 저장소

PUBLIC이다. 시크릿 커밋 금지. `.env`는 로컬만, pre-commit 훅이 패턴을 검사한다. 문서·시안·테스트 픽스처의 사람 이름·전화번호·좌표·QR 값은 전부 가짜다 — 전화번호는 `010-0000-000x` 꼴, 실제 값은 DB에만 산다.
