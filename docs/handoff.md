# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

**작업 트리가 둘 서 있다.** `~/orca/workspaces/la-bie-belle/` 아래 `design`과 `dev`고, 둘 다 detached로 최신 main에 서 있다. 훅 경로와 env와 의존성까지 준비돼 있다. 무엇을 어디서 하는지는 그때 사람이 정하고 문서에 못 박지 않았다. 트리를 열고 닫는 절차는 `.claude/skills/worktree/`에 있다.

**`globals.css`가 이제 `tokens.md`에서 생성된다.** `pnpm tokens:css`가 표를 읽어 `src/app/globals.css`를 통째로 쓴다. 8절 「CSS 전문」은 표로 담을 칸이 없는 넷(뼈대, Tailwind 기본값 초기화와 서체, shadcn 다리, `@layer base`의 body)만 남았고 나머지는 표에서 생성된다. 첫 실행이 바꾼 건 순서 셋뿐이었다 — `@custom-variant dark` 위치, `--text-*` 순서, `--radius-*` 위치. 값은 한 자도 안 바뀌었다. 옛 파리티 검사(`tests/lint/token-css-parity.ts`와 그 test)는 지워졌고, `tests/lint/generate-globals-css.test.ts`가 생성 결과와 저장된 파일을 통째로 대조한다.

**7절 대비값도 이제 기계가 잰다.** `tests/lint/contrast-check.ts`가 1절 팔레트 hex에서 WCAG 공식으로 다시 계산해 「측정한 조합」 16행(라이트·다크)과 「떨어진 조합」 4행을 대조하고, 측정한 조합은 4.5:1 이상인지도 본다. 표 값은 재계산해도 전부 맞았다 — 검사를 세운 건 붉은불을 켜기 위해서가 아니라 초록불이 증거가 되게 하기 위해서였고, 변이 다섯(값 어긋남 둘, 행 삭제, 헤더 파손, 반올림 삽입)으로 실제로 무는 걸 확인했다. 표 파서(`Row` 타입·`readRows`·`requireRows`·`bySection`·헤더 상수)는 `scripts/tokens-md.mts`로 빠져 생성기와 검사가 같이 쓴다.

생성기와 검사 스크립트는 `.mts` 확장자로 `node --experimental-strip-types`로 돈다. `eslint.config.mjs`의 files 글롭에 `mts`를 더했다.

`plan.md`의 「다음」이 디자인 task 하나로 줄었다. 코드 쪽 task는 지금 없다.

페이지별 디자인 문서는 여전히 `docs/2-design/design-system/pages/login.md` 하나뿐이다. 로그인 화면과 승인 대기 화면의 짜임, 역할 토큰, 화면 문안, 모션이 들어 있고 그 틀(화면 절 넷 + 안 담은 것 + 규칙과 부딪힌 자리 + 아직 안 정한 것)이 `README.md`에 박혔다. 뒤따르는 화면은 이 틀을 따른다.

코드는 세션 기반이 서 있고 화면은 아직 없다. 브라우저용 Supabase 클라이언트도 아직 없다.

## 다음 첫 수

`plan.md`의 「다음」에 「근무자 대시보드 디자인을 정한다」 하나만 남았다. 시안을 사람이 보고 고르는 디자인 task다. 코드 쪽 task는 지금 비어 있다.

## 다음에 그릴 화면

`pages/`에는 로그인 하나뿐이다. 나머지는 근거가 될 도메인 문서의 「아직 안 정한 것」이 비었는지로 갈린다.

**지금 그릴 수 있다.** 근무자 쪽은 대시보드·근무표 조회·출근 인증·교대 요청·휴무 희망 신청·프로필·스플래시고, 관리자 쪽은 대시보드·근무표 편집·교대 승인·출근 기록 조회·계정 승인·휴무 희망 조회다.

