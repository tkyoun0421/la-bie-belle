# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

`eslint-rules/class-strings.mjs`를 거치는 하우스 lint 규칙 셋(`no-arbitrary-class-values`·`no-color-literals`·`no-default-palette-class`)이 이전엔 놓치던 우회로 다섯을 막는다. 깊이 카운터가 `bracketDepth`와 `parenDepth`로 갈라져 대괄호 안 짝 없는 소괄호를 더는 안 헷갈린다. 임의 값 검사가 마지막 세그먼트만이 아니라 변형 접두사 세그먼트 전부와, 유틸리티 하나에 대괄호 그룹이 둘 이상이어도 전부를 돈다. `var(...)`가 한 번이라도 나오면 값 전체를 사면하던 방식을 버리고, 커스텀 프로퍼티 식별자만 걷어낸 뒤 남는 문자열에서 리터럴을 찾는다(`calc(var(--gap)+13px)`의 `13px`을 잡는다). 정규식 경계 셋 — `SIZE_LITERAL`의 선행 배제 문자군에서 `-`를 뺀 것, hex 리터럴의 끝을 `\b` 대신 `(?![0-9a-f])`로 잡은 것, 팔레트 규칙이 대괄호 투명도(`bg-red-500/[0.5]`)도 매칭하게 한 것 — 도 조여졌다. 파서가 내보내는 이름이 바뀌었다. `eslint-rules/class-strings.mjs`는 이제 `classStringVisitor`·`segmentsOf`·`utilityOf`·`arbitraryValuesOf`(복수) 넷을 내보내고, 첫 대괄호 그룹만 돌려주던 `arbitraryValueOf`(단수)는 사라졌다.

`src/shared/ui/button.tsx`의 라운딩이 `docs/design-system/components.md`와 맞춰졌다. base가 `rounded-full`로 올라가 크기 여덟(`default`·`xs`·`sm`·`lg`·`icon`·`icon-xs`·`icon-sm`·`icon-lg`)이 전부 그것만 물려받고, 없는 ButtonGroup 컴포넌트를 겨냥하던 `in-data-[slot=button-group]:rounded-lg` 네 곳이 지워졌다. 새 `src/shared/ui/__tests__/button.test.ts`가 이 계약을 크기별로 직접 검사한다.

`tests/lint/rule-catalogue.test.ts`에 카탈로그와 config를 preset baseline으로 맞대는 검사가 붙었다. `eslint-config-next/core-web-vitals`와 `.../typescript`가 내보내는 rules 키 집합을 baseline으로 두고, 그 밖에서 error로 켜진 규칙이 카탈로그의 ruleId 집합과 정확히 일치하는지 본다(둘 다 11개). `eslint-config-next`가 올라가도 baseline이 같이 움직여 노후화가 안 생긴다. `tests/lint/relative-import.test.ts`엔 `tests/` 경로 fixture 검사가, `tests/lint/tailwind-default-palette.test.ts`엔 대괄호 투명도 케이스 다섯이 늘었다. `pnpm test`는 205개(18개 파일) 전부 초록이다.

제품 코드는 여전히 integration 테스트 한 파일(`src/entities/profile/dals/__tests__/profile.integration.test.ts`)뿐이다. `dals` 실행 코드도 화면도 없다. `docs/domain/`의 여섯 파일은 이번 회차에서도 안 건드렸다.

## 다음 첫 수

지난 회차의 다음 첫 수가 그대로 남아 있다. 이번 회차(#206)는 그 사이 드러난 lint 우회로를 먼저 막은 곁가지였다.

`tokens.md` 8절이 덮지 않는 자리 넷을 메운다. `globals.css`를 8절 전문으로 교체하며 드러났다. 넷 중 진짜 버그는 `@custom-variant dark`가 없어 `dark:` 유틸리티가 `[data-theme="dark"]`를 안 따라가는 것이다 — `button.tsx`가 `dark:` 클래스를 여럿 쓴다. 나머지 셋은 `@layer base` 없이 body 색이 `color-scheme`에만 기대는 것, `card.tsx`가 쓰는 `--font-heading`이 사라진 것, `--font-sans`가 가리키는 Pretendard 파일이 없어 `-apple-system` 폴백으로 떨어지는 것이다. 완료 조건은 `docs/plan.md` 「다음」에 그대로 있다.

이게 끝나면 기능 task로 넘어간다. 계정(가입과 승인)이 가장 밑바닥이라 다른 화면이 전부 그 위에 선다.

## 열린 결정

- `tests/lint/tsx-dumb-ui.test.ts`의 회귀 테스트 다섯(`page.tsx`·`layout.tsx`·`providers.tsx`·`button.tsx`·`card.tsx`)이 전부 실제 소스를 베낀 인라인 사본을 픽스처로 들고 있다. 소스가 바뀌면 사본이 같이 썩는다 — 이번에 `button.tsx`를 고치며 실제로 하나가 썩었고, 단언은 그대로 둔 채 입력 문자열만 동기화해 넘겼다. `tests/lint/design-token-values.test.ts`의 회귀 테스트는 이번에 `readFileSync`로 실제 파일을 읽는 방식으로 바뀌어 이 썩음이 없다. 다섯을 그 방식으로 옮길지는 안 정해졌다.
- `token-css-parity`가 `tests/lint/`로 옮겨가며 `tdd-guard-unit.py`의 사전 차단(`src/` 아래만 봄)에서 빠졌다. CI의 `pnpm test`가 대신 잡지만, 편집 순간 손이 막히는 장치는 잃었다. 훅이 `tests/` 아래 `.test.ts`가 아닌 `.ts`까지 보게 넓힐지는 판단이 남아 있다.
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
- **`tests/lint/` 테스트가 worktree 여러 개를 동시에 돌리면 기본 5초 타임아웃에서 흔들린다.** `new ESLint()`가 next·typescript-eslint 설정을 통째로 로드하는 비용이 첫 테스트에 몰린다. `--testTimeout=60000`을 주면 안정적으로 통과한다. `rule-check.ts`와 `rules.ts`는 이 비용을 모듈 스코프/`beforeAll`로 한 번만 치르게 옮겨뒀지만, 옛 방식이 남은 파일이 있으면 여전히 흔들릴 수 있다.
- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- 새 개념이 코드에 등장하면 먼저 `docs/domain/`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- task 완료 조건이 세 문장을 넘거나 예외 규칙이 둘 이상이면 `docs/spec/<task>.md`로 승격한다(ADR-002). 첫 기능 task부터 이 기준을 적용한다.
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
- type-aware lint(`no-floating-promises` 등)는 속도를 이유로 안 켜져 있다. await 빠진 Supabase 호출 같은 건 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다. 대조 테스트가 픽스처로 oklch 리터럴 문자열을 쥐고 있어서다.
