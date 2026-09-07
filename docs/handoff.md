# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 첫 수」를 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다(태관, 2026-09-07).

## 지금 상태

**근무자 ①근무표 보기가 2026-09-07에 봉인됐다(#262).** schedule-admin 인터뷰 봉인과 화면 아홉 디자인(#258)에서 시작해 시안 검수 라운드(#260 달력 칸 두 단·마감일·교육 붙이기, #261 열린 칸 면 채움·빈 자리 점선 원)를 거치고, 근무자 근무표 보기 자체도 비교 시안 세 라운드를 돈 뒤 문서(`pages/schedule-worker.md`) + 시안(`schedule-worker.sian.html`) + 도메인 셋(`swap.md`·`schedule.md`·`notification.md`) + `components.md` 날짜 칸이 한 PR(#262)로 정본에 들어갔다.

**검수 방식이 스크래치 비교 시안으로 굳었다.** 정본 시안을 바로 고치는 대신 임시 HTML로 후보 여러 안(예: 열린 날 칸의 카드/회색/브랜드, 빈 자리의 글자/윤곽/점선 원/경고색)을 나란히 놓고 태관이 골라, 결정이 끝난 값만 정본에 반영하는 순서가 schedule-admin 2차 검수(#261)에서 처음 쓰이고 근무자 화면 검수까지 이어졌다.

**정본 시안에 시나리오 보기가 처음 들어갔다(#262).** 그리드 목업 DOM을 재사용해 scenarios.md 장면 4를 순서대로 다섯 장 넘겨 보는 방식이다. 이 흐름 재생이 「보낸 뒤」(요청 중 배지·버튼 잠금)와 「실패와 경합」(사유 글자 수 상한 등) 절이 문서·시안 둘 다에 없었다는 걸 드러냈고, 그 자리를 메우며 design-system README에 「해피 패스는 끝까지 그린다」 조항이 새로 섰다. 다음 화면 시안에도 시나리오 보기가 이어지면 `sian-writer` 정의문으로 추출한다.

**sian-writer 모델이 opus에서 sonnet으로 바뀌었다(#262, #259 뒤집음).** 첫 실전(엣지 절 추가)이 반려 없이 통과했다. 반려가 늘면 되돌린다.

**도메인이 셋 넓어졌다.** 근무 취소가 확정 뒤 바꾸는 길 다섯째로 붙었다(사유 필수·관리자 승인·승인 전 근무 유지). 교대 요청은 여럿에게 동시에 보낼 수 있고 수락이 여럿이면 관리자가 골라 승인한다. 알림은 근무 취소가 아홉째 단계로 붙었다. 이 확장이 관리자 화면에 남기는 파장(교대 수락자 고르기·취소 승인 자리, 교대 받는 쪽 화면)은 아직 안 그려졌다 — 아래 「다음 첫 수」.

**정본 문서에서 결정 주체·날짜 괄호 표기를 걷어냈다.** 이력은 커밋이 담당한다는 방향이고, 이번 PR이 새로 쓴 절부터 이 표기가 없다.

**로그인 화면과 승인 대기 화면은 그 전 회차에 이미 섰다.** 라우트 넷(`/login`, `/pending`, `/`, `/auth/callback`)과 검수 루프 첫 실전, 구글 G 로고 자산 처리가 spec 승인(#250)부터 구글 로고(#253)까지로 끝났다 — 자세한 내용은 `docs/log/2026-09-07.md`. 관찰 001~004는 그때 archive로 옮겨졌다.

**`backlog.md`「다음」에는 대시보드 하나만 남았다.** 화면 디자인 작업(schedule-admin, schedule-worker)은 spec 승인 파이프라인 밖에서 로드맵 순서 규칙(`1-plan/roadmap.md`)을 따라 진행 중이라 backlog.md에 개별 행으로 안 올라와 있다 — 이 파일의 「다음 첫 수」가 그 진행을 대신 추적한다.

## 다음 첫 수

②휴무 희망 제출 인터뷰가 다음 첫 수다 — 근무자 ①근무표 보기의 미정 「확정 전·근무표 없는 달의 모습」(점선 달력, 안내 문구, 휴무 희망 제출로 잇는 문)과 얽혀 같이 정한다.

관리자 쪽 파장 — 교대 수락자 중 고르기와 근무 취소 승인이 관리자 화면 어딘가에 서야 한다. ⑦사유 승인·거절을 그릴 때 같이 본다. 교대 요청 받는 쪽 화면(수락·거절)도 화면 목록에 새로 필요하다. 남은 「제안」: 관리자 푸시 시점(예식 3일 전 저녁 9시).

남은 화면 목록(⑥ 뒤 순서 미정):

- 근무자: ②휴무 희망 제출(근무표 생성 뒤 마감일까지) ③급여 조회(주/월/연, 확정 없이 재계산되는 예상치) ④프로필(이름 입력·수정, 승인 전에도 열림) — ①근무표 보기는 2026-09-07 봉인
- 근무자 파생: 교대 요청 받는 쪽 화면(수락·거절)이 목록에 없다 — swap 절차가 확정돼 필요해졌다. 순서 정할 때 같이 본다
- 관리자: ⑤가입 대기 목록(승인·거절·차단, 사진으로 동명이인 구분) ⑦사유 승인·거절 ⑧시급 설정·조정 ⑨QR 갱신 ⑩직원 관리(관리자 승격·퇴사)
- 알림은 별도 화면이 없다 — 푸시 + 대시보드 맨 위 안 본 알림(설계 완료)

화면을 그리다 만날 도메인 미정은 각 정본의 「아직 안 정한 것」에 있다 — 사유 거절 뒤 처리와 QR 갱신 통지(attendance), 차단 해제·퇴사자 로그인·계정 연결(account), 거절 알림·강제 변경 통지·금요일 확정 겹침(notification), 확정 뒤 날 열기(schedule), 공휴일 API 실패(payroll). 해당 화면 인터뷰에서 같이 정한다.

## 열린 결정

- **로고 렌더를 지키는 테스트가 없다.** `public/google-g.svg`를 지워도 e2e 11개가 초록이다. 「버튼 안 로고의 `background-image`가 비어 있지 않다」는 e2e 한 줄이 후보다.
- **CI가 chromium만 돈다.** 주 타깃이 아이폰 사파리인데 webkit을 안 본다.
- **뛰는 점의 진폭이 `tokens.md`에 없다.** 등장 모션의 최솟값 0.9를 빌려 썼는데(6px 점에서 0.6px 변화라 눈에 잘 안 띈다), 실제 화면을 보고 정한다.
- **Button hover 조항이 `components.md` 표에 없다.** secondary·ghost·destructive의 눌림 배경도 아직 shadcn 기본값이다.
- **`motion.md`에 `delay-*` 함정이 문서화돼 있지 않다.** core Tailwind의 `transition-delay`가 이겨서 `tw-animate-css`를 쓰려면 `[--tw-animation-delay]`로 우회해야 하는데, 이게 라이브러리 내부 변수라 이름이 바뀌면 조용히 죽는다. 잡는 테스트가 없다.
- **`pages/login.md` 23행의 가운데 덩이 위치 서술이 두 가지로 읽힌다.** "남는 공간을 위아래가 반씩 나눈다"와 "화면 한가운데에 선다"가 정확히 같은 자리가 아니다. 탭 제목("La Bie Belle" vs "라비에벨") 조항도 없다.
- **2절 표에 「참조」 열을 열지.** `scripts/generate-globals-css.mts`의 `SURFACE_STROKE_IN_DARK = "var(--palette-neutral-200)"`가 값이 문서 밖에 사는 유일한 자리다. `tokens.md` 2절 `stroke.surface` 행의 다크 칸이 hex(`#272523`)라 팔레트 참조로 되돌릴 수 없고 표에 그 참조를 담을 칸도 없어서, 지금은 8절 산문에 그 사실만 적어뒀다.
- **`src/` 처분.** "따로 건질 건 없을 것 같다"고 했지만 총괄이 삭제 지시로 읽지 않고 그대로 뒀다 — 되돌리기 어려운 쪽을 기본값으로 삼지 않았다. 실제로 지우려면 말해줘야 한다.
- **권한을 거부한 뒤의 알림 영역 모습.** 브라우저는 한 번 거부하면 다시 묻지 않는다. 첫째 모습(아직 안 켬)을 그대로 두면 눌러도 아무 일이 없는 버튼이 남고, 아이폰 안내를 띄우면 물을 길이 없는 경우와 물었다 거부당한 경우를 뒤섞는다. `pages/login.md`의 「아직 안 정한 것」에 있다.
- **거절됐을 때 알림을 보낼지.** 승인이 알림으로 나가니 거절도 대칭으로 나갈 법한데, 거절은 이번만이고 같은 사람이 다시 가입할 수 있다. 통보가 최종 판정처럼 읽히면 다시 올 사람을 돌려세운다. 안 보내면 승인 대기 화면에 계속 남는다. `docs/2-design/domain/notification.md`에 있다.
- **구글 버튼의 Google Sans Medium.** 구글 문서가 그 서체를 적었는데 서드파티 웹에 배포되지 않아 우리 서체로 그려야 한다. 그 어긋남을 OAuth 심사가 어떻게 보는지 모른다. 버튼 이미지를 통째로 쓰면 규정에 맞지만 문구를 우리말로 못 쓴다.
- **라이트와 다크에서 구글 버튼 테마를 나눌지.** 지금은 양쪽 다 어두운 배경 하나고, 라이트와 중립 테마의 값은 `tokens.md`에 안 옮겼다. 구글이 테마별로 다른 버튼을 쓰는 것을 막지 않는다. 실제 화면을 보고 정한다.
- **알림 블록의 중립 종류를 `components.md`에 올릴지.** 「아직 안 켬」이 안내·성공·경고·오류 넷 중 어디도 아니라 `bg.neutral-weak`로 깔았다. 화면 하나를 근거로 공용 컴포넌트를 늘리기에는 일러서 미뤘다. 다른 화면에서 같은 모양이 한 번 더 나오면 그때 올린다.
- **브랜드 색이 한 화면에 둘인 자리.** 승인 대기 화면에 알약(`bg.brand-weak`)과 「알림 켜기」(`bg.brand-solid`)가 같이 선다. 무게가 갈려 지금은 지나갔지만 실제 화면에서 다시 본다. 헤더에 로고를 두는 화면이 생기면 같은 판단이 한 번 더 필요하다 — `color.md`가 그 조건을 적어뒀다.
- env가 없으면 미들웨어가 모든 요청에서 던져 앱 전체가 500이 된다. 조용한 로그아웃보다 낫다고 판단해 그렇게 갔지만, 사용자에게는 Next 기본 에러 화면이 뜬다. `error.tsx`를 다룰 때 같이 본다.
- 미들웨어에 `matcher`가 없다. 함수 안에서 정적 자원을 걸러내는데 `export const config = { matcher }`를 쓰면 실행 자체를 안 한다. 동작은 맞고 명세도 지켰으니 성능 판단으로 남겨뒀다.
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
- `docs/2-design/design-system/tokens.md`의 "브랜드 색 출처" — 지금 brand 계열이 공식 브랜드 가이드가 아니라 홀 이미지와 웹사이트 내비게이션에서 뽑은 값이다.
- 세그먼트 목록 — 실제 파일을 보고 정한다.
- `playwright.config.ts`의 CI 리트라이 2 — e2e가 늘고 `workers: 1`까지 겹쳐 전체 실행 시간이 무거워지고 있다. 유지할지 정한다.
- CI가 1분대에서 4분대로 늘었던 것 중 analytics(logflare·vector) 몫은 껐다. 문서 전용 PR은 48초로 줄었지만, 코드가 낀 PR의 남은 시간이 여전히 아픈지는 몇 회차 더 겪고 정한다.

## 주의

- **`docs/`·`.claude/`·루트 마크다운만 바뀐 PR은 CI가 뒤쪽 넷(integration·build·e2e·supabase 기동)을 건너뛴다.** 스킵 패턴이 루트 md까지 넓다. lint·format·typecheck·단위 테스트는 그때도 돈다 — 문서가 테스트 입력이라 문서만 바꿔도 깨지는 자리가 있다.
- **`pnpm test`에 문서 구조를 지키는 검사 둘이 낀다.** `tests/lint/doc-map.ts`(CLAUDE.md 문서 지도 경로 실존 확인)와 `tests/lint/legacy-doc-paths.ts`(옛 경로 잔존 검사)다. 문서를 옮길 땐 CLAUDE.md 문서 지도를 같이 갱신하고, 옛 경로 문자열을 새로 남기지 않는다. `docs/log/`는 검사 밖이라 당시 경로를 그대로 써도 된다.
- **`feat/<슬러그>` 브랜치에서 `src/`를 고치려면 `docs/2-design/spec/<슬러그>.md`가 `status: approved`여야 한다.** `.claude/hooks/spec-gate.py`가 막는다. `feat/`가 아닌 브랜치(문서·리팩터링·수리)는 게이트 밖이다.
- **`tdd-guard-e2e.py`가 `src/screens/` 아래 순수 `.ts`도 화면으로 오판한다.** `spec_name()`이 접두사만 보고 확장자를 안 봐서, `model/` 아래 로직 파일까지 `tests/e2e/<이름>.spec.ts`를 요구할 수 있다. 관찰 006이 열려 있고 아직 안 고쳐졌다 — 이런 파일을 계획할 때 unit 테스트 작성 순서가 밀릴 수 있다.
- **여러 계층을 내려다보는 조립 코드는 `src/app/`으로 흘러가고 짝 테스트 요구가 없다.** `auth-gate.ts`가 그 예다 — entities와 shared를 같이 부르는 코드가 FSD 계층 규칙과 `tdd-guard-unit.py` 둘 다 피해 훅 사각으로 갔다. e2e만 이 배선을 검증한다. 관찰 007이 자리 규칙 자체를 총괄 결정 대상으로 올려뒀다.
- **CLAUDE.md는 이제 라우터다.** 왜에 해당하는 산문은 CLAUDE.md에 없고 ADR과 각 정본 문서(design-system README, 정의문)에 있다. CLAUDE.md만 읽고 근거를 찾으려 하지 않는다.
- **`docs/2-design/spec/`의 완료 조건은 이제 모든 task에 의무다.** ADR-002의 승격 기준(세 문장 넘으면 승격)은 ADR-005가 대체했다 — 문장 길이와 무관하게 spec이 항상 완료 조건의 집이다.
- **`.prettierignore`가 `*.md`를 거른다.** 문서에 prettier를 돌려도 아무 일도 안 한다. 저장소 전체 방침이다.
- **pre-commit 훅이 staged 파일의 포맷을 고쳐 인덱스에 다시 올린다.** 일부만 staged된 파일이 포맷에 어긋나면 고치지 않고 커밋을 막는다 — 훅이 고치면 staged 안 한 변경까지 딸려 들어가기 때문이다. 그때는 `pnpm format` 뒤에 직접 `git add` 한다.
- **`tdd-guard-unit.py`가 `tests/lint/`도 짝 테스트를 요구한다.** 감시 접두사에 `src/`와 `tests/lint/` 둘 다 있다. `tests/` 아래에서는 짝을 `__tests__/`가 아니라 형제 `<이름>.test.ts`로 찾는다 — 그 디렉터리 관례가 형제 배치라서다. `tests/e2e/`는 여전히 감시 밖이라 CI의 `pnpm test`가 대신 잡는다. `tests/lint/rule-check.ts`는 지금 짝 테스트가 없어서 이 파일을 고치려면 먼저 `rule-check.test.ts`를 써야 한다.
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
