# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓴다.

## 지금 상태

**`docs/`가 SDLC 여섯 단계 폴더로 섰다.** `1-plan/`(prd·scenarios·roadmap·metrics·intent) → `2-design/`(domain·architecture·design-system·adr·spec) → `3-build/`(plans) → `4-test/`(strategy) → `5-deploy/` → `6-maintain/` 순이다. `handoff.md`·`backlog.md`·`CHANGELOG.md`·`log/`는 어느 단계에도 안 속해 루트에 남는다. 근거와 새 배치 전체는 ADR-005가 정본이다.

**기능마다 intent→spec→plan 사슬을 걷는다.** `1-plan/intent/<슬러그>.md` → `2-design/spec/<슬러그>.md`(완료 조건과 `status` 승인 마크) → `3-build/plans/<슬러그>.md`다. 관문은 spec→구현 한 마디뿐이고 `.claude/hooks/spec-gate.py`가 지킨다 — `feat/<슬러그>` 브랜치에서 `src/`를 고치는데 `docs/2-design/spec/<슬러그>.md`가 없거나 `status: approved`가 아니면 막는다. `feat/`가 아닌 브랜치와 `src/` 밖 경로는 안 막는다.

**`backlog.md`가 `plan.md`를 대체했다.** 행 하나가 task 하나고 완료 조건은 이제 항상 그 행이 링크하는 spec에 산다(ADR-002의 승격 기준을 ADR-005가 대체했다). 지금 「진행」은 비어 있고 「다음」에 셋(대시보드 디자인·로그인 화면·대시보드 구현)이 남아 있는데, 첫 행은 아래 「다음 첫 수」에 적은 대로 상태가 이상하다.

**CLAUDE.md는 라우터다.** 108줄이 58줄로 줄었고 협업 구조를 설명하던 서두가 빠졌다. 근거 산문은 ADR과 design-system README와 정의문으로의 포인터로 바뀌었으니, 왜를 알아야 하면 CLAUDE.md가 아니라 그 정본을 읽는다.

**CI에서 문서만 바뀐 PR은 더 빠르다.** 스킵 패턴이 `docs/`·`.claude/`에 루트 마크다운(`[^/]+\.md$`)까지 넓어져서 문서 전용 PR이 4분대에서 48초로 줄었다. lint·format·typecheck·단위 테스트는 여전히 문서 PR에서도 돈다.

**문서 구조를 지키는 검사 둘이 `pnpm test`에 낀다.** `tests/lint/doc-map.ts`는 CLAUDE.md 문서 지도의 백틱 경로가 실존하는지 확인하고, `tests/lint/legacy-doc-paths.ts`는 개편 전 `docs/` 바로 아래 있던 옛 경로 여섯 종(plan.md · prd.md · domain · adr · spec · design-system)이 문서·정의문·코드에 남았는지 훑는다. `docs/log/`는 당시 사실의 기록이라 통째로 빠진다.

**코드 층은 이번 회차에서 안 건드렸다.** 세션 기반은 서 있고 화면은 아직 없다. 브라우저용 Supabase 클라이언트 팩토리도 없다. `globals.css`는 여전히 `tokens.md`에서 생성되고 7절 대비값은 여전히 기계가 잰다 — 위치만 `docs/2-design/design-system/`으로 옮겨왔다.

## 다음 첫 수

`docs/1-plan/`의 `scenarios.md`·`roadmap.md`·`metrics.md`를 태관 인터뷰로 채운다. 셋 다 #236이 튼 틀만 있고 백지다. 각 파일 안 「틀」 절이 인터뷰에서 물을 항목을 이미 적어뒀다 — 시나리오는 누가·언제·무엇을·어떻게 끝나나, 로드맵은 릴리스별 담는 것·빼는 것·판정 기준, 지표는 이름과 정의·왜 이것인가·목표선이다.

`backlog.md`의 「다음」 첫 행("근무자 대시보드 디자인을 정한다")은 다음 첫 수 후보가 아니다. 그 작업은 PR #225(2026-08-30 merge)가 이미 끝냈다 — 화면 셋(대시보드·출근 인증·사유 시트)을 정하고 시안까지 커밋했다. 그 회차를 기록할 PR #226("2026-08-30 회차를 기록한다")이 `tkyoun0421/design` 브랜치에 열린 채 아직 안 merge돼서, `backlog.md`가 그 완료를 못 옮기고 「다음」에 남아 있다. PR #226을 merge하거나 다시 기록하면 이 행이 「완료」로 내려가고 「로그인 화면과 승인 대기 화면을 만든다」가 「다음」 맨 위로 올라온다.

## 열린 결정