**급여도 막혀 있지 않다.** 조사가 `prd.md`의 "급여 쪽이 가장 크고 가장 급하다"를 미완성 표시로 읽었는데, `payroll.md`가 「아직 안 정한 것」 첫 줄에 "계산 규칙 자체는 다 정해졌다"고 적어뒀다. 남은 둘은 공휴일 데이터를 받아오는 쪽이라 계산을 막지 않는다. 급여 상세와 관리자 통계도 지금 그릴 수 있다.

승인 대기 화면의 알림 영역은 `pages/login.md`에 이미 들어 있다. 따로 그릴 화면이 아니다.

## 열린 결정

- **2절 표에 「참조」 열을 열지.** `scripts/generate-globals-css.mts`의 `SURFACE_STROKE_IN_DARK = "var(--palette-neutral-200)"`가 값이 문서 밖에 사는 유일한 자리다. 2절 `stroke.surface` 행의 다크 칸이 hex(`#272523`)라 팔레트 참조로 되돌릴 수 없고 표에 그 참조를 담을 칸도 없어서, 지금은 8절 산문에 그 사실만 적어뒀다. 2절 표에 칸을 열어 끌어올릴지는 안 정했다.
- **`src/` 처분.** "따로 건질 건 없을 것 같다"고 했지만 총괄이 삭제 지시로 읽지 않고 그대로 뒀다 — 되돌리기 어려운 쪽을 기본값으로 삼지 않았다. 실제로 지우려면 말해줘야 한다.
- **권한을 거부한 뒤의 알림 영역 모습.** 브라우저는 한 번 거부하면 다시 묻지 않는다. 첫째 모습(아직 안 켬)을 그대로 두면 눌러도 아무 일이 없는 버튼이 남고, 아이폰 안내를 띄우면 물을 길이 없는 경우와 물었다 거부당한 경우를 뒤섞는다. `pages/login.md`의 「아직 안 정한 것」에 있다.
- **거절됐을 때 알림을 보낼지.** 승인이 알림으로 나가니 거절도 대칭으로 나갈 법한데, 거절은 이번만이고 같은 사람이 다시 가입할 수 있다. 통보가 최종 판정처럼 읽히면 다시 올 사람을 돌려세운다. 안 보내면 승인 대기 화면에 계속 남는다. `domain/notification.md`에 있다.
- **구글 버튼의 Google Sans Medium.** 구글 문서가 그 서체를 적었는데 서드파티 웹에 배포되지 않아 우리 서체로 그려야 한다. 그 어긋남을 OAuth 심사가 어떻게 보는지 모른다. 버튼 이미지를 통째로 쓰면 규정에 맞지만 문구를 우리말로 못 쓴다.
- **라이트와 다크에서 구글 버튼 테마를 나눌지.** 지금은 양쪽 다 어두운 배경 하나고, 라이트와 중립 테마의 값은 `tokens.md`에 안 옮겼다. 구글이 테마별로 다른 버튼을 쓰는 것을 막지 않는다. 실제 화면을 보고 정한다.
- **알림 블록의 중립 종류를 `components.md`에 올릴지.** 「아직 안 켬」이 안내·성공·경고·오류 넷 중 어디도 아니라 `bg.neutral-weak`로 깔았다. 화면 하나를 근거로 공용 컴포넌트를 늘리기에는 일러서 미뤘다. 다른 화면에서 같은 모양이 한 번 더 나오면 그때 올린다.
- **브랜드 색이 한 화면에 둘인 자리.** 승인 대기 화면에 알약(`bg.brand-weak`)과 「알림 켜기」(`bg.brand-solid`)가 같이 선다. 무게가 갈려 지금은 지나갔지만 실제 화면에서 다시 본다. 헤더에 로고를 두는 화면이 생기면 같은 판단이 한 번 더 필요하다 — `color.md`가 그 조건을 적어뒀다.
- env가 없으면 미들웨어가 모든 요청에서 던져 앱 전체가 500이 된다. 조용한 로그아웃보다 낫다고 판단해 그렇게 갔지만, 사용자에게는 Next 기본 에러 화면이 뜬다. `error.tsx`를 다룰 때 같이 본다.
- 미들웨어에 `matcher`가 없다. 함수 안에서 정적 자원을 걸러내는데 `export const config = { matcher }`를 쓰면 실행 자체를 안 한다. 동작은 맞고 명세도 지켰으니 성능 판단으로 남겨뒀다.
- 브라우저용 Supabase 클라이언트 팩토리가 없다. 세션 기반 task 완료 조건 1의 절반이다. 구글 버튼이 생기는 로그인 화면 구현 task로 미뤘고, `src/shared/lib/__tests__/create-supabase-browser-client.test.ts`를 작성자에게 배정해야 한다.
- `src/app/page.tsx`가 통신을 한다 — `.tsx`는 더미 UI라는 ADR-001 규칙과 어긋난다. 명세가 발판이라 밝혔고 로그인 화면 구현 task에서 걷어낸다. 살아남으면 `.ts`로 빼야 한다.
- `playwright.config.ts`에 `workers: 1`과 `fullyParallel: true`가 같이 있다 — 앞이 뒤를 무의미하게 만든다. e2e가 늘면 아플 자리다.
- Next 16이 `middleware.ts`를 deprecate하고 `proxy`로 밀고 있다 — 테스트가 파일명을 못박아둬서 옮길 때 같이 고쳐야 한다.
- PR #197의 lint 규칙 표가 저장소 안에 없고 PR 본문에만 있다 — 규칙 번호 불변식(`DOCUMENTED_LINT_RULE_COUNT`)이 그 표에 기대는데 정본이 저장소 밖에 있다.
- `tests/lint/tsx-dumb-ui.test.ts:162`의 인라인 `layout.tsx` 픽스처가 아직 Geist를 가리킨다. 이 파일의 픽스처 다섯(`layout`·`page`·`providers`·`button`·`card`)이 전부 실제 소스를 베낀 인라인 사본이라, 소스가 바뀔 때마다 같은 방식으로 썩는다. `design-token-values.test.ts`처럼 `readFileSync`로 실제 파일을 읽게 옮길지는 안 정했다.
- 관리자 승인 RLS가 `security definer`를 필요로 한다. 컬럼 권한은 역할 단위라 `authenticated`에 `approved_at`을 열면 관리자든 아니든 다 열린다. 지금 스키마는 그 문을 안 열어뒀다.
- integration 테스트가 만든 사용자를 치우지 않는다. anon 키로는 `auth.users`를 못 지우고, 프로필 행 삭제는 테스트가 지키는 바로 그 정책에 걸린다. 지우려면 service role이 필요한데 금지다. `supabase/config.toml`이 IP당 5분에 서른 번으로 가입을 막는데 e2e도 이제 사용자를 만드니, 계정 task를 여러 회차 돌리면 닿는다.
- 테마를 고르는 UI와 그 선택을 어디 저장할지가 미정이다. 기기 설정을 따르되 앱에서 덮을 수 있게 하기로는 정했지만, 그 속성을 실제로 걸어줄 화면이 없다. `tokens.md`의 「아직 안 정한 것」에 있다.
- `scripts/tokens-md.mts`와 `scripts/generate-globals-css.mts`에 `SUBSECTION` 정규식이 각각 있다. 공유 모듈이 export를 안 해서고, 생성기의 `readFences`는 heading에서 번호만 떼는 다른 파서라 표 파서와 계약을 공유하지 않는다. 이번에 막은 「표 파서 두 벌」과는 성격이 달라 그대로 뒀다.
- 도메인 규칙의 미정 항목은 `docs/2-design/domain/`의 각 파일 "아직 안 정한 것" 절이 정본이다. 디자인 값의 미정 항목은 `docs/2-design/design-system/tokens.md`와 `docs/2-design/design-system/pages/`의 같은 이름 절이 정본이다. 여기 옮겨 적지 않는다.
- 로컬에서 연타하면 가입 rate limit에 걸린다. `supabase/config.toml`이 IP당 5분에 30번이다. CI는 컨테이너가 매번 새로 떠서 무관하다.
- `authenticated`에 `profiles` 테이블 단위 insert와 delete 권한이 열려 있다. 정책이 없어 RLS가 전부 막는 구조다. 지금은 기본 거부라 안전하고 테스트가 delete 쪽을 지킨다.
- shadcn `accent` 매핑 — `bg.brand-weak`로 걸면 드롭다운 hover마다 브랜드 색이 깜빡여 절제 규칙과 부딪힌다. 실제 화면을 보고 `bg.neutral-weak`로 내릴지 판단이 필요하다.
- "8월 28일에 나옵니다" 예시 문장 — 어체가 합쇼체라 해요체 규칙과 어긋나고, `docs/2-design/domain/schedule.md`에 근무표 확정 마감일이 없어 앱이 날짜를 약속할 근거가 없다. `writing.md`에 확인 요청으로 달려 있다.
- 급여 확정 축하 모션 — 축하할 순간 후보로 지목됐는데 `payroll.md`가 급여를 확정하지 않는다고 못 박아 대상을 못 정했다.
- 되돌리기 어려운 동작에 별도 색을 줄지 — 출근 인증과 교대 수락 둘 다 되돌릴 길이 없는데 지금은 같은 `bg.brand-solid`라 한 화면에 브랜드 버튼이 둘 뜰 수 있다.
- `docs/2-design/design-system/tokens.md`의 "빈 상태 화면"과 "브랜드 색 출처" — 빈 상태 화면은 근무 없는 날·급여 0원·알림 0건을 이 팔레트로 아직 안 그려봤다. 브랜드 색 출처는 지금 brand 계열이 공식 브랜드 가이드가 아니라 홀 이미지와 웹사이트 내비게이션에서 뽑은 값이다.
- 세그먼트 목록 — 실제 파일을 보고 정한다.
- `playwright.config.ts`의 CI 리트라이 2 — e2e가 늘고 `workers: 1`까지 겹쳐 전체 실행 시간이 무거워지고 있다. 유지할지 정한다.
- CI가 1분대에서 4분대로 늘었던 것 중 analytics(logflare·vector) 몫은 껐다. 남은 시간이 여전히 아픈지는 몇 회차 더 겪고 정한다.

