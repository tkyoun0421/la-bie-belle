# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

`tokens.md` 8절이 안 덮던 자리 넷과 상태 토큰 문법에 이름만 있던 빈 값 넷이 다 채워졌다. `globals.css`에 `@custom-variant dark`가 붙어 `dark:` 유틸리티가 `[data-theme="dark"]`와 기기 다크 둘 다 따라가고 `[data-theme="light"]`는 기기가 다크여도 안 따라간다 — 덮기가 양방향으로 이긴다. `@layer base`에서 body가 배경색과 글자색을 역할 토큰으로 명시로 받는다. 역할 토큰 넷(`bg.neutral-disabled`·`bg.brand-weak-selected`·`fg.neutral-disabled`·`stroke.neutral-disabled`)이 2절 표와 8절 CSS 양쪽에 있고 `ROLE_TOKEN_COUNT`가 31이다.

서체는 Wanted Sans로 정해졌다. `--font-sans`가 그걸 가리키고 `layout.tsx`가 jsdelivr의 조각 나눔 스타일시트를 건다. Geist와 Geist Mono import는 빠졌고 저장소에 폰트 파일은 없다. 굵기가 넷으로 줄었다 — Wanted Sans의 가변 축이 400부터 시작해 `font-light`가 400과 같은 글자를 냈기 때문이다. 급여 금액은 `font-normal`을 쓴다. `card.tsx`의 `CardTitle`에서 `font-heading`이 빠졌다.

`components.md`의 destructive 규칙이 좁아졌다. 계정 탈퇴처럼 정말 되돌릴 수 없는 자리에만 빨강을 쓰고 근무표 삭제는 일반 버튼이다.

제품 코드는 여전히 integration 테스트 한 파일(`src/entities/profile/dals/__tests__/profile.integration.test.ts`)뿐이다. `dals` 실행 코드도 화면도 없다. `docs/domain/`의 여섯 파일은 이번 회차에서도 안 건드렸다.

## 다음 첫 수

디자인 시스템의 값 채우기가 끝났다. 다음은 기능 task로 넘어간다. 계정(가입과 승인)이 가장 밑바닥이라 다른 화면이 전부 그 위에 선다.

## 열린 결정

- `tokens.md` 7절의 기존 대비비 일곱 줄 중 다섯이 hex 재계산과 안 맞는다. `fg.neutral` 라이트가 표에는 15.84인데 재계산하면 17.40이 나오는 식이다. 라이트가 맞는 줄은 다크가 틀리고 다크가 맞는 줄은 라이트가 틀린다 — 표의 hex가 oklch를 반올림한 값이라 측정 기준이 갈렸을 가능성이 있다. 전부 4.5:1은 넘어서 판정은 안 뒤집힌다.
- `tests/lint/tsx-dumb-ui.test.ts`의 회귀 픽스처가 실제 소스를 베낀 인라인 사본을 들고 있는 문제가 다시 드러났다. 이번엔 `tsx-dumb-ui.test.ts:162`의 `layout.tsx` 픽스처가 아직 Geist를 부른다 — 소스는 Wanted Sans로 바뀌었는데 사본이 안 따라갔다. 규칙 검증에는 지장이 없지만, `page.tsx`·`providers.tsx`·`button.tsx`·`card.tsx`까지 포함해 다섯 다 같은 구조라 소스가 바뀔 때마다 반복해서 썩는다. `design-token-values.test.ts`처럼 `readFileSync`로 실제 파일을 읽는 방식으로 옮길지는 안 정해졌다.
- 테마를 고르는 UI와 그 선택을 어디 저장할지가 새 미정 항목으로 열렸다. 기기 설정을 따르되 앱에서 덮을 수 있게 하기로는 정했지만, 그 속성을 실제로 걸어줄 화면이 없다. 설정 화면 어디에 둘지, localStorage와 계정 중 어디에 저장할지, 첫 페인트 전에 어떻게 복원할지가 `tokens.md`의 「아직 안 정한 것」에 있다.
- `token-css-parity`가 `tests/lint/`로 옮겨가며 `tdd-guard-unit.py`의 사전 차단(`src/` 아래만 봄)에서 빠진 채다. CI의 `pnpm test`가 대신 잡지만, 편집 순간 손이 막히는 장치는 아직 없다.
- 도메인 규칙의 미정 항목은 `docs/domain/`의 각 파일 "아직 안 정한 것" 절이 정본이다. 디자인 값의 미정 항목은 `docs/design-system/tokens.md`의 같은 이름 절이 정본이다. 여기 옮겨 적지 않는다.
- 관리자 승인 경로가 없다. 컬럼 권한은 역할 단위라 `authenticated`에 `approved_at`을 열면 관리자든 아니든 다 열린다. `security definer` 함수로 가야 한다. 지금 스키마는 그 문을 안 열어뒀다.
- integration 테스트가 사용자를 안 치운다. `tests/integration/supabase.ts`가 사용자를 만들기만 하고 치우는 길을 안 준다. anon 키로는 `auth.users`를 못 지우고 프로필 행 삭제는 테스트가 지키는 바로 그 정책에 걸린다. 지우려면 service role이 필요한데 금지다. 한 번 돌 때 일곱이 로컬 DB에 쌓인다. 무작위 UUID라 지금은 무해하지만 "프로필 전체 목록" 같은 걸 검증하려 들면 걸린다.
- 로컬에서 연타하면 가입 rate limit에 걸린다. `supabase/config.toml`이 IP당 5분에 30번인데 한 번에 일곱을 쓴다. 5분 안에 네 번 넘게 돌리면 막힌다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- `authenticated`에 `profiles` 테이블 단위 insert와 delete 권한이 열려 있다. 정책이 없어 RLS가 전부 막는 구조다. 지금은 기본 거부라 안전하고 테스트가 delete 쪽을 지킨다.
- shadcn `accent` 매핑 — `bg.brand-weak`로 걸면 드롭다운 hover마다 브랜드 색이 깜빡여 절제 규칙과 부딪힌다. 실제 화면을 보고 `bg.neutral-weak`로 내릴지 판단이 필요하다.
- "8월 28일에 나옵니다" 예시 문장 — 어체가 합쇼체라 해요체 규칙과 어긋나고, `docs/domain/schedule.md`에 근무표 확정 마감일이 없어 앱이 날짜를 약속할 근거가 없다. `writing.md`에 확인 요청으로 달려 있다.
- 급여 확정 축하 모션 — 축하할 순간 후보로 지목됐는데 `payroll.md`가 급여를 확정하지 않는다고 못 박아 대상을 못 정했다.
- 되돌리기 어려운 동작에 별도 색을 줄지 — 출근 인증과 교대 수락 둘 다 되돌릴 길이 없는데 지금은 같은 `bg.brand-solid`라 한 화면에 브랜드 버튼이 둘 뜰 수 있다.
- `docs/design-system/tokens.md`의 "빈 상태 화면"과 "브랜드 색 출처" — 빈 상태 화면은 근무 없는 날·급여 0원·알림 0건을 이 팔레트로 아직 안 그려봤다. 브랜드 색 출처는 지금 brand 계열이 공식 브랜드 가이드가 아니라 홀 이미지와 웹사이트 내비게이션에서 뽑은 값이다.
- 세그먼트 목록 — 첫 기능 task에서 실제 파일을 보고 정한다.
- `playwright.config.ts`의 CI 리트라이 2 — 지금은 e2e가 셋뿐이라 티가 안 나지만, 리트라이는 불안정한 테스트를 가려준다. spec이 쌓이면 유지할지 정한다.
- CI가 1분대에서 4분대로 늘었던 것 중 analytics(logflare·vector) 몫은 껐다. 남은 시간이 여전히 아픈지는 몇 회차 더 겪고 정한다.