- **PR #226의 처분.** `tkyoun0421/design` 브랜치에 열려 있는 미merge 상태다. merge할지, 닫고 이번 사실 기준으로 다시 기록할지는 총괄 몫이다.
- **2절 표에 「참조」 열을 열지.** `scripts/generate-globals-css.mts`의 `SURFACE_STROKE_IN_DARK = "var(--palette-neutral-200)"`가 값이 문서 밖에 사는 유일한 자리다. `tokens.md` 2절 `stroke.surface` 행의 다크 칸이 hex(`#272523`)라 팔레트 참조로 되돌릴 수 없고 표에 그 참조를 담을 칸도 없어서, 지금은 8절 산문에 그 사실만 적어뒀다. 2절 표에 칸을 열어 끌어올릴지는 안 정했다.
- **`src/` 처분.** "따로 건질 건 없을 것 같다"고 했지만 총괄이 삭제 지시로 읽지 않고 그대로 뒀다 — 되돌리기 어려운 쪽을 기본값으로 삼지 않았다. 실제로 지우려면 말해줘야 한다.
- **권한을 거부한 뒤의 알림 영역 모습.** 브라우저는 한 번 거부하면 다시 묻지 않는다. 첫째 모습(아직 안 켬)을 그대로 두면 눌러도 아무 일이 없는 버튼이 남고, 아이폰 안내를 띄우면 물을 길이 없는 경우와 물었다 거부당한 경우를 뒤섞는다. `docs/2-design/design-system/pages/login.md`의 「아직 안 정한 것」에 있다.
- **거절됐을 때 알림을 보낼지.** 승인이 알림으로 나가니 거절도 대칭으로 나갈 법한데, 거절은 이번만이고 같은 사람이 다시 가입할 수 있다. 통보가 최종 판정처럼 읽히면 다시 올 사람을 돌려세운다. 안 보내면 승인 대기 화면에 계속 남는다. `docs/2-design/domain/notification.md`에 있다.
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
- 테마를 고르는 UI와 그 선택을 어디 저장할지가 미정이다. 기기 설정을 따르되 앱에서 덮을 수 있게 하기로는 정했지만, 그 속성을 실제로 걸어줄 화면이 없다. `docs/2-design/design-system/tokens.md`의 「아직 안 정한 것」에 있다.
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
- CI가 1분대에서 4분대로 늘었던 것 중 analytics(logflare·vector) 몫은 껐다. 문서 전용 PR은 이번 회차에서 48초로 줄었지만, 코드가 낀 PR의 남은 시간이 여전히 아픈지는 몇 회차 더 겪고 정한다.

## 주의

- **`docs/`·`.claude/`·루트 마크다운만 바뀐 PR은 CI가 뒤쪽 넷(integration·build·e2e·supabase 기동)을 건너뛴다.** 스킵 패턴이 이번 회차에서 루트 md까지 넓어졌다. lint·format·typecheck·단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서만 바꿔도 깨지는 자리가 있다.
- **`pnpm test`에 문서 구조를 지키는 검사 둘이 낀다.** `tests/lint/doc-map.ts`(CLAUDE.md 문서 지도 경로 실존 확인)와 `tests/lint/legacy-doc-paths.ts`(옛 경로 잔존 검사)다. 문서를 옮길 땐 CLAUDE.md 문서 지도를 같이 갱신하고, 옛 경로 문자열을 새로 남기지 않는다. `docs/log/`는 검사 밖이라 당시 경로를 그대로 써도 된다.
- **`feat/<슬러그>` 브랜치에서 `src/`를 고치려면 `docs/2-design/spec/<슬러그>.md`가 `status: approved`여야 한다.** `.claude/hooks/spec-gate.py`가 막는다. `feat/`가 아닌 브랜치(문서·리팩터링·수리)는 게이트 밖이다.
- **CLAUDE.md는 이제 라우터다.** 왜에 해당하는 산문은 CLAUDE.md에 없고 ADR과 각 정본 문서(design-system README, 정의문)에 있다. CLAUDE.md만 읽고 근거를 찾으려 하지 않는다.
- **`docs/2-design/spec/`의 완료 조건은 이제 모든 task에 의무다.** ADR-002의 승격 기준(세 문장 넘으면 승격)은 ADR-005가 대체했다 — 문장 길이와 무관하게 spec이 항상 완료 조건의 집이다.
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
- integration 테스트를 돌리려면 로컬에 Docker가 떠 있어야 한다. `pnpm test:integration`이 `supabase start`부터 하니 못 뜨면 그 자리에서 멈춘다.
- `vitest.config.ts`가 CommonJS로 읽히는데 ESM 문법이라 실행할 때마다 경고가 뜬다. 동작에는 영향이 없다.
- type-aware lint(`no-floating-promises` 등)는 속도를 이유로 안 켜져 있다. await 빠진 Supabase 호출 같은 건 lint가 못 잡는다.
- 디자인 값 lint 규칙은 `src/**/__tests__/**`를 예외로 둔다. 대조 테스트가 픽스처로 oklch 리터럴 문자열을 쥐고 있어서다.
- Wanted Sans는 CDN(jsdelivr) 의존이다. self-host가 아니라서 그 서비스가 죽으면 폰트가 시스템 폴백으로 떨어진다. `layout.tsx`의 `preconnect`는 지연만 줄일 뿐 가용성을 보장하지 않는다.
- CI는 `pnpm build` 앞에서 `supabase status`의 값을 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`로 넘긴다. `NEXT_PUBLIC_*`은 빌드 시점에 번들에 박히므로 이 순서가 바뀌면, `/`와 `/auth/logout`이 동적 라우트라 빌드는 그대로 통과하고 실행 시점에 `createSupabaseServerClient`가 던져 요청마다 500이 뜬다.
