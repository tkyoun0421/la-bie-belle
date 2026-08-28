# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

세션 기반이 깔렸다. `docs/spec/session-foundation.md`의 완료 조건 여섯 중 다섯 반이 채워졌다. `src/middleware.ts`가 요청마다 토큰을 갱신해 요청 쿠키와 응답 쿠키 양쪽에 심고, 정적 자원 경로(`_next/static`, `_next/image`, 파비콘, 이미지 확장자)는 건너뛴다. `src/shared/lib/create-supabase-server-client.ts`가 Next의 쿠키 저장소를 `@supabase/ssr`의 `getAll`·`setAll` 모양으로 잇고, `get-current-user.ts`가 `getUser()`로만 지금 로그인한 사람을 읽는다. `getSession()` 금지는 `tests/lint/no-get-session.test.ts`가 `src/` 아래를 소스 스캔으로 지킨다. `POST /auth/logout`이 쿠키를 지우고, `/`가 로그인한 사람의 이메일 주소를 그대로 그려 세션이 서버까지 닿았음을 증명하는 발판 역할을 한다.

브라우저용 Supabase 클라이언트는 아직 없다. 빌드는 `tsconfig.build.json`으로 앱 코드만 타입 검사하고, 테스트까지 보는 검사는 `pnpm typecheck`가 맡아 CI에 새로 들어갔다. e2e는 `playwright.config.ts`의 `workers: 1`로 직렬로 돈다.

`docs/domain/`의 여섯 파일은 이번에도 안 건드렸다. 승인·역할·차단·퇴사는 이 task가 안 다뤘다.

## 다음 첫 수

로그인 화면과 구글 버튼. 세션 기반이 깔렸으니 그 위에 선다. 구글 OAuth 콜백 처리도 여기 붙는다 — 버튼이 있어야 검증되기 때문이다. 로컬 Supabase에는 `[auth.external.google]` 설정이 아직 없다.

## 열린 결정

- 브라우저용 Supabase 클라이언트 팩토리가 없다. 완료 조건 1의 절반이다. 구글 버튼이 생기는 로그인 화면 task로 미뤘고, `src/shared/lib/__tests__/create-supabase-browser-client.test.ts`를 작성자에게 배정해야 한다.
- `src/app/page.tsx`가 통신을 한다 — `.tsx`는 더미 UI라는 ADR-001 규칙과 어긋난다. 명세가 발판이라 밝혔고 로그인 화면 task에서 걷어낸다. 살아남으면 `.ts`로 빼야 한다.
- `playwright.config.ts`에 `workers: 1`과 `fullyParallel: true`가 같이 있다 — 앞이 뒤를 무의미하게 만든다. e2e가 늘면 아플 자리다.
- Next 16이 `middleware.ts`를 deprecate하고 `proxy`로 밀고 있다 — 테스트가 파일명을 못박아둬서 옮길 때 같이 고쳐야 한다.
- CI가 `pnpm format:check`에서 죽는 일이 두 번째다. 방금 더한 테스트 파일에 포매터를 안 돌려서다. 증축 규칙상 세 번째면 작성자 정의문에 `pnpm format:check`를 넣는다.
- PR #197의 lint 규칙 표가 저장소 안에 없고 PR 본문에만 있다 — 규칙 번호 불변식(`DOCUMENTED_LINT_RULE_COUNT`)이 그 표에 기대는데 정본이 저장소 밖에 있다.
- `tokens.md` 7절 대비 값 일곱 줄 중 다섯이 hex 재계산과 어긋난다. 전부 4.5:1은 넘겨서 급하지 않다.
- `tests/lint/tsx-dumb-ui.test.ts:162`의 인라인 `layout.tsx` 픽스처가 아직 Geist를 가리킨다.
- 관리자 승인 RLS가 `security definer`를 필요로 한다.
- integration 테스트가 만든 사용자를 치우지 않는다 — `supabase/config.toml`이 IP당 5분에 서른 번으로 가입을 막는데, e2e도 이제 사용자를 만든다. 계정 task를 여러 회차 돌리면 닿는다.
- 테마를 고르는 UI와 그 선택을 어디 저장할지가 미정이다. 기기 설정을 따르되 앱에서 덮을 수 있게 하기로는 정했지만, 그 속성을 실제로 걸어줄 화면이 없다. `tokens.md`의 「아직 안 정한 것」에 있다.
- `token-css-parity`가 `tests/lint/`로 옮겨가며 `tdd-guard-unit.py`의 사전 차단(`src/` 아래만 봄)에서 빠진 채다. CI의 `pnpm test`가 대신 잡지만, 편집 순간 손이 막히는 장치는 아직 없다.
- 도메인 규칙의 미정 항목은 `docs/domain/`의 각 파일 "아직 안 정한 것" 절이 정본이다. 디자인 값의 미정 항목은 `docs/design-system/tokens.md`의 같은 이름 절이 정본이다. 여기 옮겨 적지 않는다.
- 로컬에서 연타하면 가입 rate limit에 걸린다. `supabase/config.toml`이 IP당 5분에 30번이다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- `authenticated`에 `profiles` 테이블 단위 insert와 delete 권한이 열려 있다. 정책이 없어 RLS가 전부 막는 구조다. 지금은 기본 거부라 안전하고 테스트가 delete 쪽을 지킨다.
- shadcn `accent` 매핑 — `bg.brand-weak`로 걸면 드롭다운 hover마다 브랜드 색이 깜빡여 절제 규칙과 부딪힌다. 실제 화면을 보고 `bg.neutral-weak`로 내릴지 판단이 필요하다.
- "8월 28일에 나옵니다" 예시 문장 — 어체가 합쇼체라 해요체 규칙과 어긋나고, `docs/domain/schedule.md`에 근무표 확정 마감일이 없어 앱이 날짜를 약속할 근거가 없다. `writing.md`에 확인 요청으로 달려 있다.
- 급여 확정 축하 모션 — 축하할 순간 후보로 지목됐는데 `payroll.md`가 급여를 확정하지 않는다고 못 박아 대상을 못 정했다.
- 되돌리기 어려운 동작에 별도 색을 줄지 — 출근 인증과 교대 수락 둘 다 되돌릴 길이 없는데 지금은 같은 `bg.brand-solid`라 한 화면에 브랜드 버튼이 둘 뜰 수 있다.
- `docs/design-system/tokens.md`의 "빈 상태 화면"과 "브랜드 색 출처" — 빈 상태 화면은 근무 없는 날·급여 0원·알림 0건을 이 팔레트로 아직 안 그려봤다. 브랜드 색 출처는 지금 brand 계열이 공식 브랜드 가이드가 아니라 홀 이미지와 웹사이트 내비게이션에서 뽑은 값이다.
- 세그먼트 목록 — 첫 기능 task에서 실제 파일을 보고 정한다.
- `playwright.config.ts`의 CI 리트라이 2 — e2e가 늘고 `workers: 1`까지 겹쳐 전체 실행 시간이 무거워지고 있다. 유지할지 정한다.
- CI가 1분대에서 4분대로 늘었던 것 중 analytics(logflare·vector) 몫은 껐다. 남은 시간이 여전히 아픈지는 몇 회차 더 겪고 정한다.

