# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

`docs/design-system/`이 섰다. `tokens.md`(팔레트 6계열 × 11단계, 역할 토큰 매핑, 타이포·스페이싱·라운딩·그림자·모션, Tailwind 4 `@theme` 전문)를 정본으로 두고, `foundation/`의 색·타이포·스페이싱과 형태·모션 넷과 `writing.md`·`components.md`·`README.md`가 그 정본을 이름으로만 부른다. 브랜드 색은 절제 규칙(버튼 한 자리) 아래 있고, warning은 brand와 밝기가 거의 같아 글자색으로는 안 쓴다. 라이트·다크 두 모드는 의미 매핑 표 하나로 같이 덮인다.

규칙 열넷이 `eslint.config.mjs`와 Prettier로 CI에서 돈다. 경계(상대 경로·역방향 레이어·같은 층 다른 슬라이스 import), 디자인 값(하드코딩 색·크기, Tailwind 기본 팔레트), `.tsx` 더미 UI 강제, 테스트 `.only` 금지, import·Tailwind 클래스 순서, `console` 제한, 미사용 import 정리가 전부 잡힌다. `src/app/globals.css`는 `tokens.md` 8절 전문으로 교체됐고 대조 로직이 `tests/lint/token-css-parity.ts`에 있다. `@tests/*` alias가 생겨 `tests/`를 가리키는 상대 경로가 없어졌다. CI는 `lint → format:check → test → integration → build → e2e` 여섯 단계다.

생산 스폰이 같은 실패를 세 번째 만나면 손을 떼고 총괄이 `codex-rescue`(`--model gpt-5.6-sol`)로 넘기는 3회 규칙이 `CLAUDE.md`와 `.claude/agents/implementer.md`에 얹혔다. 셈은 구현자가 하고 넘기는 판정은 총괄이 한다.

제품 코드는 여전히 integration 테스트 한 파일(`src/entities/profile/dals/__tests__/profile.integration.test.ts`)뿐이다. `dals` 실행 코드도 화면도 없다. `docs/domain/`의 여섯 파일은 지난 회차에 전부 첫 인터뷰를 돌았고 이번 회차에서는 안 건드렸다.

## 다음 첫 수

`tokens.md` 8절이 덮지 않는 자리 넷을 메운다. `globals.css`를 8절 전문으로 교체하며 드러났다. 넷 중 진짜 버그는 `@custom-variant dark`가 없어 `dark:` 유틸리티가 `[data-theme="dark"]`를 안 따라가는 것이다 — `button.tsx`가 `dark:` 클래스를 여럿 쓴다. 나머지 셋은 `@layer base` 없이 body 색이 `color-scheme`에만 기대는 것, `card.tsx`가 쓰는 `--font-heading`이 사라진 것, `--font-sans`가 가리키는 Pretendard 파일이 없어 `-apple-system` 폴백으로 떨어지는 것이다. 완료 조건은 `docs/plan.md` 「다음」에 그대로 있다.

이게 끝나면 기능 task로 넘어간다. 계정(가입과 승인)이 가장 밑바닥이라 다른 화면이 전부 그 위에 선다.

## 열린 결정

- 도메인 규칙의 미정 항목은 `docs/domain/`의 각 파일 "아직 안 정한 것" 절이 정본이다. 여기 옮겨 적지 않는다.
- 관리자 승인 경로가 없다. 컬럼 권한은 역할 단위라 `authenticated`에 `approved_at`을 열면 관리자든 아니든 다 열린다. `security definer` 함수로 가야 한다. 지금 스키마는 그 문을 안 열어뒀다.
- integration 테스트가 사용자를 안 치운다. `tests/integration/supabase.ts`가 사용자를 만들기만 하고 치우는 길을 안 준다. anon 키로는 `auth.users`를 못 지우고 프로필 행 삭제는 테스트가 지키는 바로 그 정책에 걸린다. 지우려면 service role이 필요한데 금지다. 한 번 돌 때 일곱이 로컬 DB에 쌓인다. 무작위 UUID라 지금은 무해하지만 "프로필 전체 목록" 같은 걸 검증하려 들면 걸린다.
- 로컬에서 연타하면 가입 rate limit에 걸린다. `supabase/config.toml`이 IP당 5분에 30번인데 한 번에 일곱을 쓴다. 5분 안에 네 번 넘게 돌리면 막힌다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- CI가 1분대에서 4분대로 늘었다. Supabase 이미지 pull이 대부분이다. `config.toml`의 analytics를 끄면 logflare와 vector가 빠져 줄지만, 실제로 아픈지 몇 회차 겪고 정하는 편이 낫다.
- `authenticated`에 `profiles` 테이블 단위 insert와 delete 권한이 열려 있다. 정책이 없어 RLS가 전부 막는 구조다. 지금은 기본 거부라 안전하고 테스트가 delete 쪽을 지킨다.
- shadcn `accent` 매핑 — `bg.brand-weak`로 걸면 드롭다운 hover마다 브랜드 색이 깜빡여 절제 규칙과 부딪힌다. 실제 화면을 보고 `bg.neutral-weak`로 내릴지 판단이 필요하다.
- "8월 28일에 나옵니다" 예시 문장 — 어체가 합쇼체라 해요체 규칙과 어긋나고, `docs/domain/schedule.md`에 근무표 확정 마감일이 없어 앱이 날짜를 약속할 근거가 없다. `writing.md`에 확인 요청으로 달려 있다.
- 급여 확정 축하 모션 — 축하할 순간 후보로 지목됐는데 `payroll.md`가 급여를 확정하지 않는다고 못 박아 대상을 못 정했다.
- `disabled`·`selected` 상태값 — 역할 토큰 문법에 이름은 있는데 값이 없다. 출근 인증 버튼이 근무 시작 1시간 전까지 비활성이라 첫 화면부터 필요하다.
- 세그먼트 목록 — 첫 기능 task에서 실제 파일을 보고 정한다.
- `~/orca/workspaces/la-bie-belle/ladyfish` worktree — 61d7703에 멈춰 있다. 살릴 작업이 있는지 사람이 판단할 몫이다.
- `playwright.config.ts`의 CI 리트라이 2 — 지금은 e2e가 하나뿐이라 티가 안 나지만, 리트라이는 불안정한 테스트를 가려준다. spec이 쌓이면 유지할지 정한다.

## 주의

- **`tests/lint/.tmp-format-check/`를 `.gitignore`에 넣지 않는다.** Prettier 3이 `.gitignore`를 기본 ignore 파일로 읽는다. 넣으면 `format-check.test.ts`가 만든 픽스처를 prettier가 건너뛰어 `--check`가 조용히 0으로 끝난다 — 테스트가 사실상 안 도는데 초록으로 보인다.
- **`pnpm typecheck`가 `@supabase/supabase-js`를 못 찾으며 깨지는 일이 반복된다.** `pnpm install --frozen-lockfile`로 복구한다.
- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- 새 개념이 코드에 등장하면 먼저 `docs/domain/`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- task 완료 조건이 세 문장을 넘거나 예외 규칙이 둘 이상이면 `docs/spec/<task>.md`로 승격한다(ADR-002). 첫 기능 task부터 이 기준을 적용한다.
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
- type-aware lint(`no-floating-promises` 등)는 속도를 이유로 안 켜져 있다. await 빠진 Supabase 호출 같은 건 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다. 대조 테스트가 픽스처로 oklch 리터럴 문자열을 쥐고 있어서다.