## 주의

- **`docs/`와 `.claude/`만 바뀐 PR은 CI가 뒤쪽 넷을 건너뛴다.** integration과 build와 e2e와 supabase 기동이다. lint·format·typecheck·단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서만 바꿔도 깨지는 자리가 있다.
- **`.prettierignore`가 `*.md`를 거른다.** 문서에 prettier를 돌려도 아무 일도 안 한다. 저장소 전체 방침이다.
- **pre-commit 훅이 staged 파일의 포맷을 고쳐 인덱스에 다시 올린다.** 일부만 staged된 파일이 포맷에 어긋나면 고치지 않고 커밋을 막는다 — 훅이 고치면 staged 안 한 변경까지 딸려 들어가기 때문이다. 그때는 `pnpm format` 뒤에 직접 `git add` 한다.
- **`tests/lint/` 아래 테스트는 `tdd-guard-unit.py`의 사전 차단 밖이다.** 그 훅은 `src/`로 시작하는 `.ts` 파일만 본다. `tests/lint/generate-globals-css.test.ts`와 `tests/lint/contrast-check.test.ts`도 여기 해당해서, 편집 순간 손이 막히는 장치는 없고 CI의 `pnpm test`가 대신 잡는다.
- **`SUBSECTION` 정규식이 `scripts/tokens-md.mts`와 `scripts/generate-globals-css.mts` 두 곳에 있다.** 표 파서 계약을 공유하는 게 아니라 마크다운 heading 정규식이 우연히 겹친 것이다. 표 형식을 바꿀 땐 둘 다 확인한다.
- **`.mts` 스크립트는 `node --experimental-strip-types`로 돈다.** `pnpm tokens:css`가 그 명령을 감싼다. `tsx`나 `ts-node` 같은 별도 실행기 의존성이 없다.
- **vitest가 `NEXT_PUBLIC_*`을 `process.env`에 안 얹는다.** Vite의 `envPrefix` 기본값이 `VITE_`라서다. env를 읽는 코드를 테스트하려면 `vi.stubEnv`로 명시로 채워야 한다. `.env.local`에 값이 있어도 소용없다.
- **`create-supabase-server-client`는 env가 없으면 던진다.** 이 팩토리를 부르는 새 테스트를 쓸 때 `vi.stubEnv`가 필요하다.
- **`tests/lint/.tmp-format-check/`를 `.gitignore`에 넣지 않는다.** Prettier 3이 `.gitignore`를 기본 ignore 파일로 읽는다. 넣으면 `format-check.test.ts`가 만든 픽스처를 prettier가 건너뛰어 `--check`가 조용히 0으로 끝난다 — 테스트가 사실상 안 도는데 초록으로 보인다.
- **`pnpm typecheck`가 `@supabase/supabase-js`를 못 찾으며 깨지는 일이 반복된다.** `pnpm install --frozen-lockfile`로 복구한다.
- **`pnpm typecheck`와 `pnpm build`가 보는 범위가 다르다.** 빌드는 `tsconfig.build.json`으로 테스트를 뺀 앱 코드만 본다. 테스트 파일의 타입 오류는 `pnpm typecheck`나 `pnpm test`에서만 드러난다.
- **`tests/lint/` 테스트가 worktree 여러 개를 동시에 돌리면 기본 5초 타임아웃에서 흔들린다.** `new ESLint()`가 next·typescript-eslint 설정을 통째로 로드하는 비용이 첫 테스트에 몰린다. `--testTimeout=60000`을 주면 안정적으로 통과한다.
- **`supabase/config.toml`의 analytics가 꺼져 있어 Studio에 Logs 탭이 없다.** 로그 자체는 그대로 남으니 `docker logs supabase_db_la-bie-belle`처럼 컨테이너에서 직접 읽는다. RLS가 막은 순간은 `db` 로그에 `permission denied for table ...`로 찍힌다. 화면이 붙고 API 트래픽을 화면에서 걸러 봐야 할 때가 오면 다시 켠다.
- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다. 포맷 훅도 여기 붙어 있다.
- 새 subagent 정의문은 main에 merge된 뒤에야 호출할 수 있게 등록된다.
- 새 개념이 코드에 등장하면 먼저 `docs/2-design/domain/`에 있는지 확인한다. 용어 정본과 코드 이름을 잇는 장치가 없어서 어긋나도 아무도 안 막는다.
- task 완료 조건이 세 문장을 넘거나 예외 규칙이 둘 이상이면 `docs/2-design/spec/<task>.md`로 승격한다(ADR-002).
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
- type-aware lint(`no-floating-promises` 등)는 속도를 이유로 안 켜져 있다. await 빠진 Supabase 호출 같은 건 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다. 대조 테스트가 픽스처로 oklch 리터럴 문자열을 쥐고 있어서다.
- Wanted Sans는 CDN(jsdelivr) 의존이다. self-host가 아니라서 그 서비스가 죽으면 폰트가 시스템 폴백으로 떨어진다. `layout.tsx`의 `preconnect`는 지연만 줄일 뿐 가용성을 보장하지 않는다.
- CI는 `pnpm build` 앞에서 `supabase status`의 값을 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 넘긴다. `NEXT_PUBLIC_*`은 빌드 시점에 번들에 박히므로 이 순서가 바뀌면, `/`와 `/auth/logout`이 동적 라우트라 빌드는 그대로 통과하고 실행 시점에 `createSupabaseServerClient`가 던져 요청마다 500이 뜬다.