## 주의

- **`tests/lint/.tmp-format-check/`를 `.gitignore`에 넣지 않는다.** Prettier 3이 `.gitignore`를 기본 ignore 파일로 읽는다. 넣으면 `format-check.test.ts`가 만든 픽스처를 prettier가 건너뛰어 `--check`가 조용히 0으로 끝난다 — 테스트가 사실상 안 도는데 초록으로 보인다.
- **`pnpm typecheck`가 `@supabase/supabase-js`를 못 찾으며 깨지는 일이 반복된다.** `pnpm install --frozen-lockfile`로 복구한다.
- **`pnpm typecheck`와 `pnpm build`가 보는 범위가 다르다.** 빌드는 `tsconfig.build.json`으로 테스트를 뺀 앱 코드만 본다. 테스트 파일의 타입 오류는 `pnpm typecheck`(CI에 새로 들어감)나 `pnpm test`에서만 드러난다.
- **`tests/lint/` 테스트가 worktree 여러 개를 동시에 돌리면 기본 5초 타임아웃에서 흔들린다.** `new ESLint()`가 next·typescript-eslint 설정을 통째로 로드하는 비용이 첫 테스트에 몰린다. `--testTimeout=60000`을 주면 안정적으로 통과한다.
- **`supabase/config.toml`의 analytics가 꺼져 있어 Studio에 Logs 탭이 없다.** 로그 자체는 그대로 남으니 `docker logs supabase_db_la-bie-belle`처럼 컨테이너에서 직접 읽는다. RLS가 막은 순간은 `db` 로그에 `permission denied for table ...`로 찍힌다. 화면이 붙고 API 트래픽을 화면에서 걸러 봐야 할 때가 오면 다시 켠다.
- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- 새 개념이 코드에 등장하면 먼저 `docs/domain/`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- task 완료 조건이 세 문장을 넘거나 예외 규칙이 둘 이상이면 `docs/spec/<task>.md`로 승격한다(ADR-002).
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
- type-aware lint(`no-floating-promises` 등)는 속도를 이유로 안 켜져 있다. await 빠진 Supabase 호출 같은 건 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다. 대조 테스트가 픽스처로 oklch 리터럴 문자열을 쥐고 있어서다.
- Wanted Sans는 CDN(jsdelivr) 의존이다. self-host가 아니라서 그 서비스가 죽으면 폰트가 시스템 폴백으로 떨어진다. `layout.tsx`의 `preconnect`는 지연만 줄일 뿐 가용성을 보장하지 않는다.
- CI는 `pnpm build` 앞에서 `supabase status`의 값을 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 넘긴다. `NEXT_PUBLIC_*`은 빌드 시점에 번들에 박히므로 이 순서가 바뀌면 e2e가 빈 URL을 든 앱을 상대하게 된다.