## 주의

- **`tests/lint/.tmp-format-check/`를 `.gitignore`에 넣지 않는다.** Prettier 3이 `.gitignore`를 기본 ignore 파일로 읽는다. 넣으면 `format-check.test.ts`가 만든 픽스처를 prettier가 건너뛰어 `--check`가 조용히 0으로 끝난다 — 테스트가 사실상 안 도는데 초록으로 보인다.
- **`pnpm typecheck`가 `@supabase/supabase-js`를 못 찾으며 깨지는 일이 반복된다.** `pnpm install --frozen-lockfile`로 복구한다.
- **`tests/lint/` 테스트가 worktree 여러 개를 동시에 돌리면 기본 5초 타임아웃에서 흔들린다.** `new ESLint()`가 next·typescript-eslint 설정을 통째로 로드하는 비용이 첫 테스트에 몰린다. `--testTimeout=60000`을 주면 안정적으로 통과한다.
- **`supabase/config.toml`의 analytics가 꺼져 있어 Studio에 Logs 탭이 없다.** 로그 자체는 그대로 남으니 `docker logs supabase_db_la-bie-belle`처럼 컨테이너에서 직접 읽는다. RLS가 막은 순간은 `db` 로그에 `permission denied for table ...`로 찍힌다. 화면이 붙고 API 트래픽을 화면에서 걸러 봐야 할 때가 오면 다시 켠다.
- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- 새 개념이 코드에 등장하면 먼저 `docs/domain/`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- task 완료 조건이 세 문장을 넘거나 예외 규칙이 둘 이상이면 `docs/spec/<task>.md`로 승격한다(ADR-002). 첫 기능 task부터 이 기준을 적용한다.
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
- type-aware lint(`no-floating-promises` 등)는 속도를 이유로 안 켜져 있다. await 빠진 Supabase 호출 같은 건 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다. 대조 테스트가 픽스처로 oklch 리터럴 문자열을 쥐고 있어서다.
- Wanted Sans는 CDN(jsdelivr) 의존이다. self-host가 아니라서 그 서비스가 죽으면 폰트가 시스템 폴백으로 떨어진다. `layout.tsx`의 `preconnect`는 지연만 줄일 뿐 가용성을 보장하지 않는다.
